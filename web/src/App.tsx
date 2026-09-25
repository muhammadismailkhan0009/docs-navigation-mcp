import { BookOpenText, HardDrive } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SourceExplorer } from "@/features/sources/source-explorer";

export default function App() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card">
              <BookOpenText className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">
                Docs Navigation
              </h1>
              <p className="text-sm text-muted-foreground">
                Inspect the documentation corpus used by your MCP clients.
              </p>
            </div>
          </div>

          <Badge variant="outline" className="hidden gap-1.5 sm:flex">
            <HardDrive className="size-3.5" />
            Read-only viewer
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-[96rem] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Stored documentation
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Sources are populated through Docs Navigation MCP tools. This UI
            only reads the same local repositories so you can see what the
            agents have stored.
          </p>
        </section>

        <SourceExplorer />
      </main>
    </div>
  );
}
