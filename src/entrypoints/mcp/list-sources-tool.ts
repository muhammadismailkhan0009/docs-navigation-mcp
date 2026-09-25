import type { McpServer } from "@modelcontextprotocol/server";

import { listSources } from "../../application/list-sources.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { jsonResult } from "./mcp-result.js";

export function registerListSourcesTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "docs.sources.list",
    {
      description:
        "START HERE for documentation retrieval. Lists documentation corpora already prepared and stored in Docs Navigation repositories. Check this before crawling the web or creating separate local doc files; if the needed source exists, navigate it with docs.nodes.list_children.",
    },
    async () => jsonResult(await listSources(store)),
  );
}
