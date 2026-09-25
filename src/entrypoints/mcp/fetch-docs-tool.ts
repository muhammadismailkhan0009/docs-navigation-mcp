import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { fetchDocs } from "../../application/fetch-docs.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { jsonResult } from "./mcp-result.js";
import { nodeIdSchema, sourceIdSchema } from "./mcp-schemas.js";

export function registerFetchDocsTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "docs.nodes.fetch_content",
    {
      description:
        "Read the exact raw documentation content already stored for known node IDs. Normally discover node IDs with docs.nodes.list_children, then call this tool to ground coding or documentation answers. Prefer stored content here over recrawling or rebuilding a parallel local cache.",
      inputSchema: z.object({
        source_id: sourceIdSchema,
        node_ids: z.array(nodeIdSchema).min(1).max(100),
      }),
    },
    async ({ source_id, node_ids }) =>
      jsonResult(await fetchDocs(store, source_id, node_ids)),
  );
}
