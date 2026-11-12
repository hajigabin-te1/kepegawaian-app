import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EmployeeDetail } from "@/features/employees/components/employee-detail";

export const metadata: Metadata = {
  title: "Detail Pegawai",
};

export default async function EmployeeDetailPage({ params }: PageProps<"/employees/[id]">) {
  const [{ id }, user] = await Promise.all([params, requirePermission(PERMISSIONS.employeeView)]);
  return (
    <PageContainer>
      <EmployeeDetail id={id} canManage={user.permissions.includes(PERMISSIONS.employeeManage)} />
    </PageContainer>
  );
}
