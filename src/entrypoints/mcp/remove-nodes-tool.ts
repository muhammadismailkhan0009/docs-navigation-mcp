import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { removeNodes } from "../../application/remove-nodes.js";
import { jsonResult } from "./mcp-result.js";
import { nodeIdSchema, sourceIdSchema } from "./mcp-schemas.js";

export function registerRemoveNodesTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "docs.nodes.remove",
    {
      description:
        "ADMIN tool. Remove stored documentation nodes from a source. Recursive removal preserves descendants that still remain reachable through another parent. Use this for corpus maintenance, not normal documentation retrieval.",
      inputSchema: z.object({
        source_id: sourceIdSchema,
        node_ids: z.array(nodeIdSchema).min(1).max(500),
        recursive: z.boolean().default(false),
      }),
    },
    async ({ source_id, node_ids, recursive }) =>
      jsonResult(await removeNodes(store, source_id, node_ids, recursive)),
  );
}
