import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { fetchDocs } from "../../application/fetch-docs.js";
import { listChildren } from "../../application/list-children.js";
import { listSources } from "../../application/list-sources.js";
import type { DocumentationStore } from "../../application/ports/documentation-store.js";

export function createViewerHttpServer(
  store: DocumentationStore,
  staticDirectory: string,
): Server {
  return createServer(async (request, response) => {
    try {
      if (request.url === undefined) {
        sendJson(response, 400, { error: "Missing request URL." });
        return;
      }

      const url = new URL(request.url, "http://localhost");
      if (url.pathname.startsWith("/api/")) {
        await handleApiRequest(request, response, url, store);
        return;
      }

      await serveStatic(response, staticDirectory, url.pathname);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error.";
      sendJson(response, errorStatus(message), { error: message });
    }
  });
}

async function handleApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  store: DocumentationStore,
): Promise<void> {
  const method = request.method ?? "GET";
  if (method !== "GET") {
    sendJson(response, 405, { error: "The documentation viewer is read-only." });
    return;
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/api/sources") {
    sendJson(response, 200, await listSources(store));
    return;
  }

  if (
    segments.length === 4 &&
    segments[0] === "api" &&
    segments[1] === "sources" &&
    segments[3] === "children"
  ) {
    const sourceId = decodeURIComponent(segments[2]!);
    const parentId = url.searchParams.get("parent_id") ?? undefined;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const limit = parseLimit(url.searchParams.get("limit"));

    sendJson(
      response,
      200,
      await listChildren(store, sourceId, parentId, limit, cursor),
    );
    return;
  }

  if (
    segments.length === 5 &&
    segments[0] === "api" &&
    segments[1] === "sources" &&
    segments[3] === "nodes"
  ) {
    const sourceId = decodeURIComponent(segments[2]!);
    const nodeId = decodeURIComponent(segments[4]!);
    const [document] = await fetchDocs(store, sourceId, [nodeId]);
    if (document === undefined) throw new Error(`Node not found: ${nodeId}`);
    sendJson(response, 200, document);
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
}

function parseLimit(value: string | null): number {
  if (value === null) return 200;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
    throw new Error("limit must be an integer from 1 to 500.");
  }
  return parsed;
}

async function serveStatic(
  response: ServerResponse,
  staticDirectory: string,
  pathname: string,
): Promise<void> {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const candidate = safeStaticPath(staticDirectory, requested);

  if (candidate !== null && (await isFile(candidate))) {
    await sendFile(response, candidate);
    return;
  }

  const indexPath = path.join(staticDirectory, "index.html");
  if (!(await isFile(indexPath))) {
    sendJson(response, 503, {
      error: "UI assets are missing. Run npm run build before starting docs-navigation-mcp.",
    });
    return;
  }

  await sendFile(response, indexPath);
}

function safeStaticPath(staticDirectory: string, pathname: string): string | null {
  const root = path.resolve(staticDirectory);
  const candidate = path.resolve(root, `.${decodeURIComponent(pathname)}`);
  return candidate === root || candidate.startsWith(`${root}${path.sep}`)
    ? candidate
    : null;
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function sendFile(response: ServerResponse, filePath: string): Promise<void> {
  response.statusCode = 200;
  response.setHeader("content-type", contentType(filePath));
  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    response.setHeader("cache-control", "public, max-age=31536000, immutable");
  }
  response.end(await readFile(filePath));
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(value));
}

function errorStatus(message: string): number {
  if (message.includes("not found") || message.includes("Not found")) return 404;
  if (message.includes("limit")) return 400;
  return 500;
}

function contentType(filePath: string): string {
  switch (path.extname(filePath)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}
