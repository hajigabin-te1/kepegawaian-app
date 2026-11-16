"use client";

import { useEffect } from "react";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

/** Error boundary for dashboard pages; the sidebar and header stay in place. */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <div className="rounded-lg border bg-card">
        <EmptyState
          icon={TriangleAlertIcon}
          title="Halaman gagal dimuat"
          description="Terjadi kesalahan saat menampilkan halaman ini. Coba muat ulang; jika masih gagal, hubungi admin sistem."
          action={
            <Button variant="outline" size="sm" onClick={() => retry()}>
              <RefreshCwIcon />
              Coba lagi
            </Button>
          }
        />
      </div>
    </PageContainer>
  );
}
