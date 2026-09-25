import type { DocumentationStore } from "./ports/documentation-store.js";

export function listChildren(
  store: DocumentationStore,
  sourceId: string,
  parentId: string | undefined,
  limit: number,
  cursor: string | undefined,
) {
  return store.listChildren(sourceId, parentId, limit, cursor);
}
