import type { DocumentationStore } from "./ports/documentation-store.js";

export function listSources(store: DocumentationStore) {
  return store.listSources();
}
