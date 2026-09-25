import { useEffect, useState } from "react";
import { Files, LoaderCircle } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { listChildren } from "@/data-access/docs-api";
import type { DocumentationNode } from "@/data-access/docs-models";

import { NodeTreeItem } from "./node-tree-item";

type Props = {
  sourceId: string | null;
  selectedNodeId: string | null;
  onSelect: (node: DocumentationNode) => void;
};

export function NodeBrowser({
  sourceId,
  selectedNodeId,
  onSelect,
}: Props) {
  const [roots, setRoots] = useState<readonly DocumentationNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (sourceId === null) {
      setRoots([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    void listChildren(sourceId)
      .then((page) => {
        if (!cancelled) setRoots(page.items);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Failed to load nodes.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  if (sourceId === null) {
    return (
      <div className="flex h-[32rem] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Select a documentation source to browse its nodes.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[32rem] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
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

  if (roots.length === 0) {
    return (
      <div className="flex h-[32rem] flex-col items-center justify-center gap-2 px-6 text-center">
        <Files className="size-8 text-muted-foreground" />
        <p className="font-medium">This source has no nodes</p>
        <p className="text-sm text-muted-foreground">
          Add content through the MCP and refresh this viewer.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[32rem]">
      <div className="space-y-0.5 p-2">
        {roots.map((node) => (
          <NodeTreeItem
            key={node.id}
            sourceId={sourceId}
            node={node}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
