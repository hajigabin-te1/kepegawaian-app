import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { RolesPanel } from "@/features/roles/components/roles-panel";

export const metadata: Metadata = {
  title: "Peran & Hak Akses",
};

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.roleManage);
  return (
    <PageContainer>
      <RolesPanel />
    </PageContainer>
  );
}
