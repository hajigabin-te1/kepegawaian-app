import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { MyAppraisalsPanel } from "@/features/performance/components/my-appraisals-panel";

export const metadata: Metadata = {
  title: "Penilaian Saya",
};

export default async function MyAppraisalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);
  return (
    <PageContainer>
      <MyAppraisalsPanel employeeId={user.employeeId} />
    </PageContainer>
  );
}
