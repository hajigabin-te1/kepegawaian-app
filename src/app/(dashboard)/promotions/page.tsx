import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { PromotionsPanel } from "@/features/promotion/components/promotions-panel";

export const metadata: Metadata = {
  title: "Kenaikan Pangkat dan Jabatan",
};

export default async function PromotionsPage() {
  await requirePermission(PERMISSIONS.promotionManage);
  return (
    <PageContainer>
      <PromotionsPanel />
    </PageContainer>
  );
}
