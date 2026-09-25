import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  DOCS_NAVIGATION_MCP_NAME,
  DOCS_NAVIGATION_MCP_VERSION,
} from "../src/index.js";

describe("package metadata", () => {
  it("keeps npm and MCP identity in sync", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    ) as { name: string; version: string };

    expect(packageJson.name).toBe("@myriadcodelabs/docs-navigation-mcp");
    expect(DOCS_NAVIGATION_MCP_NAME).toBe("docs-navigation-mcp");
    expect(DOCS_NAVIGATION_MCP_VERSION).toBe(packageJson.version);
  });
});
