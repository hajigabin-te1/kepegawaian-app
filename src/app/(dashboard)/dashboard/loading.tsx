import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-40 w-full" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[28rem] w-full xl:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}
