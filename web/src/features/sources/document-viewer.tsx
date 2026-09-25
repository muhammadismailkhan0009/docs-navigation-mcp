import { ExternalLink, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentationDocument } from "@/data-access/docs-models";

type Props = {
  document: DocumentationDocument | null;
  loading: boolean;
  error: string | null;
};

export function DocumentViewer({ document, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex h-[32rem] items-center justify-center text-sm text-muted-foreground">
        Loading document…
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="flex h-[32rem] items-center justify-center px-6 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="flex h-[32rem] flex-col items-center justify-center gap-2 px-6 text-center">
        <FileText className="size-8 text-muted-foreground" />
        <p className="font-medium">Select a document node</p>
        <p className="text-sm text-muted-foreground">
          Exact stored content will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="border-b p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{document.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {document.contentType ? (
                <Badge variant="outline">{document.contentType}</Badge>
              ) : null}
              <Badge variant={document.hasContent ? "secondary" : "outline"}>
                {document.hasContent ? "stored content" : "metadata only"}
              </Badge>
            </div>
          </div>

          {document.sourceRef ? (
            <Button asChild size="sm" variant="outline">
              <a href={document.sourceRef} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Original
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
          {document.content ?? "No raw content is stored for this node."}
        </pre>
      </ScrollArea>
    </div>
  );
}
