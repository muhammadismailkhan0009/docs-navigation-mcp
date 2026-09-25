import type { DocumentationStore } from "./ports/documentation-store.js";
import type { CreateDocumentationSource } from "../domain/documentation-source.js";

export function createSource(
  store: DocumentationStore,
  input: CreateDocumentationSource,
) {
  return store.createSource(input);
}
