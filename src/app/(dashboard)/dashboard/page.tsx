import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlusIcon } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/config/permissions";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { EmployeeStatistics } from "@/features/dashboard/components/employee-statistics";
import { WelcomePanel } from "@/features/dashboard/components/welcome-panel";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);

  const canViewEmployees = user.permissions.includes(PERMISSIONS.employeeView);
  const canViewStatistics = canViewEmployees || user.permissions.includes(PERMISSIONS.reportView);
  const canManageEmployees = user.permissions.includes(PERMISSIONS.employeeManage);

  return (
    <PageContainer>
      <PageHeader
        title="Ringkasan Kepegawaian"
        description={canViewStatistics ? "Jumlah dosen dan tenaga kependidikan saat ini." : undefined}
        actions={
          canManageEmployees ? (
            <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
              <UserPlusIcon />
              Tambah Pegawai
            </Button>
          ) : undefined
        }
      />
      {canViewStatistics ? <EmployeeStatistics canViewEmployees={canViewEmployees} /> : <WelcomePanel name={user.displayName} />}
    </PageContainer>
  );
}
