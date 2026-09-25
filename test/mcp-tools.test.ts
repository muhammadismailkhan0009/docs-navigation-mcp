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
      "add_nodes",
      "create_source",
      "fetch_docs",
      "list_children",
      "list_sources",
      "remove_nodes",
      "remove_source",
      "update_nodes",
    ]);
  });
  it("supports a complete source lifecycle through MCP", async () => {
    const created = parseTextResult(
      await client.callTool({
        name: "create_source",
        arguments: {
          name: "UIFlow",
          type: "library",
          version: "0.4.0",
        },
      }),
    ) as { id: string };

    const roots = parseTextResult(
      await client.callTool({
        name: "add_nodes",
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
        name: "add_nodes",
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
        name: "list_children",
        arguments: { source_id: created.id, node_id: core.id },
      }),
    ) as { items: Array<{ id: string }> };
    expect(listed.items.map((node) => node.id)).toEqual([view!.id]);

    const fetched = parseTextResult(
      await client.callTool({
        name: "fetch_docs",
        arguments: { source_id: created.id, node_ids: [view!.id] },
      }),
    ) as Array<{ content: string }>;
    expect(fetched[0]?.content).toBe("Initial raw docs");

    await client.callTool({
      name: "update_nodes",
      arguments: {
        source_id: created.id,
        nodes: [{ id: view!.id, content: "Updated raw docs" }],
      },
    });

    const updated = parseTextResult(
      await client.callTool({
        name: "fetch_docs",
        arguments: { source_id: created.id, node_ids: [view!.id] },
      }),
    ) as Array<{ content: string }>;
    expect(updated[0]?.content).toBe("Updated raw docs");
    await client.callTool({
      name: "remove_nodes",
      arguments: {
        source_id: created.id,
        node_ids: [view!.id],
        recursive: false,
      },
    });

    await client.callTool({
      name: "remove_source",
      arguments: { source_id: created.id },
    });

    const sources = parseTextResult(
      await client.callTool({ name: "list_sources", arguments: {} }),
    ) as unknown[];
    expect(sources).toEqual([]);
  });
});

function parseTextResult(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const content = result.content[0];
  if (content?.type !== "text") throw new Error("Expected text tool result");
  return JSON.parse(content.text);
}
