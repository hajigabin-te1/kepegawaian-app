import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { PlaceholderNotice } from "@/components/common/placeholder-notice";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "Detail Pegawai",
};

async function EmployeeDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        title="Detail Pegawai"
        description={`ID pegawai: ${id}`}
        actions={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href={routes.employees.list} />}>
              <ArrowLeftIcon />
              Kembali
            </Button>
            <Button nativeButton={false} render={<Link href={routes.employees.edit(id)} />}>
              <PencilIcon />
              Ubah
            </Button>
          </>
        }
      />
      <PlaceholderNotice description="Informasi lengkap pegawai akan ditampilkan di sini." />
    </>
  );
}

export default function EmployeeDetailPage({ params }: PageProps<"/employees/[id]">) {
  return (
    <PageContainer>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <EmployeeDetailContent params={params} />
      </Suspense>
    </PageContainer>
  );
}
