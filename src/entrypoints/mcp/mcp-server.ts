import { McpServer } from "@modelcontextprotocol/server";

import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { DOCS_NAVIGATION_MCP_NAME, DOCS_NAVIGATION_MCP_VERSION } from "../../index.js";
import { registerAddNodesTool } from "./add-nodes-tool.js";
import { registerCreateSourceTool } from "./create-source-tool.js";
import { registerFetchDocsTool } from "./fetch-docs-tool.js";
import { registerListChildrenTool } from "./list-children-tool.js";
import { registerListSourcesTool } from "./list-sources-tool.js";
import { registerRemoveNodesTool } from "./remove-nodes-tool.js";
import { registerRemoveSourceTool } from "./remove-source-tool.js";
import { registerUpdateNodesTool } from "./update-nodes-tool.js";

export function createDocsNavigationMcpServer(
  store: DocumentationStore,
): McpServer {
  const server = new McpServer({
    name: DOCS_NAVIGATION_MCP_NAME,
    version: DOCS_NAVIGATION_MCP_VERSION,
  });

  registerListSourcesTool(server, store);
  registerListChildrenTool(server, store);
  registerFetchDocsTool(server, store);

  registerCreateSourceTool(server, store);
  registerAddNodesTool(server, store);
  registerUpdateNodesTool(server, store);
  registerRemoveNodesTool(server, store);
  registerRemoveSourceTool(server, store);

  return server;
}
