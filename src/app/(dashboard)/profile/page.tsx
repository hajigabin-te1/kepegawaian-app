import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { ProfilePanel } from "@/features/profile-requests/components/profile-panel";

export const metadata: Metadata = {
  title: "Profil Saya",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);
  return (
    <PageContainer>
      <ProfilePanel employeeId={user.employeeId} />
    </PageContainer>
  );
}
