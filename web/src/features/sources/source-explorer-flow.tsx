import { defineFlow } from "@myriadcodelabs/uiflow";

import { fetchDocument, listSources } from "@/data-access/docs-api";
import type {
  DocumentationDocument,
  DocumentationNode,
  DocumentationSource,
} from "@/data-access/docs-models";

import { SourceExplorerLoadingView } from "./source-explorer-loading-view";
import {
  SourceExplorerView,
  type SourceExplorerOutput,
} from "./source-explorer-view";

type DomainData = {};

type InternalData = {
  sources: readonly DocumentationSource[];
  selectedSourceId: string | null;
  selectedNodeId: string | null;
  document: DocumentationDocument | null;
  sourceError: string | null;
  documentError: string | null;
  pendingNode: DocumentationNode | null;
};

type LoadSourcesResult =
  | { ok: true; sources: readonly DocumentationSource[] }
  | { ok: false; message: string };

type LoadDocumentResult =
  | { ok: true; document: DocumentationDocument }
  | { ok: false; message: string };

export const sourceExplorerFlow = defineFlow<DomainData, InternalData>(
  {
    loadSources: {
      input: () => ({}),
      action: async (): Promise<LoadSourcesResult> => {
        try {
          return { ok: true, sources: await listSources() };
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to load documentation sources.",
          };
        }
      },
      onOutput: (_domain, internal, result) => {
        if (!result.ok) {
          internal.sources = [];
          internal.selectedSourceId = null;
          internal.selectedNodeId = null;
          internal.document = null;
          internal.sourceError = result.message;
          return "browse";
        }

        const currentStillExists =
          internal.selectedSourceId !== null &&
          result.sources.some(
            (source: DocumentationSource) =>
              source.id === internal.selectedSourceId,
          );
        const nextSourceId = currentStillExists
          ? internal.selectedSourceId
          : (result.sources[0]?.id ?? null);

        if (nextSourceId !== internal.selectedSourceId) {
          internal.selectedNodeId = null;
          internal.document = null;
          internal.documentError = null;
        }

        internal.sources = result.sources;
        internal.selectedSourceId = nextSourceId;
        internal.sourceError = null;
        return "browse";
      },
      render: {
        mode: "fallback",
        view: SourceExplorerLoadingView,
      },
    },

    browse: {
      input: (_domain, internal) => ({
        sources: internal.sources,
        selectedSourceId: internal.selectedSourceId,
        selectedNodeId: internal.selectedNodeId,
        document: internal.document,
        sourceError: internal.sourceError,
        documentError: internal.documentError,
      }),
      view: SourceExplorerView,
      onOutput: (_domain, internal, output: SourceExplorerOutput) => {
        if (output.action === "refresh") {
          return "loadSources";
        }

        if (output.action === "select-source") {
          internal.selectedSourceId = output.sourceId;
          internal.selectedNodeId = null;
          internal.document = null;
          internal.documentError = null;
          return;
        }

        internal.pendingNode = output.node;
        internal.selectedNodeId = output.node.id;
        internal.documentError = null;
        return "loadDocument";
      },
    },

    loadDocument: {
      input: (_domain, internal) => ({
        node: internal.pendingNode,
      }),
      action: async ({ node }): Promise<LoadDocumentResult> => {
        if (node === null) {
          return { ok: false, message: "No documentation node was selected." };
        }

        try {
          return {
            ok: true,
            document: await fetchDocument(node.sourceId, node.id),
          };
        } catch (error) {
          return {
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to load document content.",
          };
        }
      },
      onOutput: (_domain, internal, result) => {
        internal.pendingNode = null;

        if (!result.ok) {
          internal.document = null;
          internal.documentError = result.message;
          return "browse";
        }

        internal.document = result.document;
        internal.documentError = null;
        return "browse";
      },
      render: {
        mode: "preserve-previous",
      },
    },
  },
  {
    start: "loadSources",
    createInternalData: () => ({
      sources: [],
      selectedSourceId: null,
      selectedNodeId: null,
      document: null,
      sourceError: null,
      documentError: null,
      pendingNode: null,
    }),
  },
);
