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
    "fetch_docs",
    {
      description:
        "Fetch raw documentation content for one or more exact node IDs.",
      inputSchema: z.object({
        source_id: sourceIdSchema,
        node_ids: z.array(nodeIdSchema).min(1).max(100),
      }),
    },
    async ({ source_id, node_ids }) =>
      jsonResult(await fetchDocs(store, source_id, node_ids)),
  );
}
