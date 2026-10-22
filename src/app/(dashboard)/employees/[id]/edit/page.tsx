import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { PlaceholderNotice } from "@/components/common/placeholder-notice";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Ubah Pegawai",
};

async function EditEmployeeContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Ubah Pegawai"
        description={`ID pegawai: ${id}`}
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href={routes.employees.detail(id)} />}>
            <ArrowLeftIcon />
            Kembali
          </Button>
        }
      />
      <PlaceholderNotice description="Formulir ubah data pegawai akan dibuat setelah field dan aturan validasi dikonfirmasi." />
    </>
  );
}

export default function EditEmployeePage({ params }: PageProps<"/employees/[id]/edit">) {
  return (
    <PageContainer>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <EditEmployeeContent params={params} />
      </Suspense>
    </PageContainer>
  );
}
