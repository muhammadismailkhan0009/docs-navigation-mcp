import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { updateNodes } from "../../application/update-nodes.js";
import type { UpdateDocumentationNode } from "../../domain/documentation-node.js";
import { jsonResult } from "./mcp-result.js";
import { nodeIdSchema, sourceIdSchema } from "./mcp-schemas.js";

const updateNodeSchema = z.object({
  id: nodeIdSchema,
  title: z.string().min(1).optional(),
  parent_ids: z.array(nodeIdSchema).optional(),
  content: z.string().nullable().optional(),
  source_ref: z.string().min(1).nullable().optional(),
  content_type: z.string().min(1).nullable().optional(),
  position: z.number().finite().nullable().optional(),
});

export function registerUpdateNodesTool(server: McpServer, store: DocumentationStore): void {
  server.registerTool(
    "update_nodes",
    {
      description: "Update content, metadata, or hierarchy parents for existing nodes.",
      inputSchema: z.object({
        source_id: sourceIdSchema,
        nodes: z.array(updateNodeSchema).min(1).max(500),
      }),
    },
    async ({ source_id, nodes }) =>
      jsonResult(await updateNodes(store, source_id, nodes.map(mapUpdateNode))),
  );
}

function mapUpdateNode(
  input: z.infer<typeof updateNodeSchema>,
): UpdateDocumentationNode {
  return {
    id: input.id,
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.parent_ids === undefined ? {} : { parentIds: input.parent_ids }),
    ...(input.content === undefined ? {} : { content: input.content }),
    ...(input.source_ref === undefined ? {} : { sourceRef: input.source_ref }),
    ...(input.content_type === undefined
      ? {}
      : { contentType: input.content_type }),
    ...(input.position === undefined ? {} : { position: input.position }),
  };
}
