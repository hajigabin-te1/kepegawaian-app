import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { PeriodsPanel } from "@/features/performance/components/periods-panel";

export const metadata: Metadata = {
  title: "Periode Penilaian",
};

export default async function PeriodsPanelPage() {
  await requirePermission(PERMISSIONS.appraisalManage);
  return (
    <PageContainer>
      <PeriodsPanel />
    </PageContainer>
  );
}
