import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { LeaveRequestsPanel } from "@/features/leave/components/leave-requests-panel";

export const metadata: Metadata = {
  title: "Pengajuan Cuti",
};

export default async function LeaveRequestsPage() {
  const user = await requirePermission(PERMISSIONS.leaveView);
  return (
    <PageContainer>
      <LeaveRequestsPanel canManage={user.permissions.includes(PERMISSIONS.leaveManage)} />
    </PageContainer>
  );
}
