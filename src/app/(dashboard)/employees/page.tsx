import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { PlaceholderNotice } from "@/components/common/placeholder-notice";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Daftar Pegawai",
};

export default function EmployeesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Daftar Pegawai"
        description="Kelola data pegawai."
        actions={
          <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
            <PlusIcon />
            Tambah Pegawai
          </Button>
        }
      />
      <PlaceholderNotice description="Tabel daftar pegawai, pencarian, filter, dan paginasi akan ditampilkan di sini." />
    </PageContainer>
  );
}
