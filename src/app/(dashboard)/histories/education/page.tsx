import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { EducationHistoryPanel } from "@/features/employee-history/components/education-history-panel";

export const metadata: Metadata = {
  title: "Riwayat Pendidikan",
};

export default async function EducationHistoriesPage() {
  const user = await requirePermission(PERMISSIONS.employeeView);
  return (
    <PageContainer>
      <EducationHistoryPanel canManage={user.permissions.includes(PERMISSIONS.employeeManage)} />
    </PageContainer>
  );
}
