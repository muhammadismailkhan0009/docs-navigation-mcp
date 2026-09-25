export const DOCS_NAVIGATION_MCP_NAME = "docs-navigation-mcp";
export const DOCS_NAVIGATION_MCP_VERSION = "0.1.0";

export { createDocsNavigationMcpServer } from "./entrypoints/mcp/mcp-server.js";
export { FilesystemDocumentationStore } from "./infrastructure/filesystem/filesystem-documentation-store.js";
export type { DocumentationStore } from "./application/ports/documentation-store.js";
export type {
  AddDocumentationNode,
  DocumentationDocument,
  DocumentationNode,
  DocumentationNodePage,
  RemoveNodesResult,
  UpdateDocumentationNode,
} from "./domain/documentation-node.js";
export type {
  CreateDocumentationSource,
  DocumentationSource,
} from "./domain/documentation-source.js";
