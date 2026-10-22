import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileClockIcon, InfoIcon, UserCheckIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getSession } from "@/features/auth/services/session";
import { QuickActionsCard } from "@/features/dashboard/components/quick-actions-card";
import { RecentEmployeesCard } from "@/features/dashboard/components/recent-employees-card";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { WelcomeCard } from "@/features/dashboard/components/welcome-card";
import { mockDashboardStats, mockRecentEmployees } from "@/features/dashboard/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

const updatedAtFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect(routes.login);

  const stats = mockDashboardStats;
  const updatedLabel = `Diperbarui ${updatedAtFormatter.format(new Date(stats.updatedAt))}`;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Ringkasan data kepegawaian."
        actions={
          <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
            <UserPlusIcon />
            Tambah Pegawai
          </Button>
        }
      />

      <Alert>
        <InfoIcon />
        <AlertDescription>
          Data di halaman ini adalah data contoh dan belum terhubung ke API pegawai.
        </AlertDescription>
      </Alert>

      <WelcomeCard name={user.name} now={new Date()} />

      <section aria-label="Ringkasan pegawai" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Pegawai" value={stats.totalEmployees} description={updatedLabel} icon={UsersIcon} />
        <StatCard title="Pegawai Aktif" value={stats.activeEmployees} description={updatedLabel} icon={UserCheckIcon} />
        <StatCard
          title="Pegawai Baru Bulan Ini"
          value={stats.newEmployeesThisMonth}
          description={updatedLabel}
          icon={UserPlusIcon}
        />
        <StatCard
          title="Dokumen Pending"
          value={stats.pendingDocuments}
          description="Menunggu verifikasi"
          icon={FileClockIcon}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentEmployeesCard employees={mockRecentEmployees} />
        </div>
        <QuickActionsCard />
      </div>
    </PageContainer>
  );
}
