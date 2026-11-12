import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { MutationsPanel } from "@/features/mutation/components/mutations-panel";

export const metadata: Metadata = {
  title: "Mutasi Pegawai",
};

export default async function MutationsPage() {
  await requirePermission(PERMISSIONS.mutationManage);
  return (
    <PageContainer>
      <MutationsPanel />
    </PageContainer>
  );
}
