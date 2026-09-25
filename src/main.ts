#!/usr/bin/env node

import { once } from "node:events";
import type { Server as HttpServer } from "node:http";
import { fileURLToPath } from "node:url";

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import { createViewerHttpServer } from "./entrypoints/http/viewer-http-server.js";
import { createDocsNavigationMcpServer } from "./entrypoints/mcp/mcp-server.js";
import { FilesystemDocumentationStore } from "./infrastructure/filesystem/filesystem-documentation-store.js";
import { parseRepositoryPaths } from "./runtime/repository-paths.js";

const repositoryPaths = parseRepositoryPaths(process.env.DOCNAV_REPOSITORIES);
const uiHost = process.env.DOCNAV_UI_HOST?.trim() || "127.0.0.1";
const uiPort = parseUiPort(process.env.DOCNAV_UI_PORT);
const staticDirectory = fileURLToPath(new URL("./ui/", import.meta.url));

const store = new FilesystemDocumentationStore(repositoryPaths);

const mcpServer = createDocsNavigationMcpServer(store);
const mcpTransport = new StdioServerTransport();

const viewerServer = createViewerHttpServer(store, staticDirectory);

mcpTransport.onclose = () => {
  void closeHttpServer(viewerServer).catch((error: unknown) => {
    console.error("Failed to close Docs Navigation UI:", error);
  });
};

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  await Promise.allSettled([
    mcpServer.close(),
    closeHttpServer(viewerServer),
  ]);
}

process.once("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});
process.once("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

viewerServer.listen(uiPort, uiHost);
await once(viewerServer, "listening");

console.error(`Docs Navigation UI: http://${uiHost}:${uiPort}`);

await mcpServer.connect(mcpTransport);

function parseUiPort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return 47831;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error("DOCNAV_UI_PORT must be an integer from 1 to 65535.");
  }

  return parsed;
}

function closeHttpServer(server: HttpServer): Promise<void> {
  if (!server.listening) return Promise.resolve();

  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
        return;
      }
      reject(error);
    });
  });
}
