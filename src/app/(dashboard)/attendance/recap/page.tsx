import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { RecapPanel } from "@/features/attendance/components/recap-panel";

export const metadata: Metadata = {
  title: "Rekap Presensi",
};

export default async function AttendanceRecapPage() {
  const user = await requirePermission(PERMISSIONS.attendanceView);
  return (
    <PageContainer>
      <RecapPanel canManage={user.permissions.includes(PERMISSIONS.attendanceManage)} />
    </PageContainer>
  );
}
