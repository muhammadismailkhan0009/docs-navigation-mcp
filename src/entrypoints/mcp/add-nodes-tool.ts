import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { addNodes } from "../../application/add-nodes.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import type { AddDocumentationNode } from "../../domain/documentation-node.js";
import { jsonResult } from "./mcp-result.js";
import { nodeIdSchema, sourceIdSchema } from "./mcp-schemas.js";

const addNodeSchema = z.object({
  title: z.string().min(1),
  parent_ids: z.array(nodeIdSchema).default([]),
  content: z.string().optional(),
  source_ref: z.string().min(1).optional(),
  content_type: z.string().min(1).optional(),
  position: z.number().finite().optional(),
});

export function registerAddNodesTool(server: McpServer, store: DocumentationStore): void {
  server.registerTool(
    "docs.nodes.add",
    {
      description:
        "INGESTION tool. Persist already-obtained authoritative documentation into an existing Docs Navigation source as structured nodes with raw content and parent relationships. Use this when building or extending the shared corpus, not as a substitute for docs.nodes.fetch_content during normal retrieval.",
      inputSchema: z.object({
        source_id: sourceIdSchema,
        nodes: z.array(addNodeSchema).min(1).max(500),
      }),
    },
    async ({ source_id, nodes }) =>
      jsonResult(await addNodes(store, source_id, nodes.map(mapAddNode))),
  );
}

function mapAddNode(input: z.infer<typeof addNodeSchema>): AddDocumentationNode {
  return {
    title: input.title,
    parentIds: input.parent_ids,
    ...(input.content === undefined ? {} : { content: input.content }),
    ...(input.source_ref === undefined ? {} : { sourceRef: input.source_ref }),
    ...(input.content_type === undefined
      ? {}
      : { contentType: input.content_type }),
    ...(input.position === undefined ? {} : { position: input.position }),
  };
}
