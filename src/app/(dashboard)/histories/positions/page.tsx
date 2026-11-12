import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { PositionHistoryPanel } from "@/features/employee-history/components/position-history-panel";

export const metadata: Metadata = {
  title: "Riwayat Jabatan",
};

export default async function PositionHistoriesPage() {
  const user = await requirePermission(PERMISSIONS.employeeView);
  return (
    <PageContainer>
      <PositionHistoryPanel canManage={user.permissions.includes(PERMISSIONS.employeeManage)} />
    </PageContainer>
  );
}
