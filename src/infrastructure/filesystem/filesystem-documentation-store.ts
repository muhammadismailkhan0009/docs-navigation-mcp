import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import type {
  AddDocumentationNode,
  DocumentationDocument,
  DocumentationNode,
  DocumentationNodePage,
  RemoveNodesResult,
  UpdateDocumentationNode,
} from "../../domain/documentation-node.js";
import type {
  CreateDocumentationSource,
  DocumentationSource,
} from "../../domain/documentation-source.js";
import {
  nodeRecordSchema,
  sourceRecordSchema,
  type NodeRecord,
  type SourceRecord,
} from "./filesystem-records.js";
export class FilesystemDocumentationStore implements DocumentationStore {
  private readonly repositoryPaths: readonly string[];

  constructor(repositoryPaths: readonly string[]) {
    if (repositoryPaths.length === 0) {
      throw new Error("At least one documentation repository is required.");
    }
    this.repositoryPaths = repositoryPaths.map((repositoryPath) =>
      path.resolve(repositoryPath),
    );
  }

  async listSources(): Promise<readonly DocumentationSource[]> {
    const sources = new Map<string, SourceRecord>();

    for (const repositoryPath of this.repositoryPaths) {
      for (const source of await this.readRepositorySources(repositoryPath)) {
        if (sources.has(source.id)) {
          throw new Error(`Duplicate source id found: ${source.id}`);
        }
        sources.set(source.id, source);
      }
    }

    return [...sources.values()].sort(compareSources);
  }
  async createSource(
    input: CreateDocumentationSource,
  ): Promise<DocumentationSource> {
    const source: SourceRecord = {
      id: `source_${randomUUID()}`,
      name: input.name,
      type: input.type,
      ...(input.version === undefined ? {} : { version: input.version }),
      ...(input.origin === undefined ? {} : { origin: input.origin }),
    };

    const sourceDirectory = this.sourceDirectory(
      this.repositoryPaths[0]!,
      source.id,
    );
    await mkdir(this.nodesDirectory(sourceDirectory), { recursive: true });
    await mkdir(this.contentDirectory(sourceDirectory), { recursive: true });
    await this.writeJson(this.sourceFile(sourceDirectory), source);

    return source;
  }

  async removeSource(sourceId: string): Promise<void> {
    const sourceDirectory = await this.findSourceDirectory(sourceId);
    await rm(sourceDirectory, { recursive: true, force: true });
  }
  async listChildren(
    sourceId: string,
    parentId: string | undefined,
    limit: number,
    cursor: string | undefined,
  ): Promise<DocumentationNodePage> {
    const sourceDirectory = await this.findSourceDirectory(sourceId);
    const nodes = await this.readNodes(sourceDirectory);

    if (parentId !== undefined && !nodes.has(parentId)) {
      throw new Error(`Node not found: ${parentId}`);
    }

    const children = [...nodes.values()]
      .filter((node) =>
        parentId === undefined
          ? node.parentIds.length === 0
          : node.parentIds.includes(parentId),
      )
      .sort(compareNodes);

    const offset = parseCursor(cursor, children.length);
    const items = children.slice(offset, offset + limit);
    const nextOffset = offset + items.length;

    return {
      items,
      ...(nextOffset < children.length
        ? { nextCursor: String(nextOffset) }
        : {}),
    };
  }
  async fetchDocs(
    sourceId: string,
    nodeIds: readonly string[],
  ): Promise<readonly DocumentationDocument[]> {
    const sourceDirectory = await this.findSourceDirectory(sourceId);
    const nodes = await this.readNodes(sourceDirectory);
    const documents: DocumentationDocument[] = [];

    for (const nodeId of nodeIds) {
      const node = nodes.get(nodeId);
      if (node === undefined) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      const content = node.hasContent
        ? await readFile(this.contentFile(sourceDirectory, node.id), "utf8")
        : null;
      documents.push({ ...node, content });
    }

    return documents;
  }
  async addNodes(
    sourceId: string,
    inputs: readonly AddDocumentationNode[],
  ): Promise<readonly DocumentationNode[]> {
    const sourceDirectory = await this.findSourceDirectory(sourceId);
    const existing = await this.readNodes(sourceDirectory);

    for (const input of inputs) {
      this.assertParentsExist(input.parentIds, existing);
    }

    const records = inputs.map((input): NodeRecord => ({
      id: `node_${randomUUID()}`,
      sourceId,
      title: input.title,
      parentIds: uniqueIds(input.parentIds),
      hasContent: input.content !== undefined,
      ...(input.sourceRef === undefined ? {} : { sourceRef: input.sourceRef }),
      ...(input.contentType === undefined ? {} : { contentType: input.contentType }),
      ...(input.position === undefined ? {} : { position: input.position }),
    }));

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index]!;
      const input = inputs[index]!;
      await this.writeNode(sourceDirectory, record);
      if (input.content !== undefined) {
        await writeFile(
          this.contentFile(sourceDirectory, record.id),
          input.content,
          "utf8",
        );
      }
    }

    return records;
  }

  async updateNodes(
    sourceId: string,
    updates: readonly UpdateDocumentationNode[],
  ): Promise<readonly DocumentationNode[]> {
    const sourceDirectory = await this.findSourceDirectory(sourceId);
    const existing = await this.readNodes(sourceDirectory);
    const candidates = new Map(existing);
    const updated: NodeRecord[] = [];

    for (const update of updates) {
      const current = existing.get(update.id);
      if (current === undefined) {
        throw new Error(`Node not found: ${update.id}`);
      }
      const candidate = this.applyUpdate(current, update);
      this.assertParentsExist(candidate.parentIds, existing);
      if (candidate.parentIds.includes(candidate.id)) {
        throw new Error(`Node cannot be its own parent: ${candidate.id}`);
      }
      candidates.set(candidate.id, candidate);
      updated.push(candidate);
    }

    assertAcyclic(candidates);

    for (let index = 0; index < updates.length; index += 1) {
      const update = updates[index]!;
      const record = updated[index]!;
      await this.writeNode(sourceDirectory, record);

      if (update.content === null) {
        await this.removeContentFile(sourceDirectory, record.id);
      } else if (update.content !== undefined) {
        await writeFile(
          this.contentFile(sourceDirectory, record.id),
          update.content,
          "utf8",
        );
      }
    }

    return updated;
  }
  async removeNodes(
    sourceId: string,
    nodeIds: readonly string[],
    recursive: boolean,
  ): Promise<RemoveNodesResult> {
    const sourceDirectory = await this.findSourceDirectory(sourceId);
    const nodes = await this.readNodes(sourceDirectory);
    const removed = new Set(uniqueIds(nodeIds));

    for (const nodeId of removed) {
      if (!nodes.has(nodeId)) {
        throw new Error(`Node not found: ${nodeId}`);
      }
    }

    if (recursive) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const node of nodes.values()) {
          if (removed.has(node.id) || node.parentIds.length === 0) continue;
          if (node.parentIds.every((parentId) => removed.has(parentId))) {
            removed.add(node.id);
            changed = true;
          }
        }
      }
    }
    const updated: NodeRecord[] = [];
    for (const node of nodes.values()) {
      if (removed.has(node.id)) continue;
      const parentIds = node.parentIds.filter((parentId) => !removed.has(parentId));
      if (parentIds.length !== node.parentIds.length) {
        updated.push({ ...node, parentIds });
      }
    }

    for (const nodeId of removed) {
      await rm(this.nodeFile(sourceDirectory, nodeId), { force: true });
      await this.removeContentFile(sourceDirectory, nodeId);
    }
    for (const node of updated) {
      await this.writeNode(sourceDirectory, node);
    }

    return {
      removedNodeIds: [...removed],
      updatedNodeIds: updated.map((node) => node.id),
    };
  }
  private applyUpdate(
    current: NodeRecord,
    update: UpdateDocumentationNode,
  ): NodeRecord {
    const hasContent =
      update.content === null
        ? false
        : update.content === undefined
          ? current.hasContent
          : true;
    const sourceRef =
      update.sourceRef === undefined ? current.sourceRef : update.sourceRef ?? undefined;
    const contentType =
      update.content === null
        ? undefined
        : update.contentType === undefined
          ? current.contentType
          : update.contentType ?? undefined;
    const position =
      update.position === undefined ? current.position : update.position ?? undefined;

    return {
      id: current.id,
      sourceId: current.sourceId,
      title: update.title ?? current.title,
      parentIds:
        update.parentIds === undefined
          ? current.parentIds
          : uniqueIds(update.parentIds),
      hasContent,
      ...(sourceRef === undefined ? {} : { sourceRef }),
      ...(contentType === undefined ? {} : { contentType }),
      ...(position === undefined ? {} : { position }),
    };
  }

  private assertParentsExist(
    parentIds: readonly string[],
    nodes: ReadonlyMap<string, NodeRecord>,
  ): void {
    for (const parentId of uniqueIds(parentIds)) {
      if (!nodes.has(parentId)) {
        throw new Error(`Parent node not found: ${parentId}`);
      }
    }
  }

  private async findSourceDirectory(sourceId: string): Promise<string> {
    const matches: string[] = [];

    for (const repositoryPath of this.repositoryPaths) {
      const candidate = this.sourceDirectory(repositoryPath, sourceId);
      const source = await this.readSource(candidate);
      if (source?.id === sourceId) matches.push(candidate);
    }

    if (matches.length === 0) throw new Error(`Source not found: ${sourceId}`);
    if (matches.length > 1) {
      throw new Error(`Duplicate source id found: ${sourceId}`);
    }
    return matches[0]!;
  }

  private async readRepositorySources(
    repositoryPath: string,
  ): Promise<readonly SourceRecord[]> {
    const entries = await safeReadDirectory(path.join(repositoryPath, "sources"));
    const sources: SourceRecord[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const source = await this.readSource(
        path.join(repositoryPath, "sources", entry.name),
      );
      if (source !== null) sources.push(source);
    }
    return sources;
  }

  private async readSource(sourceDirectory: string): Promise<SourceRecord | null> {
    try {
      return sourceRecordSchema.parse(
        JSON.parse(await readFile(this.sourceFile(sourceDirectory), "utf8")),
      );
    } catch (error) {
      if (isMissingFileError(error)) return null;
      throw error;
    }
  }

  private async readNodes(
    sourceDirectory: string,
  ): Promise<Map<string, NodeRecord>> {
    const entries = await safeReadDirectory(this.nodesDirectory(sourceDirectory));
    const nodes = new Map<string, NodeRecord>();

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const record = nodeRecordSchema.parse(
        JSON.parse(
          await readFile(
            path.join(this.nodesDirectory(sourceDirectory), entry.name),
            "utf8",
          ),
        ),
      );
      if (nodes.has(record.id)) {
        throw new Error(`Duplicate node id found: ${record.id}`);
      }
      nodes.set(record.id, record);
    }
    return nodes;
  }

  private async writeNode(
    sourceDirectory: string,
    node: NodeRecord,
  ): Promise<void> {
    await this.writeJson(this.nodeFile(sourceDirectory, node.id), node);
  }

  private async writeJson(filePath: string, value: unknown): Promise<void> {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }

  private async removeContentFile(
    sourceDirectory: string,
    nodeId: string,
  ): Promise<void> {
    try {
      await unlink(this.contentFile(sourceDirectory, nodeId));
    } catch (error) {
      if (!isMissingFileError(error)) throw error;
    }
  }

  private sourceDirectory(repositoryPath: string, sourceId: string): string {
    return path.join(repositoryPath, "sources", sourceId);
  }
  private sourceFile(sourceDirectory: string): string {
    return path.join(sourceDirectory, "source.json");
  }

  private nodesDirectory(sourceDirectory: string): string {
    return path.join(sourceDirectory, "nodes");
  }

  private contentDirectory(sourceDirectory: string): string {
    return path.join(sourceDirectory, "content");
  }

  private nodeFile(sourceDirectory: string, nodeId: string): string {
    return path.join(this.nodesDirectory(sourceDirectory), `${nodeId}.json`);
  }

  private contentFile(sourceDirectory: string, nodeId: string): string {
    return path.join(this.contentDirectory(sourceDirectory), `${nodeId}.content`);
  }
}
async function safeReadDirectory(directory: string) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

function parseCursor(cursor: string | undefined, size: number): number {
  if (cursor === undefined) return 0;
  if (!/^\d+$/.test(cursor)) throw new Error("Cursor must be a non-negative integer.");
  const offset = Number(cursor);
  if (!Number.isSafeInteger(offset) || offset > size) {
    throw new Error("Cursor is outside the available result range.");
  }
  return offset;
}

function compareSources(left: SourceRecord, right: SourceRecord): number {
  return (
    left.type.localeCompare(right.type) ||
    left.name.localeCompare(right.name) ||
    (left.version ?? "").localeCompare(right.version ?? "") ||
    left.id.localeCompare(right.id)
  );
}

function compareNodes(left: NodeRecord, right: NodeRecord): number {
  const leftPosition = left.position ?? Number.POSITIVE_INFINITY;
  const rightPosition = right.position ?? Number.POSITIVE_INFINITY;
  return (
    leftPosition - rightPosition ||
    left.title.localeCompare(right.title) ||
    left.id.localeCompare(right.id)
  );
}
function assertAcyclic(nodes: ReadonlyMap<string, NodeRecord>): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string): void => {
    if (visiting.has(nodeId)) {
      throw new Error(`Hierarchy cycle detected at node: ${nodeId}`);
    }
    if (visited.has(nodeId)) return;

    const node = nodes.get(nodeId);
    if (node === undefined) throw new Error(`Node not found: ${nodeId}`);

    visiting.add(nodeId);
    for (const parentId of node.parentIds) visit(parentId);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const nodeId of nodes.keys()) visit(nodeId);
}
