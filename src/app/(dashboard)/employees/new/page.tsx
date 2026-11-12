import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PERMISSIONS } from "@/config/permissions";
import { routes } from "@/config/routes";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EmployeeForm } from "@/features/employees/components/employee-form";

export const metadata: Metadata = {
  title: "Tambah Pegawai",
};

export default async function CreateEmployeePage() {
  await requirePermission(PERMISSIONS.employeeManage);
  return (
    <PageContainer>
      <PageHeader
        title="Tambah Pegawai"
        description="Isi data pegawai baru. Hanya nama dan kategori yang wajib."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Data Pegawai", href: routes.employees.list }, { label: "Tambah" }]}
      />
      <EmployeeForm employee={null} />
    </PageContainer>
  );
}
