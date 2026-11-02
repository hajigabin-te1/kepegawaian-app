import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { PositionsPanel } from "@/features/master-data/components/positions-panel";

export const metadata: Metadata = {
  title: "Jabatan",
};

export default async function PositionsPage() {
  await requirePermission(PERMISSIONS.masterManage);
  return (
    <PageContainer>
      <PositionsPanel />
    </PageContainer>
  );
}
