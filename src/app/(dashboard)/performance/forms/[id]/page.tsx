import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { AppraisalFormPage } from "@/features/performance/components/appraisal-form";

export const metadata: Metadata = {
  title: "Isi Penilaian",
};

export default async function AppraisalFormRoute({ params }: PageProps<"/performance/forms/[id]">) {
  const [{ id }] = await Promise.all([params, requirePermission(PERMISSIONS.appraisalManage)]);
  return (
    <PageContainer>
      <AppraisalFormPage id={id} />
    </PageContainer>
  );
}
