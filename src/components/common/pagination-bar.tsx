import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationBarProps = {
  page: number;
  pageSize: number;
  total: number;
  itemLabel: string;
  isFetching: boolean;
  onPageChange: (page: number) => void;
};

export function PaginationBar({ page, pageSize, total, itemLabel, isFetching, onPageChange }: PaginationBarProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t px-6 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span className="tabular-nums">
        Menampilkan {first}–{last} dari {total} {itemLabel}
      </span>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isFetching}>
            <ChevronLeftIcon />
            Sebelumnya
          </Button>
          <span className="tabular-nums">
            {page} / {pageCount}
          </span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount || isFetching}>
            Berikutnya
            <ChevronRightIcon />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
