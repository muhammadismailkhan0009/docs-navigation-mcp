import type { DocumentationStore } from "./ports/documentation-store.js";

export function removeNodes(
  store: DocumentationStore,
  sourceId: string,
  nodeIds: readonly string[],
  recursive: boolean,
) {
  return store.removeNodes(sourceId, nodeIds, recursive);
}
