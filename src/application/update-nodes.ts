import type { DocumentationStore } from "./ports/documentation-store.js";
import type { UpdateDocumentationNode } from "../domain/documentation-node.js";

export function updateNodes(
  store: DocumentationStore,
  sourceId: string,
  nodes: readonly UpdateDocumentationNode[],
) {
  return store.updateNodes(sourceId, nodes);
}
