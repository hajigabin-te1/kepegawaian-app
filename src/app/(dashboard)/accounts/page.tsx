import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { AccountsPanel } from "@/features/accounts/components/accounts-panel";
import { requirePermission } from "@/features/auth/services/auth-service";

export const metadata: Metadata = {
  title: "Pengguna",
};

export default async function AccountsPage() {
  const user = await requirePermission(PERMISSIONS.userManage);
  return (
    <PageContainer>
      <AccountsPanel currentUserId={user.id} />
    </PageContainer>
  );
}
