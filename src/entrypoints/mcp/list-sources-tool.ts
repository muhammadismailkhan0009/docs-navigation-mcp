import type { McpServer } from "@modelcontextprotocol/server";

import { listSources } from "../../application/list-sources.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { jsonResult } from "./mcp-result.js";

export function registerListSourcesTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "list_sources",
    {
      description:
        "List available documentation sources across configured local repositories.",
    },
    async () => jsonResult(await listSources(store)),
  );
}
