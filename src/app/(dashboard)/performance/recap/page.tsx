import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { RecapPanel } from "@/features/performance/components/recap-panel";

export const metadata: Metadata = {
  title: "Rekap Nilai Kinerja",
};

export default async function RecapPanelPage() {
  await requirePermission(PERMISSIONS.appraisalManage);
  return (
    <PageContainer>
      <RecapPanel />
    </PageContainer>
  );
}
