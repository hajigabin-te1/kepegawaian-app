import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center bg-background p-4 md:p-6 lg:p-8">
      {children}
    </main>
  );
}
