import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EmployeeEditor } from "@/features/employees/components/employee-editor";

export const metadata: Metadata = {
  title: "Ubah Pegawai",
};

export default async function EditEmployeePage({ params }: PageProps<"/employees/[id]/edit">) {
  const [{ id }] = await Promise.all([params, requirePermission(PERMISSIONS.employeeManage)]);
  return (
    <PageContainer>
      <EmployeeEditor id={id} />
    </PageContainer>
  );
}
