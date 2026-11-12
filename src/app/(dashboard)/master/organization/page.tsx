import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { OrganizationStructure } from "@/features/master-data/components/organization-structure";

export const metadata: Metadata = {
  title: "Struktur Organisasi",
};

export default async function OrganizationStructurePage() {
  await requirePermission(PERMISSIONS.masterManage);
  return (
    <PageContainer>
      <OrganizationStructure />
    </PageContainer>
  );
}
