# Docs Navigation MCP

A local-first MCP server that lets LLMs navigate and maintain arbitrary hierarchical documentation without semantic search or technology-specific logic.

The server exposes documentation as sources containing nodes. Nodes may have arbitrary depth, duplicate titles, raw content, and multiple parents.

## Runtime tools

- `list_sources` — list configured documentation sources.
- `list_children` — list immediate children of a source root or node.
- `fetch_docs` — fetch raw content for exact node IDs.

## Ingestion tools

- `create_source` — create an empty source.
- `add_nodes` — batch-add nodes under zero or more parents.
- `update_nodes` — update node content, metadata, or parents.
- `remove_nodes` — remove nodes, optionally recursively.
- `remove_source` — remove an entire source.

## Repository storage

Set `DOCNAV_REPOSITORIES` to one or more local documentation repository paths separated by the platform path delimiter. The first repository is the creation target for new sources. Existing sources are updated in the repository that owns them.

If the variable is omitted, the default repository is:

```text
~/.docs-navigation-mcp/repository
```

Each documentation repository uses this portable layout:

```text
sources/
└── source_<uuid>/
    ├── source.json
    ├── nodes/
    │   └── node_<uuid>.json
    └── content/
        └── node_<uuid>.content
```

Raw documentation is stored unchanged in `.content` files. JSON files contain only navigation metadata, so the repository can be cloned, copied, versioned, or hosted on GitHub without a backend.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Run over stdio:

```bash
DOCNAV_REPOSITORIES=/path/to/docs-repo npm run dev
```

Multiple repositories on Linux/macOS:

```bash
DOCNAV_REPOSITORIES=/path/to/nim:/path/to/uiflow npm run dev
```

Do not write logs to stdout while the stdio MCP transport is running.
