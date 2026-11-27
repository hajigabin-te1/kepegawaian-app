"use client";

import Link from "next/link";
import { InfoIcon, UserPlusIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/config/permissions";
import { routes } from "@/config/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceTab } from "@/features/dashboard/components/attendance-tab";
import { EmployeeStatistics } from "@/features/dashboard/components/employee-statistics";
import { LeaveTab } from "@/features/dashboard/components/leave-tab";
import { PendingActionsCard } from "@/features/dashboard/components/pending-actions-card";
import { useScopeInfo } from "@/features/dashboard/hooks/use-dashboard";
import { AppraisalRecapView } from "@/features/performance/components/recap-panel";
import type { SessionUser } from "@/features/auth/types/auth";

type StatisticsDashboardProps = {
  user: Pick<SessionUser, "id" | "roleCode" | "permissions">;
};

/** Aggregated statistics for leaders (their scope) and HR (whole campus). No per-employee rows. */
export function StatisticsDashboard({ user }: StatisticsDashboardProps) {
  const isHr = user.roleCode === "hr_admin";
  const scope = useScopeInfo(user.id, !isHr);
  const hasPending = ["leave.manage", "employee.manage", "appraisal.manage"].some((p) => user.permissions.includes(p));

  const canManageEmployees = user.permissions.includes(PERMISSIONS.employeeManage);
  const scopeText = isHr ? "Seluruh kampus" : scope.data?.labels.join(", ");

  return (
    <>
      <PageHeader
        title="Dashboard Statistik"
        description={scopeText ? `Cakupan: ${scopeText}. Data agregat dosen dan tenaga kependidikan.` : "Data agregat dosen dan tenaga kependidikan."}
        actions={
          canManageEmployees ? (
            <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
              <UserPlusIcon />
              Tambah pegawai
            </Button>
          ) : null
        }
      />

      {!isHr && scope.data?.missing ? (
        <Alert>
          <InfoIcon />
          <AlertTitle>Cakupan statistik belum diatur</AlertTitle>
          <AlertDescription>Hubungi Superadmin agar akun Anda diberi cakupan unit kerja untuk dashboard ini.</AlertDescription>
        </Alert>
      ) : null}

      {hasPending ? <PendingActionsCard permissions={user.permissions} /> : null}

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Pegawai</TabsTrigger>
          <TabsTrigger value="attendance">Presensi</TabsTrigger>
          <TabsTrigger value="leave">Cuti</TabsTrigger>
          <TabsTrigger value="appraisal">Kinerja</TabsTrigger>
        </TabsList>
        <TabsContent value="employees" className="pt-3">
          <EmployeeStatistics canViewEmployees={user.permissions.includes(PERMISSIONS.employeeView)} />
        </TabsContent>
        <TabsContent value="attendance" className="pt-3">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="leave" className="pt-3">
          <LeaveTab />
        </TabsContent>
        <TabsContent value="appraisal" className="pt-3">
          <AppraisalRecapView />
        </TabsContent>
      </Tabs>
    </>
  );
}
