import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { TrainingPanel } from "@/features/training/components/training-panel";

export const metadata: Metadata = {
  title: "Diklat",
};

export default async function TrainingPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);
  return (
    <PageContainer>
      <TrainingPanel employeeId={user.employeeId} />
    </PageContainer>
  );
}
