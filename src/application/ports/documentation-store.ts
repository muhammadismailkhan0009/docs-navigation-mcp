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

export interface DocumentationStore {
  listSources(): Promise<readonly DocumentationSource[]>;
  createSource(input: CreateDocumentationSource): Promise<DocumentationSource>;
  removeSource(sourceId: string): Promise<void>;

  listChildren(
    sourceId: string,
    parentId: string | undefined,
    limit: number,
    cursor: string | undefined,
  ): Promise<DocumentationNodePage>;

  fetchDocs(
    sourceId: string,
    nodeIds: readonly string[],
  ): Promise<readonly DocumentationDocument[]>;

  addNodes(
    sourceId: string,
    nodes: readonly AddDocumentationNode[],
  ): Promise<readonly DocumentationNode[]>;

  updateNodes(
    sourceId: string,
    nodes: readonly UpdateDocumentationNode[],
  ): Promise<readonly DocumentationNode[]>;

  removeNodes(
    sourceId: string,
    nodeIds: readonly string[],
    recursive: boolean,
  ): Promise<RemoveNodesResult>;
}
