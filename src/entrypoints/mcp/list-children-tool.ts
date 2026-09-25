import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { listChildren } from "../../application/list-children.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { jsonResult } from "./mcp-result.js";
import { nodeIdSchema, sourceIdSchema } from "./mcp-schemas.js";

export function registerListChildrenTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "docs.nodes.list_children",
    {
      description:
        "Navigate an existing prepared documentation corpus one hierarchy level at a time. Omit node_id to list source roots; pass a returned node ID to descend further. Use this after docs.sources.list to locate exact stored documentation instead of recrawling the original website.",
      inputSchema: z.object({
        source_id: sourceIdSchema,
        node_id: nodeIdSchema.optional(),
        limit: z.number().int().min(1).max(500).default(100),
        cursor: z.string().regex(/^\d+$/).optional(),
      }),
    },
    async ({ source_id, node_id, limit, cursor }) =>
      jsonResult(await listChildren(store, source_id, node_id, limit, cursor)),
  );
}
