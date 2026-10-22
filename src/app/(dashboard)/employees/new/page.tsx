import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { PlaceholderNotice } from "@/components/common/placeholder-notice";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Tambah Pegawai",
};

export default function CreateEmployeePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Tambah Pegawai"
        description="Isi data pegawai baru."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={routes.employees.list} />}>
            <ArrowLeftIcon />
            Kembali
          </Button>
        }
      />
      <PlaceholderNotice description="Formulir tambah pegawai akan dibuat setelah field dan aturan validasi dikonfirmasi." />
    </PageContainer>
  );
}
