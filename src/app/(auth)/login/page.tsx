import { useId } from "react";
import type { Metadata } from "next";
import { ClipboardListIcon, FolderKanbanIcon, KeyRoundIcon, ShieldCheckIcon, UsersRoundIcon } from "lucide-react";

import { BrandMonogram, INSTITUTION_NAME } from "@/components/layout/app-brand";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

const HIGHLIGHTS = [
  { icon: UsersRoundIcon, title: "Data pegawai terpusat", description: "Profil dosen dan tenaga kependidikan dalam satu tempat." },
  { icon: ClipboardListIcon, title: "Status & riwayat tertata", description: "Pantau status aktif, cuti, dan riwayat kepegawaian." },
  { icon: FolderKanbanIcon, title: "Dokumen terverifikasi", description: "Kelengkapan berkas pegawai lebih mudah ditelusuri." },
];

/** Restrained geometric accents for the navy brand panel. */
function BrandPattern({ compact = false }: { compact?: boolean }) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-accent">
      <defs>
        <pattern id={patternId} width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M36 0H0V36" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="100%" cy="0" r="160" strokeOpacity="0.28" />
        <circle cx="100%" cy="0" r="240" strokeOpacity="0.16" />
        <circle cx="100%" cy="0" r="320" strokeOpacity="0.08" />
      </g>
      {compact ? null : (
        <>
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="0" cy="100%" r="200" strokeOpacity="0.12" />
            <circle cx="0" cy="100%" r="120" strokeOpacity="0.2" />
          </g>
          <g fill="currentColor">
            <circle cx="86%" cy="58%" r="3" fillOpacity="0.6" />
            <circle cx="90%" cy="58%" r="3" fillOpacity="0.35" />
            <circle cx="94%" cy="58%" r="3" fillOpacity="0.15" />
          </g>
          <rect x="78%" y="76%" width="64" height="64" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.3" />
          <rect x="81%" y="80%" width="64" height="64" rx="8" fill="currentColor" fillOpacity="0.1" />
        </>
      )}
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="flex w-full flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Mobile / tablet brand header */}
      <header className="relative overflow-hidden bg-primary px-6 pt-10 pb-8 text-primary-foreground lg:hidden">
        <BrandPattern compact />
        <div className="relative flex items-center gap-3">
          <BrandMonogram tone="inverse" className="size-11" />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{INSTITUTION_NAME}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/70">Sistem Informasi Kepegawaian</p>
          </div>
        </div>
        <div className="relative mt-6 h-1 w-12 rounded-full bg-accent" />
      </header>

      {/* Login form */}
      <section className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-14 lg:py-10">
        <div className="hidden items-center gap-3 lg:flex">
          <BrandMonogram />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{INSTITUTION_NAME}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Sistem Informasi Kepegawaian</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-6 lg:py-10">
          <div className="w-full max-w-md space-y-7">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
                <ShieldCheckIcon className="size-3.5" />
                Portal Kepegawaian
              </span>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Masuk ke akun Anda</h1>
              <p className="text-sm text-muted-foreground">
                Kelola data dosen dan tenaga kependidikan {INSTITUTION_NAME}.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-5 sm:p-6">
              <LoginForm />
            </div>

            <div className="flex gap-3 rounded-lg border border-l-4 border-l-accent bg-card p-4 text-xs text-muted-foreground">
              <KeyRoundIcon className="mt-px size-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Mode pengembangan</p>
                <p>
                  Autentikasi masih sementara (mock). Gunakan akun demo{" "}
                  <span className="font-medium text-foreground tabular-nums">admin</span> /{" "}
                  <span className="font-medium text-foreground tabular-nums">admin123</span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground lg:text-left">
          Lupa password? Hubungi Bagian Kepegawaian untuk mengatur ulang akun Anda.
        </p>
      </section>

      {/* Desktop brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-14">
        <BrandPattern />
        <div className="relative flex items-center gap-3">
          <BrandMonogram tone="inverse" className="size-12 text-xs" />
          <div className="leading-tight">
            <p className="font-semibold">{INSTITUTION_NAME}</p>
            <p className="mt-0.5 text-xs tracking-wide text-primary-foreground/65 uppercase">
              Sistem Informasi Kepegawaian
            </p>
          </div>
        </div>

        <div className="relative max-w-lg space-y-8">
          <div className="space-y-4">
            <div className="h-1 w-14 rounded-full bg-accent" />
            <h2 className="text-4xl leading-tight font-semibold tracking-tight">
              Data kepegawaian yang rapi, layanan yang lebih cepat.
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/75">
              Satu sistem untuk mengelola data, status, dan dokumen pegawai secara terpusat.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-primary-foreground/5 text-accent">
                  <Icon className="size-5" />
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-primary-foreground/70">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-between border-t border-primary-foreground/15 pt-5 text-xs text-primary-foreground/60">
          <span>© 2026 STIA Amuntai</span>
          <span>Versi pengembangan</span>
        </div>
      </aside>
    </div>
  );
}
