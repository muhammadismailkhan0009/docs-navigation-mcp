#!/usr/bin/env node

import os from "node:os";
import path from "node:path";

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import { createDocsNavigationMcpServer } from "./entrypoints/mcp/mcp-server.js";
import { FilesystemDocumentationStore } from "./infrastructure/filesystem/filesystem-documentation-store.js";

const repositoryPaths = parseRepositoryPaths(
  process.env.DOCNAV_REPOSITORIES,
);
const store = new FilesystemDocumentationStore(repositoryPaths);
const server = createDocsNavigationMcpServer(store);
const transport = new StdioServerTransport();

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await server.close();
}

process.once("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});
process.once("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

await server.connect(transport);

function parseRepositoryPaths(value: string | undefined): readonly string[] {
  if (value === undefined || value.trim() === "") {
    return [path.join(os.homedir(), ".docs-navigation-mcp", "repository")];
  }

  const repositories = value
    .split(path.delimiter)
    .map((repository) => repository.trim())
    .filter((repository) => repository.length > 0);

  if (repositories.length === 0) {
    throw new Error("DOCNAV_REPOSITORIES must contain at least one path.");
  }
  return repositories;
}
