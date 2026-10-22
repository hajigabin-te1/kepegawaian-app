import Link from "next/link";
import { cn } from "cn";

import { routes } from "@/config/routes";

export const INSTITUTION_NAME = "Sekolah Tinggi Ilmu Administrasi Amuntai";

type AppBrandProps = {
  /** `inverse` is used on navy surfaces such as the sidebar. */
  tone?: "default" | "inverse";
  /** Shows only the monogram (collapsed sidebar). */
  compact?: boolean;
};

export function BrandMonogram({ tone = "default", className }: { tone?: "default" | "inverse"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-wider",
        tone === "inverse" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      STIA
    </span>
  );
}

export function AppBrand({ tone = "default", compact = false }: AppBrandProps) {
  const inverse = tone === "inverse";

  return (
    <Link
      href={routes.dashboard}
      aria-label={`${INSTITUTION_NAME} — Beranda`}
      title={INSTITUTION_NAME}
      className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
    >
      <BrandMonogram tone={tone} />
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span className="block text-[13px] font-semibold">{INSTITUTION_NAME}</span>
          <span
            className={cn(
              "mt-0.5 block text-[11px] font-medium tracking-wide uppercase",
              inverse ? "text-sidebar-foreground/60" : "text-muted-foreground",
            )}
          >
            Sistem Kepegawaian
          </span>
        </span>
      )}
    </Link>
  );
}
