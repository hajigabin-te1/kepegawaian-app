import type { ReactNode } from "react";
import { cn } from "cn";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/** Responsive content wrapper with consistent padding and max width. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
