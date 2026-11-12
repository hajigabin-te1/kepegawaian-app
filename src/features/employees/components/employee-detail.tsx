"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon, UserCheckIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { DeactivateDialog } from "@/features/employees/components/deactivate-dialog";
import { DocumentsPanel } from "@/features/employees/components/documents-panel";
import { HistoryPanel } from "@/features/employees/components/history-panel";
import { EmployeeStatusBadge } from "@/features/employees/components/employee-status-badge";
import { useEmployee, useEmploymentStatuses, useSetEmployeeActive } from "@/features/employees/hooks/use-employees";
import { CATEGORY_LABELS, GENDER_LABELS, MARITAL_LABELS } from "@/features/employees/types/employees";
import { ApiError } from "@/lib/api-error";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
const formatDate = (value: string | null) => (value ? dateFormatter.format(new Date(`${value}T00:00:00Z`)) : null);

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value === null || value === undefined || value === "" ? "—" : value}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

export function EmployeeDetail({ id, canManage }: { id: string; canManage: boolean }) {
  const employee = useEmployee(id);
  const statuses = useEmploymentStatuses();
  const setActive = useSetEmployeeActive(id);
  const [deactivating, setDeactivating] = useState(false);

  if (employee.isPending) return <Skeleton className="h-64 w-full" />;
  if (employee.isError) return <QueryErrorState error={employee.error} onRetry={() => void employee.refetch()} />;
  const data = employee.data;
  if (!data) {
    return (
      <Card>
        <EmptyState
          icon={UserXIcon}
          title="Pegawai tidak ditemukan"
          description="Data tidak ada atau Anda tidak memiliki akses."
          action={
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={routes.employees.list} />}>
              Kembali ke daftar
            </Button>
          }
        />
      </Card>
    );
  }

  const employmentStatus = statuses.data?.find((s) => s.code === data.employmentStatusCode);
  const service =
    data.serviceYears === null && data.serviceMonths === null ? null : `${data.serviceYears ?? 0} tahun ${data.serviceMonths ?? 0} bulan`;
  const address = [data.address, data.city, data.province, data.postalCode].filter(Boolean).join(", ");

  const reactivate = () =>
    setActive.mutate(null, {
      onSuccess: () => toast.success("Pegawai diaktifkan kembali."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal mengaktifkan pegawai."),
    });

  return (
    <>
      <PageHeader
        title={data.fullName}
        description={`${CATEGORY_LABELS[data.category]} · ${data.positionName ?? "Jabatan belum diisi"}`}
        breadcrumbs={[
          { label: "Beranda", href: routes.dashboard },
          { label: "Data Pegawai", href: routes.employees.list },
          { label: data.fullName },
        ]}
        actions={
          <>
            <EmployeeStatusBadge status={data.activeStatus} />
            <Button variant="outline" nativeButton={false} render={<Link href={routes.employees.list} />}>
              <ArrowLeftIcon />
              Kembali
            </Button>
            {canManage ? (
              <>
                {data.activeStatus === "active" ? (
                  <Button variant="outline" onClick={() => setDeactivating(true)}>
                    <UserXIcon />
                    Nonaktifkan
                  </Button>
                ) : (
                  <Button variant="outline" onClick={reactivate} disabled={setActive.isPending}>
                    <UserCheckIcon />
                    Aktifkan kembali
                  </Button>
                )}
                <Button nativeButton={false} render={<Link href={routes.employees.edit(id)} />}>
                  <PencilIcon />
                  Ubah
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {data.activeStatus !== "active" && data.deactivationReason ? (
        <p className="rounded-lg border bg-muted px-4 py-3 text-sm">Alasan nonaktif: {data.deactivationReason}</p>
      ) : null}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-2">
        <div className="grid gap-6 lg:grid-cols-2">
          <Group title="Data pokok">
            <Info label="NIK" value={data.nationalIdNumber} />
            <Info label="NIP" value={data.employeeNumber} />
            <Info label="NIDN" value={data.lecturerNumber} />
            <Info label="Jenis kelamin" value={data.gender ? GENDER_LABELS[data.gender] : null} />
            <Info label="Tempat, tanggal lahir" value={[data.birthPlace, formatDate(data.birthDate)].filter(Boolean).join(", ")} />
            <Info label="Agama" value={data.religion} />
            <Info label="Status pernikahan" value={data.maritalStatus ? MARITAL_LABELS[data.maritalStatus] : null} />
          </Group>
          <Group title="Kontak dan alamat">
            <Info label="No. HP" value={data.phone} />
            <Info label="Email" value={data.email} />
            <div className="sm:col-span-2">
              <Info label="Alamat" value={address} />
            </div>
          </Group>
          <Group title="Data kepegawaian">
            <Info label="Status kepegawaian" value={employmentStatus ? employmentStatus.name : data.employmentStatusCode} />
            <Info label="Tanggal pengangkatan" value={formatDate(data.appointmentDate)} />
            <Info label="Unit kerja" value={data.workUnitName} />
            <Info label="Jabatan" value={data.positionName} />
            <Info label="Pangkat/golongan" value={data.rankGrade} />
            <Info label="Masa kerja" value={service} />
          </Group>
        </div>
        </TabsContent>
        <TabsContent value="history" className="pt-2">
          <HistoryPanel employeeId={id} canManage={canManage} />
        </TabsContent>
        <TabsContent value="documents" className="pt-2">
          <DocumentsPanel employeeId={id} canManage={canManage} />
        </TabsContent>
      </Tabs>

      <DeactivateDialog employeeId={id} employeeName={data.fullName} open={deactivating} onOpenChange={setDeactivating} />
    </>
  );
}
