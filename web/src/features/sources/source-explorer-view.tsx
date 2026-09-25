import type { OutputHandle } from "@myriadcodelabs/uiflow";
import { Database, FolderTree, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  DocumentationDocument,
  DocumentationNode,
  DocumentationSource,
} from "@/data-access/docs-models";

import { DocumentViewer } from "./document-viewer";
import { NodeBrowser } from "./node-browser";
import { SourceList } from "./source-list";

export type SourceExplorerOutput =
  | { action: "refresh" }
  | { action: "select-source"; sourceId: string }
  | { action: "select-node"; node: DocumentationNode };

type SourceExplorerInput = {
  sources: readonly DocumentationSource[];
  selectedSourceId: string | null;
  selectedNodeId: string | null;
  document: DocumentationDocument | null;
  sourceError: string | null;
  documentError: string | null;
};

type Props = {
  input: SourceExplorerInput;
  output: OutputHandle<SourceExplorerOutput>;
};

export function SourceExplorerView({ input, output }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Stored documentation
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse the exact sources and raw nodes available to the MCP.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => output.emit({ action: "refresh" })}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </CardHeader>

      <Separator />

      {input.sourceError ? (
        <div className="border-b px-6 py-3 text-sm text-destructive">
          {input.sourceError}
        </div>
      ) : null}

      <CardContent className="p-0">
        <div className="grid min-h-[32rem] lg:grid-cols-[18rem_20rem_minmax(0,1fr)]">
          <section className="border-b lg:border-b-0 lg:border-r">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-medium">Sources</h3>
              <p className="text-xs text-muted-foreground">
                {input.sources.length} available
              </p>
            </div>
            <SourceList
              sources={input.sources}
              selectedSourceId={input.selectedSourceId}
              onSelect={(sourceId) =>
                output.emit({ action: "select-source", sourceId })
              }
            />
          </section>

          <section className="border-b lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <FolderTree className="size-4" />
              <h3 className="text-sm font-medium">Nodes</h3>
            </div>
            <NodeBrowser
              key={input.selectedSourceId ?? "none"}
              sourceId={input.selectedSourceId}
              selectedNodeId={input.selectedNodeId}
              onSelect={(node) => output.emit({ action: "select-node", node })}
            />
          </section>

          <section className="min-w-0">
            <DocumentViewer
              document={input.document}
              loading={false}
              error={input.documentError}
            />
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
