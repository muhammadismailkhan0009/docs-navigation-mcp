# Docs Navigation MCP

A local-first MCP server for navigating and maintaining arbitrary hierarchical documentation.

It exposes documentation as **sources** containing **nodes**. Nodes can have arbitrary depth, duplicate titles, raw content, and multiple parents. The server provides no semantic search or built-in reasoning; the connected LLM decides how to navigate and maintain the documentation.

## Run with npx

Node.js 20 or newer is required.

```bash
npx -y @myriadcodelabs/docs-navigation-mcp
```

Before the npm release, or when intentionally running the current GitHub revision:

```bash
npx -y github:muhammadismailkhan0009/docs-navigation-mcp
```

Git installs run the package's `prepare` script so the TypeScript source is built before execution.

By default, documentation is stored under:

```text
~/.docs-navigation-mcp/repository
```

To choose one or more documentation repositories:

```bash
DOCNAV_REPOSITORIES=/path/to/docs-repo \
npx -y @myriadcodelabs/docs-navigation-mcp
```
On Linux/macOS, multiple repositories are separated by `:`:

```bash
DOCNAV_REPOSITORIES="/path/to/nim:/path/to/uiflow" \
npx -y @myriadcodelabs/docs-navigation-mcp
```

The first configured repository is the creation target for new sources. Existing sources are updated in whichever configured repository owns them.

## MCP client configuration

A typical stdio MCP configuration looks like:

```json
{
  "mcpServers": {
    "docs-navigation": {
      "command": "npx",
      "args": ["-y", "@myriadcodelabs/docs-navigation-mcp"],
      "env": {
        "DOCNAV_REPOSITORIES": "/path/to/docs-repo"
      }
    }
  }
}
```
## Streamable HTTP with mcp-proxy

If `mcp-proxy` is installed locally:

```bash
DOCNAV_REPOSITORIES=/path/to/docs-repo \
mcp-proxy \
  --server stream \
  --host 127.0.0.1 \
  --port 8765 \
  --streamEndpoint /mcp \
  -- npx -y @myriadcodelabs/docs-navigation-mcp
```

The MCP endpoint is then:

```text
http://127.0.0.1:8765/mcp
```

## Intended agent workflow

Docs Navigation is a persistent prepared-documentation store, not a crawler.

For normal documentation retrieval, agents should prefer the stored corpus before crawling the web or creating a separate local documentation cache:

1. `docs.sources.list` — discover which prepared documentation corpora are already available.
2. `docs.nodes.list_children` — navigate the selected corpus hierarchy until the relevant nodes are found.
3. `docs.nodes.fetch_content` — read the exact stored raw documentation for those node IDs.

External crawling is only needed when required documentation is absent or intentionally being refreshed. In that case, obtain authoritative material externally and ingest it into Docs Navigation.

## Retrieval tools

- `docs.sources.list` — start here; list prepared documentation sources.
- `docs.nodes.list_children` — navigate immediate children of a source root or node.
- `docs.nodes.fetch_content` — fetch exact stored raw content for known node IDs.

## Ingestion and maintenance tools

- `docs.sources.create` — create an empty documentation corpus for deliberate ingestion.
- `docs.nodes.add` — persist new structured documentation nodes and raw content.
- `docs.nodes.update` — refresh node content, metadata, or hierarchy.
- `docs.nodes.remove` — remove stored nodes, optionally recursively.
- `docs.sources.remove` — remove an entire documentation corpus.

## Storage format

Each documentation repository uses a Git-friendly layout:

```text
sources/
└── source_<uuid>/
    ├── source.json
    ├── nodes/
    │   └── node_<uuid>.json
    └── content/
        └── node_<uuid>.content
```

Raw documentation is stored unchanged in `.content` files. JSON files contain navigation metadata only, so documentation repositories can be copied, cloned, versioned, or hosted on GitHub without a dedicated backend.

## Install globally

```bash
npm install -g @myriadcodelabs/docs-navigation-mcp
docs-navigation-mcp
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm run release:check
```

Run the source version over stdio:

```bash
DOCNAV_REPOSITORIES=/path/to/docs-repo npm run dev
```
## Publishing

The repository contains a GitHub Actions workflow that publishes to npm when a GitHub Release is published.

Before the first release:

1. Create an npm automation/access token that can publish `@myriadcodelabs/docs-navigation-mcp`.
2. Add it to the GitHub repository as the `NPM_TOKEN` Actions secret.
3. Set the desired version in `package.json` and `src/index.ts`.
4. Push the release commit and create a Git tag such as `v0.1.0`.
5. Publish a GitHub Release for that tag.

The workflow verifies that the tag exactly matches the package version before publishing with npm provenance.

## License

MIT
