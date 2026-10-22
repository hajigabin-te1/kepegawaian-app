import Link from "next/link";
import { BriefcaseBusinessIcon } from "lucide-react";
import { cn } from "cn";

import { routes } from "@/config/routes";

type AppBrandProps = {
  /** `inverse` is used on navy surfaces such as the sidebar. */
  tone?: "default" | "inverse";
};

export function AppBrand({ tone = "default" }: AppBrandProps) {
  const inverse = tone === "inverse";

  return (
    <Link href={routes.dashboard} className="flex items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          inverse ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <BriefcaseBusinessIcon className="size-4" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Kepegawaian</span>
        <span className={cn("block text-xs", inverse ? "text-sidebar-foreground/70" : "text-muted-foreground")}>
          Sistem Informasi Pegawai
        </span>
      </span>
    </Link>
  );
}
