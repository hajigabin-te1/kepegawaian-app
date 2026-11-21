import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { FormsPanel } from "@/features/performance/components/forms-panel";

// The permission check reads the session, so navigation into this page is allowed to block.
export const instant = false;

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
