import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { WorkUnitsPanel } from "@/features/master-data/components/work-units-panel";

export const metadata: Metadata = {
  title: "Unit Kerja",
};

export default async function WorkUnitsPage() {
  await requirePermission(PERMISSIONS.masterManage);
  return (
    <PageContainer>
      <WorkUnitsPanel />
    </PageContainer>
  );
}
