"use client";

import { useState, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";

/**
 * Global search entry point. There is no search endpoint in the API contract
 * yet (docs/api-contract.md §5.3), so submitting only informs the user.
 */
export function HeaderSearch() {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    toast.info("Pencarian belum tersedia", {
      description: "Fitur pencarian pegawai akan aktif setelah API pencarian dikonfirmasi.",
    });
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-md">
      <label htmlFor="header-search" className="sr-only">
        Cari pegawai
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="header-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari nama pegawai, NIP, atau unit kerja…"
        className="h-10 rounded-lg border-border bg-background pl-9 shadow-none"
      />
    </form>
  );
}
