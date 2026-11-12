"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { PencilIcon, RotateCcwIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";

import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TIME_ZONE } from "@/config/locale";
import { routes } from "@/config/routes";
import { DocumentsPanel } from "@/features/documents/components/documents-panel";
import { EducationHistoryPanel } from "@/features/employee-history/components/education-history-panel";
import { PositionHistoryPanel } from "@/features/employee-history/components/position-history-panel";
import { DeactivateEmployeeDialog } from "@/features/employees/components/deactivate-employee-dialog";
import { EmployeeAccountCard } from "@/features/employees/components/employee-account-card";
import { EmployeeStatusBadge } from "@/features/employees/components/employee-status-badge";
import { useChangeEmployeeStatus, useEmployee } from "@/features/employees/hooks/use-employees";
import {
  CATEGORY_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  type EmployeeDetail,
} from "@/features/employees/types/employee";
import { ApiError } from "@/lib/api-error";
import { getInitials } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: APP_TIME_ZONE });
const formatDate = (value: string | null) => (value ? dateFormatter.format(new Date(value)) : null);

function InfoItem({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value === null || value === "" ? <span className="text-muted-foreground">—</span> : value}</dd>
    </div>
  );
}

function InfoGrid({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
      </CardContent>
    </Card>
  );
}

function serviceLength(employee: EmployeeDetail): string | null {
  if (employee.serviceYears === null && employee.serviceMonths === null) return null;
  return `${employee.serviceYears ?? 0} tahun ${employee.serviceMonths ?? 0} bulan`;
}

type EmployeeDetailViewProps = {
  employeeId: string;
  canManage: boolean;
};

export function EmployeeDetailView({ employeeId, canManage }: EmployeeDetailViewProps) {
  const employee = useEmployee(employeeId);
  const changeStatus = useChangeEmployeeStatus(employeeId);
  const [deactivating, setDeactivating] = useState(false);

  const breadcrumbs = [
    { label: "Beranda", href: routes.dashboard },
    { label: "Data Pegawai", href: routes.employees.list },
    { label: "Detail Pegawai" },
  ];

  if (employee.isPending) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (employee.isError) {
    return (
      <>
        <PageHeader title="Detail Pegawai" breadcrumbs={breadcrumbs} />
        <Card className="py-0">
          <QueryErrorState error={employee.error} onRetry={() => void employee.refetch()} />
        </Card>
      </>
    );
  }

  const data = employee.data;
  const reactivate = () =>
    changeStatus.mutate(
      { reactivate: true },
      {
        onSuccess: () => toast.success(`${data.fullName} diaktifkan kembali.`),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Status pegawai gagal diubah."),
      },
    );

  return (
    <>
      <PageHeader
        title="Detail Pegawai"
        breadcrumbs={breadcrumbs}
        actions={
          canManage ? (
            <>
              {data.activeStatus === "active" ? (
                <Button variant="outline" onClick={() => setDeactivating(true)}>
                  <UserXIcon />
                  Nonaktifkan
                </Button>
              ) : (
                <Button variant="outline" onClick={reactivate} disabled={changeStatus.isPending}>
                  <RotateCcwIcon />
                  Aktifkan Kembali
                </Button>
              )}
              <Button nativeButton={false} render={<Link href={routes.employees.edit(data.id)} />}>
                <PencilIcon />
                Ubah Data
              </Button>
            </>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
              {getInitials(data.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">{data.fullName}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {[data.employeeNumber && `NIP ${data.employeeNumber}`, data.lecturerNumber && `NIDN ${data.lecturerNumber}`]
                .filter(Boolean)
                .join(" · ") || "NIP/NIDN belum diisi"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <EmployeeStatusBadge status={data.activeStatus} />
              <Badge variant="accent">{CATEGORY_LABELS[data.category]}</Badge>
              {data.workUnitName ? <Badge variant="outline">{data.workUnitName}</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {data.activeStatus !== "active" && data.deactivationReason ? (
        <Alert>
          <UserXIcon />
          <AlertDescription>Alasan nonaktif: {data.deactivationReason}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="biodata" className="gap-4">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b">
          <TabsTrigger value="biodata">Biodata</TabsTrigger>
          <TabsTrigger value="employment">Kepegawaian</TabsTrigger>
          <TabsTrigger value="positions">Riwayat Jabatan</TabsTrigger>
          <TabsTrigger value="education">Riwayat Pendidikan</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
          <TabsTrigger value="account">Akun Login</TabsTrigger>
        </TabsList>

        <TabsContent value="biodata">
          <InfoGrid>
            <InfoItem label="Nama lengkap" value={data.fullName} />
            <InfoItem label="NIK" value={data.nationalIdNumber} />
            <InfoItem label="Tempat, tanggal lahir" value={[data.birthPlace, formatDate(data.birthDate)].filter(Boolean).join(", ") || null} />
            <InfoItem label="Jenis kelamin" value={data.gender ? GENDER_LABELS[data.gender] : null} />
            <InfoItem label="Agama" value={data.religion} />
            <InfoItem label="Status perkawinan" value={data.maritalStatus ? MARITAL_STATUS_LABELS[data.maritalStatus] : null} />
            <InfoItem label="Email" value={data.email} />
            <InfoItem label="No. HP" value={data.phone} />
            <InfoItem
              label="Alamat"
              className="sm:col-span-2 lg:col-span-3"
              value={[data.address, data.city, data.province, data.postalCode].filter(Boolean).join(", ") || null}
            />
          </InfoGrid>
        </TabsContent>

        <TabsContent value="employment">
          <InfoGrid>
            <InfoItem label="Kategori" value={CATEGORY_LABELS[data.category]} />
            <InfoItem label="NIP" value={data.employeeNumber} />
            <InfoItem label="NIDN" value={data.lecturerNumber} />
            <InfoItem label="Unit kerja" value={data.workUnitName} />
            <InfoItem label="Jabatan" value={data.positionName} />
            <InfoItem label="Status kepegawaian" value={data.employmentStatusName} />
            <InfoItem label="Golongan" value={data.rankGrade} />
            <InfoItem label="Tanggal pengangkatan" value={formatDate(data.appointmentDate)} />
            <InfoItem label="Masa kerja" value={serviceLength(data)} />
          </InfoGrid>
        </TabsContent>

        <TabsContent value="positions">
          <PositionHistoryPanel employeeId={data.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="education">
          <EducationHistoryPanel employeeId={data.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsPanel employeeId={data.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="account">
          <EmployeeAccountCard employeeId={data.id} employeeEmail={data.email} canManage={canManage} />
        </TabsContent>
      </Tabs>

      <DeactivateEmployeeDialog
        employeeId={data.id}
        employeeName={data.fullName}
        open={deactivating}
        onOpenChange={setDeactivating}
      />
    </>
  );
}
