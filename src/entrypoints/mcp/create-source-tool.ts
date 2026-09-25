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
    "docs.sources.create",
    {
      description:
        "INGESTION/ADMIN tool. Create a new empty documentation corpus in the primary configured repository when deliberately importing documentation that is not already available via docs.sources.list. Do not create a new source merely to answer a question about an existing corpus.",
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
