"use client";

import { useState } from "react";
import { FilePenLineIcon, InboxIcon, UserXIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useEmployee } from "@/features/employees/hooks/use-employees";
import { RequestDiff, RequestStatusBadge, employeeToFieldValues } from "@/features/profile-requests/components/request-parts";
import { RequestFormDialog } from "@/features/profile-requests/components/request-form-dialog";
import { useMyRequests } from "@/features/profile-requests/hooks/use-profile-requests";
import { CHANGE_FIELDS, formatFieldValue } from "@/features/profile-requests/types/profile-requests";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

function MyProfile({ employeeId }: { employeeId: string }) {
  const employee = useEmployee(employeeId);
  const requests = useMyRequests(employeeId);
  const [open, setOpen] = useState(false);

  if (employee.isPending) return <Skeleton className="h-64 w-full" />;
  if (employee.isError) return <QueryErrorState error={employee.error} onRetry={() => void employee.refetch()} />;
  if (!employee.data) {
    return (
      <Card>
        <EmptyState icon={UserXIcon} title="Data pegawai tidak ditemukan" description="Hubungi Bagian Kepegawaian untuk memeriksa data Anda." />
      </Card>
    );
  }

  const values = employeeToFieldValues(employee.data);
  const hasPending = requests.data?.some((r) => r.status === "pending") ?? false;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Data pribadi</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <FilePenLineIcon />
            Ajukan Perbaikan Data
          </Button>
        </CardHeader>
        <CardContent>
          {hasPending ? (
            <p className="mb-4 rounded-lg border bg-muted px-4 py-3 text-sm">Ada pengajuan yang masih menunggu persetujuan Bagian Kepegawaian.</p>
          ) : null}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHANGE_FIELDS.map((field) => (
              <div key={field.key}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="text-sm font-medium">{formatFieldValue(field, values[field.key])}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Data kepegawaian (NIP, unit kerja, jabatan, status) hanya dapat diubah oleh Bagian Kepegawaian.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-lg font-semibold">Riwayat pengajuan</CardTitle>
        </CardHeader>
        {requests.isPending ? (
          <TableSkeleton rows={3} />
        ) : requests.isError ? (
          <QueryErrorState error={requests.error} onRetry={() => void requests.refetch()} />
        ) : requests.data.length === 0 ? (
          <EmptyState icon={InboxIcon} title="Belum ada pengajuan" description="Pengajuan perbaikan data Anda akan tampil di sini." />
        ) : (
          <div className="divide-y">
            {requests.data.map((request) => (
              <div key={request.id} className="space-y-3 px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    {dateFormatter.format(new Date(request.createdAt))} · {request.reason}
                  </p>
                  <RequestStatusBadge status={request.status} />
                </div>
                <RequestDiff request={request} />
                {request.reviewNote ? <p className="text-sm text-muted-foreground">Catatan Kepegawaian: {request.reviewNote}</p> : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <RequestFormDialog open={open} onOpenChange={setOpen} current={values} />
    </>
  );
}

export function ProfilePanel({ employeeId }: { employeeId: string | null }) {
  return (
    <>
      <PageHeader
        title="Profil Saya"
        description="Lihat data pribadi Anda dan ajukan perbaikan jika ada yang keliru."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Profil Saya" }]}
        actions={
          <Button variant="outline" nativeButton={false} render={<a href={routes.profile.password} />}>
            Ganti Password
          </Button>
        }
      />
      {employeeId ? (
        <MyProfile employeeId={employeeId} />
      ) : (
        <Card>
          <EmptyState
            icon={UserXIcon}
            title="Akun belum terhubung ke data pegawai"
            description="Hubungi Bagian Kepegawaian agar akun Anda dikaitkan dengan data pegawai."
          />
        </Card>
      )}
    </>
  );
}
