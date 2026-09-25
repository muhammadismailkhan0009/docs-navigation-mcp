import type { DocumentationStore } from "./ports/documentation-store.js";

export function fetchDocs(
  store: DocumentationStore,
  sourceId: string,
  nodeIds: readonly string[],
) {
  return store.fetchDocs(sourceId, nodeIds);
}
