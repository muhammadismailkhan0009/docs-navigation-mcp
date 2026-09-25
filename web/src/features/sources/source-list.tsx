import { Database, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DocumentationSource } from "@/data-access/docs-models";
import { cn } from "@/lib/utils";

type Props = {
  sources: readonly DocumentationSource[];
  selectedSourceId: string | null;
  onSelect: (sourceId: string) => void;
};

export function SourceList({
  sources,
  selectedSourceId,
  onSelect,
}: Props) {
  if (sources.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-4 text-center">
        <Database className="size-8 text-muted-foreground" />
        <p className="font-medium">No stored documentation yet</p>
        <p className="text-sm text-muted-foreground">
          Ingest documentation through the MCP and refresh this viewer.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[32rem]">
      <div className="space-y-2 p-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              source.id === selectedSourceId
                ? "border-foreground/20 bg-muted"
                : "hover:bg-muted/60",
            )}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => onSelect(source.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-tight">{source.name}</span>
                <Badge variant="outline">{source.type}</Badge>
              </div>
              {source.version ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Version {source.version}
                </p>
              ) : null}
              {source.origin ? (
                <p className="mt-2 line-clamp-2 break-all text-xs text-muted-foreground">
                  {source.origin}
                </p>
              ) : null}
            </button>

            {source.origin ? (
              <div className="mt-3 flex">
                <Button variant="ghost" size="sm" asChild>
                  <a href={source.origin} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" />
                    Origin
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
