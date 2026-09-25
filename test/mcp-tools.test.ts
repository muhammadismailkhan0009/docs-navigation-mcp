import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDocsNavigationMcpServer } from "../src/entrypoints/mcp/mcp-server.js";
import { FilesystemDocumentationStore } from "../src/infrastructure/filesystem/filesystem-documentation-store.js";

describe("docs navigation MCP tools", () => {
  let temporaryDirectory: string;
  let client: Client;
  let closeServer: () => Promise<void>;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), "docs-navigation-mcp-tools-"),
    );
    const store = new FilesystemDocumentationStore([temporaryDirectory]);
    const server = createDocsNavigationMcpServer(store);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    client = new Client({
      name: "docs-navigation-mcp-test",
      version: "1.0.0",
    });
    await client.connect(clientTransport);
    closeServer = () => server.close();
  });

  afterEach(async () => {
    await client.close();
    await closeServer();
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it("exposes exactly the agreed eight tools", async () => {
    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "docs.nodes.add",
      "docs.nodes.fetch_content",
      "docs.nodes.list_children",
      "docs.nodes.remove",
      "docs.nodes.update",
      "docs.sources.create",
      "docs.sources.list",
      "docs.sources.remove",
    ]);
  });

  it("advertises the retrieval-first documentation workflow", async () => {
    const { tools } = await client.listTools();
    const descriptions = new Map(
      tools.map((tool) => [tool.name, tool.description ?? ""]),
    );

    expect(client.getInstructions()).toContain(
      "prefer the stored corpus before crawling the web",
    );
    expect(descriptions.get("docs.sources.list")).toContain("START HERE");
    expect(descriptions.get("docs.nodes.list_children")).toContain(
      "instead of recrawling",
    );
    expect(descriptions.get("docs.nodes.fetch_content")).toContain(
      "Prefer stored content",
    );
    expect(descriptions.get("docs.nodes.add")).toContain("INGESTION");
  });

  it("supports a complete source lifecycle through MCP", async () => {
    const created = parseTextResult(
      await client.callTool({
        name: "docs.sources.create",
        arguments: {
          name: "UIFlow",
          type: "library",
          version: "0.4.0",
        },
      }),
    ) as { id: string };

    const roots = parseTextResult(
      await client.callTool({
        name: "docs.nodes.add",
        arguments: {
          source_id: created.id,
          nodes: [
            { title: "Core Concepts", parent_ids: [] },
            { title: "SSR", parent_ids: [] },
          ],
        },
      }),
    ) as Array<{ id: string; title: string }>;
    const core = roots.find((node) => node.title === "Core Concepts");
    if (core === undefined) throw new Error("Core Concepts was not created");

    const [view] = parseTextResult(
      await client.callTool({
        name: "docs.nodes.add",
        arguments: {
          source_id: created.id,
          nodes: [
            {
              title: "View",
              parent_ids: [core.id],
              content: "Initial raw docs",
              content_type: "text/plain",
            },
          ],
        },
      }),
    ) as Array<{ id: string }>;

    const listed = parseTextResult(
      await client.callTool({
        name: "docs.nodes.list_children",
        arguments: { source_id: created.id, node_id: core.id },
      }),
    ) as { items: Array<{ id: string }> };
    expect(listed.items.map((node) => node.id)).toEqual([view!.id]);

    const fetched = parseTextResult(
      await client.callTool({
        name: "docs.nodes.fetch_content",
        arguments: { source_id: created.id, node_ids: [view!.id] },
      }),
    ) as Array<{ content: string }>;
    expect(fetched[0]?.content).toBe("Initial raw docs");

    await client.callTool({
      name: "docs.nodes.update",
      arguments: {
        source_id: created.id,
        nodes: [{ id: view!.id, content: "Updated raw docs" }],
      },
    });

    const updated = parseTextResult(
      await client.callTool({
        name: "docs.nodes.fetch_content",
        arguments: { source_id: created.id, node_ids: [view!.id] },
      }),
    ) as Array<{ content: string }>;
    expect(updated[0]?.content).toBe("Updated raw docs");
    await client.callTool({
      name: "docs.nodes.remove",
      arguments: {
        source_id: created.id,
        node_ids: [view!.id],
        recursive: false,
      },
    });

    await client.callTool({
      name: "docs.sources.remove",
      arguments: { source_id: created.id },
    });

    const sources = parseTextResult(
      await client.callTool({ name: "docs.sources.list", arguments: {} }),
    ) as unknown[];
    expect(sources).toEqual([]);
  });
});

function parseTextResult(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const content = result.content[0];
  if (content?.type !== "text") throw new Error("Expected text tool result");
  return JSON.parse(content.text);
}
