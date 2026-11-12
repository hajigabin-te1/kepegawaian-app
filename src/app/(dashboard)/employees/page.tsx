import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EmployeesPanel } from "@/features/employees/components/employees-panel";

export const metadata: Metadata = {
  title: "Data Pegawai",
};

export default async function EmployeesPage() {
  await requirePermission(PERMISSIONS.employeeView);
  return (
    <PageContainer>
      <EmployeesPanel />
    </PageContainer>
  );
}
