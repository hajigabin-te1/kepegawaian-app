import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { TrainingManagePanel } from "@/features/training/components/training-manage-panel";

export const metadata: Metadata = {
  title: "Kelola Diklat",
};

export default async function TrainingManagePage() {
  await requirePermission(PERMISSIONS.trainingManage);
  return (
    <PageContainer>
      <TrainingManagePanel />
    </PageContainer>
  );
}
