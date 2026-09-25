import type { DocumentationStore } from "./ports/documentation-store.js";
import type { AddDocumentationNode } from "../domain/documentation-node.js";

export function addNodes(
  store: DocumentationStore,
  sourceId: string,
  nodes: readonly AddDocumentationNode[],
) {
  return store.addNodes(sourceId, nodes);
}
