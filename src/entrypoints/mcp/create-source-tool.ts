import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

import { createSource } from "../../application/create-source.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";
import { jsonResult } from "./mcp-result.js";
import { optionalNonEmptyString } from "./mcp-schemas.js";

export function registerCreateSourceTool(
  server: McpServer,
  store: DocumentationStore,
): void {
  server.registerTool(
    "create_source",
    {
      description:
        "Create an empty documentation source in the primary configured repository.",
      inputSchema: z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        version: optionalNonEmptyString,
        origin: optionalNonEmptyString,
      }),
    },
    async (input) => jsonResult(await createSource(store, input)),
  );
}
