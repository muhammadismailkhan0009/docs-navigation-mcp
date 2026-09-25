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
  const server = new McpServer(
    {
      name: DOCS_NAVIGATION_MCP_NAME,
      version: DOCS_NAVIGATION_MCP_VERSION,
    },
    {
      instructions:
        "Docs Navigation is the persistent prepared-documentation store for this client, not a web crawler. For documentation or coding questions, prefer the stored corpus before crawling the web or creating ad-hoc local documentation: first call docs.sources.list, then navigate with docs.nodes.list_children, then read exact stored material with docs.nodes.fetch_content. Use docs.sources.create and docs.nodes.add/update only when deliberately ingesting or refreshing documentation from authoritative material. If required documentation is absent or outdated, obtain authoritative material externally and persist it here instead of maintaining a parallel documentation cache.",
    },
  );

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
