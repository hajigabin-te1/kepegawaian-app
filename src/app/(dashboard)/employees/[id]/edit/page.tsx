import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PERMISSIONS } from "@/config/permissions";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EmployeeEditView } from "@/features/employees/components/employee-edit-view";

export const metadata: Metadata = {
  title: "Ubah Data Pegawai",
};

export default async function EditEmployeePage({ params }: PageProps<"/employees/[id]/edit">) {
  await requirePermission(PERMISSIONS.employeeManage);
  const { id } = await params;
  return (
    <PageContainer>
      <PageHeader
        title="Ubah Data Pegawai"
        breadcrumbs={[
          { label: "Beranda", href: routes.dashboard },
          { label: "Data Pegawai", href: routes.employees.list },
          { label: "Detail Pegawai", href: routes.employees.detail(id) },
          { label: "Ubah" },
        ]}
      />
      <EmployeeEditView employeeId={id} />
    </PageContainer>
  );
}
