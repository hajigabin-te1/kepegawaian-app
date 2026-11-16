import type { Metadata } from "next";
import { Suspense } from "react";

import { TableSkeleton } from "@/components/common/table-skeleton";
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
      <Suspense fallback={<TableSkeleton />}>
        <AccountsPanel currentUserId={user.id} />
      </Suspense>
    </PageContainer>
  );
}
