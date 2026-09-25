import { useState } from "react";
import { ChevronRight, FileText, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { listChildren } from "@/data-access/docs-api";
import type { DocumentationNode } from "@/data-access/docs-models";
import { cn } from "@/lib/utils";

type Props = {
  sourceId: string;
  node: DocumentationNode;
  selectedNodeId: string | null;
  depth?: number;
  onSelect: (node: DocumentationNode) => void;
};

export function NodeTreeItem({
  sourceId,
  node,
  selectedNodeId,
  depth = 0,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<readonly DocumentationNode[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function changeOpen(next: boolean) {
    setOpen(next);
    if (!next || children !== null || loading) return;

    setLoading(true);
    try {
      const page = await listChildren(sourceId, node.id);
      setChildren(page.items);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={changeOpen}>
      <div
        className="flex items-center gap-1"
        style={{ paddingLeft: `${Math.min(depth, 8) * 12}px` }}
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={open ? "Collapse node" : "Expand node"}
          >
            {loading ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <ChevronRight
                className={cn("size-3.5 transition-transform", open && "rotate-90")}
              />
            )}
          </Button>
        </CollapsibleTrigger>

        <Button
          type="button"
          variant={selectedNodeId === node.id ? "secondary" : "ghost"}
          size="sm"
          className="h-8 min-w-0 flex-1 justify-start px-2"
          onClick={() => onSelect(node)}
        >
          <FileText className="size-3.5 shrink-0" />
          <span className="truncate">{node.title}</span>
        </Button>
      </div>

      <CollapsibleContent>
        {children?.map((child) => (
          <NodeTreeItem
            key={child.id}
            sourceId={sourceId}
            node={child}
            selectedNodeId={selectedNodeId}
            depth={depth + 1}
            onSelect={onSelect}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
