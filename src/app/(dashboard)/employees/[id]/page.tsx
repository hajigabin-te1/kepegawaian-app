import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EmployeeDetailView } from "@/features/employees/components/employee-detail-view";

export const metadata: Metadata = {
  title: "Detail Pegawai",
};

export default async function EmployeeDetailPage({ params }: PageProps<"/employees/[id]">) {
  const user = await requirePermission(PERMISSIONS.employeeView);
  const { id } = await params;
  return (
    <PageContainer>
      <EmployeeDetailView employeeId={id} canManage={user.permissions.includes(PERMISSIONS.employeeManage)} />
    </PageContainer>
  );
}
