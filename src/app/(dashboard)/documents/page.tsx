import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { DocumentsPanel } from "@/features/documents/components/documents-panel";

export const metadata: Metadata = {
  title: "Dokumen Pegawai",
};

export default async function DocumentsPage() {
  const user = await requirePermission(PERMISSIONS.employeeView);
  return (
    <PageContainer>
      <DocumentsPanel canManage={user.permissions.includes(PERMISSIONS.employeeManage)} />
    </PageContainer>
  );
}
