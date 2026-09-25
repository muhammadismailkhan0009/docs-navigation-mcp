import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { removeSource } from "../../application/remove-source.js";
import { jsonResult } from "./mcp-result.js";
import { sourceIdSchema } from "./mcp-schemas.js";

export function registerRemoveSourceTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "remove_source",
    {
      description: "Remove a documentation source and all of its stored nodes.",
      inputSchema: z.object({ source_id: sourceIdSchema }),
    },
    async ({ source_id }) => {
      await removeSource(store, source_id);
      return jsonResult({ removed_source_id: source_id });
    },
  );
}
