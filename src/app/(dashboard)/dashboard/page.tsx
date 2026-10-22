import type { Metadata } from "next";
import Link from "next/link";
import { FileClockIcon, InfoIcon, UserCheckIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { QuickActionsCard } from "@/features/dashboard/components/quick-actions-card";
import { RecentEmployeesCard } from "@/features/dashboard/components/recent-employees-card";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { mockDashboardStats, mockRecentEmployees } from "@/features/dashboard/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const TIME_ZONE = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const percentFormatter = new Intl.NumberFormat("id-ID", { style: "percent", maximumFractionDigits: 1 });

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const updatedAt = new Date(stats.updatedAt);
  const activeShare = stats.totalEmployees > 0 ? stats.activeEmployees / stats.totalEmployees : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan data kepegawaian per ${dateFormatter.format(updatedAt)}.`}
        actions={
          <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
            <UserPlusIcon />
            Tambah Pegawai
          </Button>
        }
      />

      <Alert className="border-l-4 border-l-accent">
        <InfoIcon className="text-primary" />
        <AlertDescription>
          Data di halaman ini adalah data contoh dan belum terhubung ke API pegawai.
        </AlertDescription>
      </Alert>

      <section aria-label="Ringkasan pegawai" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pegawai"
          value={stats.totalEmployees}
          description={`Diperbarui ${dateFormatter.format(updatedAt)}`}
          icon={UsersIcon}
        />
        <StatCard
          title="Pegawai Aktif"
          value={stats.activeEmployees}
          description={`${percentFormatter.format(activeShare)} dari total pegawai`}
          icon={UserCheckIcon}
        />
        <StatCard
          title="Pegawai Baru Bulan Ini"
          value={stats.newEmployeesThisMonth}
          description={`Periode ${monthFormatter.format(updatedAt)}`}
          icon={UserPlusIcon}
        />
        <StatCard
          title="Dokumen Pending"
          value={stats.pendingDocuments}
          description="Menunggu verifikasi"
          icon={FileClockIcon}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentEmployeesCard employees={mockRecentEmployees} />
        </div>
        <QuickActionsCard />
      </div>
    </PageContainer>
  );
}
