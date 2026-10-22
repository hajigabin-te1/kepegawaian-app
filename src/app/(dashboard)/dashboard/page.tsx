import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDaysIcon, FileClockIcon, InfoIcon, UserCheckIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { PendingDocumentsCard } from "@/features/dashboard/components/pending-documents-card";
import { QuickActionsCard } from "@/features/dashboard/components/quick-actions-card";
import { RecentEmployeesCard } from "@/features/dashboard/components/recent-employees-card";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { StatusSummaryCard } from "@/features/dashboard/components/status-summary-card";
import {
  mockDashboardStats,
  mockPendingDocuments,
  mockRecentEmployees,
} from "@/features/dashboard/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const TIME_ZONE = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: TIME_ZONE });

const percentFormatter = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 1 });

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const updatedAt = new Date(stats.updatedAt);
  const activeShare = stats.totalEmployees > 0 ? stats.activeEmployees / stats.totalEmployees : 0;
  const newEmployeesDelta = stats.newEmployeesThisMonth - stats.newEmployeesLastMonth;

  return (
    <PageContainer>
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Ringkasan Kepegawaian</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDaysIcon className="size-4" />
            Data per {dateFormatter.format(updatedAt)}
          </p>
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

      <Alert className="border-l-4 border-l-accent">
        <InfoIcon className="text-primary" />
        <AlertDescription>
          Data di halaman ini adalah data contoh dan belum terhubung ke API pegawai.
        </AlertDescription>
      </Alert>

      <section aria-label="Indikator utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pegawai"
          value={stats.totalEmployees}
          icon={UsersIcon}
          status={`+${stats.newEmployeesThisMonth} bulan ini`}
          statusTone="positive"
          description="Dosen dan tenaga kependidikan"
        />
        <StatCard
          title="Pegawai Aktif"
          value={stats.activeEmployees}
          icon={UserCheckIcon}
          status={percentFormatter.format(activeShare)}
          description={`${stats.onLeaveEmployees} cuti · ${stats.inactiveEmployees} nonaktif`}
        />
        <StatCard
          title="Pegawai Baru"
          value={stats.newEmployeesThisMonth}
          icon={UserPlusIcon}
          status={`${formatDelta(newEmployeesDelta)} vs bulan lalu`}
          statusTone={newEmployeesDelta >= 0 ? "positive" : "warning"}
          description={`Periode ${monthFormatter.format(updatedAt)}`}
        />
        <StatCard
          title="Dokumen Pending"
          value={stats.pendingDocuments}
          icon={FileClockIcon}
          status={`${stats.overdueDocuments} > 7 hari`}
          statusTone="warning"
          description="Menunggu verifikasi Bagian Kepegawaian"
        />
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentEmployeesCard employees={mockRecentEmployees} totalEmployees={stats.totalEmployees} />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          <StatusSummaryCard stats={stats} />
          <PendingDocumentsCard documents={mockPendingDocuments} />
          <div className="md:col-span-2 xl:col-span-1">
            <QuickActionsCard />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
