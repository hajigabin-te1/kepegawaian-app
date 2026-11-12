import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { ChangeRequestsPanel } from "@/features/profile-requests/components/change-requests-panel";

export const metadata: Metadata = {
  title: "Perbaikan Data Pegawai",
};

export default async function ChangeRequestsPage() {
  await requirePermission(PERMISSIONS.employeeManage);
  return (
    <PageContainer>
      <ChangeRequestsPanel />
    </PageContainer>
  );
}
