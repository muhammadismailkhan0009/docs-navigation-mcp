import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FilesystemDocumentationStore } from "../src/infrastructure/filesystem/filesystem-documentation-store.js";

describe("FilesystemDocumentationStore", () => {
  let temporaryDirectory: string;
  let firstRepository: string;
  let secondRepository: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), "docs-navigation-mcp-"),
    );
    firstRepository = path.join(temporaryDirectory, "first");
    secondRepository = path.join(temporaryDirectory, "second");
    await Promise.all([
      mkdir(firstRepository, { recursive: true }),
      mkdir(secondRepository, { recursive: true }),
    ]);
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });
  it("creates, navigates, reads, updates, and removes documentation", async () => {
    const store = new FilesystemDocumentationStore([firstRepository]);
    const source = await store.createSource({
      name: "UIFlow",
      type: "library",
      version: "0.4.0",
    });

    const [core, ssr] = await store.addNodes(source.id, [
      { title: "Core Concepts", parentIds: [] },
      { title: "SSR", parentIds: [] },
    ]);
    expect(core).toBeDefined();
    expect(ssr).toBeDefined();

    const [view] = await store.addNodes(source.id, [
      {
        title: "View",
        parentIds: [core!.id],
        content: "Views render flow UI.",
        contentType: "text/markdown",
      },
    ]);
    const raw = "<p>State can pass between views & SSR.</p>";
    const [state] = await store.addNodes(source.id, [
      {
        title: "State Passing",
        parentIds: [view!.id, ssr!.id],
        content: raw,
        contentType: "text/html",
        position: 3,
      },
    ]);

    const roots = await store.listChildren(source.id, undefined, 100, undefined);
    expect(roots.items.map((node) => node.title)).toEqual([
      "Core Concepts",
      "SSR",
    ]);

    const coreChildren = await store.listChildren(
      source.id,
      core!.id,
      100,
      undefined,
    );
    expect(coreChildren.items.map((node) => node.id)).toEqual([view!.id]);

    const fetched = await store.fetchDocs(source.id, [state!.id]);
    expect(fetched[0]?.content).toBe(raw);
    const [updated] = await store.updateNodes(source.id, [
      {
        id: state!.id,
        content: "Updated raw documentation.",
        sourceRef: "docs/state.md",
      },
    ]);
    expect(updated?.sourceRef).toBe("docs/state.md");
    expect((await store.fetchDocs(source.id, [state!.id]))[0]?.content).toBe(
      "Updated raw documentation.",
    );

    const [cleared] = await store.updateNodes(source.id, [
      {
        id: state!.id,
        sourceRef: null,
        contentType: null,
        position: null,
      },
    ]);
    expect(cleared?.sourceRef).toBeUndefined();
    expect(cleared?.contentType).toBeUndefined();
    expect(cleared?.position).toBeUndefined();

    const removal = await store.removeNodes(source.id, [view!.id], true);
    expect(removal.removedNodeIds).toEqual([view!.id]);
    expect(removal.updatedNodeIds).toContain(state!.id);

    const ssrChildren = await store.listChildren(
      source.id,
      ssr!.id,
      100,
      undefined,
    );
    expect(ssrChildren.items.map((node) => node.id)).toContain(state!.id);
    expect(await store.fetchDocs(source.id, [state!.id])).toHaveLength(1);
    await store.removeSource(source.id);
    expect(await store.listSources()).toEqual([]);
  });

  it("allows duplicate titles because node IDs are canonical", async () => {
    const store = new FilesystemDocumentationStore([firstRepository]);
    const source = await store.createSource({ name: "Nim", type: "language" });
    const [manual, library] = await store.addNodes(source.id, [
      { title: "Manual", parentIds: [] },
      { title: "Standard Library", parentIds: [] },
    ]);

    const duplicateNodes = await store.addNodes(source.id, [
      { title: "Networking", parentIds: [manual!.id], content: "Manual docs" },
      { title: "Networking", parentIds: [library!.id], content: "Library docs" },
    ]);

    expect(duplicateNodes[0]?.id).not.toBe(duplicateNodes[1]?.id);
    expect(
      (await store.listChildren(source.id, manual!.id, 100, undefined)).items[0]
        ?.id,
    ).toBe(duplicateNodes[0]?.id);
  });
  it("rejects hierarchy cycles", async () => {
    const store = new FilesystemDocumentationStore([firstRepository]);
    const source = await store.createSource({ name: "D", type: "language" });
    const [parent] = await store.addNodes(source.id, [
      { title: "Parent", parentIds: [] },
    ]);
    const [child] = await store.addNodes(source.id, [
      { title: "Child", parentIds: [parent!.id] },
    ]);

    await expect(
      store.updateNodes(source.id, [
        { id: parent!.id, parentIds: [child!.id] },
      ]),
    ).rejects.toThrow("Hierarchy cycle detected");
  });

  it("aggregates sources from multiple configured repositories", async () => {
    const firstStore = new FilesystemDocumentationStore([firstRepository]);
    const secondStore = new FilesystemDocumentationStore([secondRepository]);
    await firstStore.createSource({ name: "Nim", type: "language" });
    await secondStore.createSource({ name: "UIFlow", type: "library" });

    const aggregateStore = new FilesystemDocumentationStore([
      firstRepository,
      secondRepository,
    ]);
    const sources = await aggregateStore.listSources();
    expect(sources.map((source) => source.name)).toEqual(["Nim", "UIFlow"]);
  });

  it("paginates immediate children", async () => {
    const store = new FilesystemDocumentationStore([firstRepository]);
    const source = await store.createSource({ name: "Large Docs", type: "library" });
    await store.addNodes(source.id, [
      { title: "A", parentIds: [], position: 1 },
      { title: "B", parentIds: [], position: 2 },
      { title: "C", parentIds: [], position: 3 },
    ]);

    const first = await store.listChildren(source.id, undefined, 2, undefined);
    expect(first.items.map((node) => node.title)).toEqual(["A", "B"]);
    expect(first.nextCursor).toBe("2");

    const second = await store.listChildren(
      source.id,
      undefined,
      2,
      first.nextCursor,
    );
    expect(second.items.map((node) => node.title)).toEqual(["C"]);
    expect(second.nextCursor).toBeUndefined();
  });
});
