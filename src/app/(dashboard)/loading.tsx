import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Suspense boundary below the dashboard layout: pages read the session (cookies) before rendering,
 * so client navigations between them show this skeleton instead of blocking.
 */
export default function DashboardSegmentLoading() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="rounded-lg border bg-card">
        <TableSkeleton />
      </div>
    </PageContainer>
  );
}
