//export const dynamic = "force-dynamic";
import type { Metadata } from "next";
export const instant = false;
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { AppSettingsPanel } from "@/features/settings/components/app-settings-panel";



export const metadata: Metadata = {
  title: "Pengaturan Aplikasi",
};

export default async function AppSettingsPage() {
  await requirePermission(PERMISSIONS.settingsManage);
  return (
    <PageContainer>
      <Suspense fallback={<div>Loading...</div>}>
        <AppSettingsPanel />
      </Suspense>
    </PageContainer>
  );
}
