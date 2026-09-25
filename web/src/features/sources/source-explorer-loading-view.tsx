import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SourceExplorerLoadingView() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="grid min-h-[32rem] gap-0 p-0 lg:grid-cols-[18rem_20rem_minmax(0,1fr)]">
        <div className="space-y-3 border-r p-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2 border-r p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-8 w-3/5" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-6 w-2/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}
