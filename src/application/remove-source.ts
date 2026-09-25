import type { DocumentationStore } from "./ports/documentation-store.js";

export function removeSource(store: DocumentationStore, sourceId: string) {
  return store.removeSource(sourceId);
}
