import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createViewerHttpServer } from "../src/entrypoints/http/viewer-http-server.js";
import { FilesystemDocumentationStore } from "../src/infrastructure/filesystem/filesystem-documentation-store.js";

describe("documentation viewer HTTP server", () => {
  let temporaryDirectory: string;
  let staticDirectory: string;
  let server: ReturnType<typeof createViewerHttpServer>;
  let origin: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), "docs-navigation-viewer-"),
    );
    staticDirectory = path.join(temporaryDirectory, "ui");
    await mkdir(staticDirectory, { recursive: true });
    await writeFile(
      path.join(staticDirectory, "index.html"),
      "<!doctype html><title>Docs Navigation</title>",
      "utf8",
    );

    const store = new FilesystemDocumentationStore([temporaryDirectory]);
    const source = await store.createSource({
      name: "Nim",
      type: "language",
      version: "2.2",
      origin: "https://nim-lang.org/docs/",
    });
    const [root] = await store.addNodes(source.id, [
      {
        title: "Manual",
        parentIds: [],
        content: "# Nim manual",
        contentType: "text/markdown",
        sourceRef: "https://nim-lang.org/docs/manual.html",
      },
    ]);

    if (root === undefined) throw new Error("Test node was not created.");

    server = createViewerHttpServer(store, staticDirectory);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Viewer server did not bind to a TCP port.");
    }
    origin = "http://127.0.0.1:" + address.port;
  });

  afterEach(async () => {
    if (server.listening) {
      server.close();
      await once(server, "close");
    }
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("serves stored sources, nodes, and raw content", async () => {
    const sourcesResponse = await fetch(origin + "/api/sources");
    expect(sourcesResponse.status).toBe(200);
    const sources = (await sourcesResponse.json()) as Array<{
      id: string;
      name: string;
    }>;
    expect(sources).toHaveLength(1);
    expect(sources[0]?.name).toBe("Nim");

    const sourceId = sources[0]!.id;
    const childrenResponse = await fetch(
      origin + "/api/sources/" + encodeURIComponent(sourceId) + "/children",
    );
    expect(childrenResponse.status).toBe(200);
    const children = (await childrenResponse.json()) as {
      items: Array<{ id: string; title: string }>;
    };
    expect(children.items[0]?.title).toBe("Manual");

    const nodeId = children.items[0]!.id;
    const documentResponse = await fetch(
      origin +
        "/api/sources/" +
        encodeURIComponent(sourceId) +
        "/nodes/" +
        encodeURIComponent(nodeId),
    );
    expect(documentResponse.status).toBe(200);
    const document = (await documentResponse.json()) as {
      content: string;
    };
    expect(document.content).toBe("# Nim manual");
  });

  it("rejects mutation requests", async () => {
    const response = await fetch(origin + "/api/sources", {
      method: "POST",
    });

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: "The documentation viewer is read-only.",
    });
  });
});
