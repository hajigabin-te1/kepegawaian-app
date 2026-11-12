import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { MyLeavePanel } from "@/features/leave/components/my-leave-panel";

export const metadata: Metadata = {
  title: "Cuti Saya",
};

export default async function MyLeavePage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);
  return (
    <PageContainer>
      <MyLeavePanel employeeId={user.employeeId} />
    </PageContainer>
  );
}
