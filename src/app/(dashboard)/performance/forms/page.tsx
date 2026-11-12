import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { FormsPanel } from "@/features/performance/components/forms-panel";

export const metadata: Metadata = {
  title: "Form Penilaian",
};

export default async function FormsPanelPage() {
  await requirePermission(PERMISSIONS.appraisalManage);
  return (
    <PageContainer>
      <FormsPanel />
    </PageContainer>
  );
}
