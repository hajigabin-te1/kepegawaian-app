import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDaysIcon, FlaskConicalIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { KpiStrip } from "@/features/dashboard/components/kpi-strip";
import { PendingDocumentsCard } from "@/features/dashboard/components/pending-documents-card";
import { RecentEmployeesCard } from "@/features/dashboard/components/recent-employees-card";
import {
  mockDashboardStats,
  mockPendingDocuments,
  mockRecentEmployees,
} from "@/features/dashboard/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default function DashboardPage() {
  const stats = mockDashboardStats;

  return (
    <PageContainer>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Ringkasan Kepegawaian</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDaysIcon className="size-4" />
              Data per {dateFormatter.format(new Date(stats.updatedAt))}
            </span>
            <span className="flex items-center gap-2 rounded-md border border-accent bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
              <FlaskConicalIcon className="size-3.5" />
              Data contoh, belum terhubung ke API pegawai
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" nativeButton={false} render={<Link href={routes.employees.list} />}>
            <UsersIcon />
            Data Pegawai
          </Button>
          <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
            <UserPlusIcon />
            Tambah Pegawai
          </Button>
        </div>
      </section>

      <KpiStrip stats={stats} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <RecentEmployeesCard employees={mockRecentEmployees} totalEmployees={stats.totalEmployees} />
        <PendingDocumentsCard documents={mockPendingDocuments} />
      </div>
    </PageContainer>
  );
}
