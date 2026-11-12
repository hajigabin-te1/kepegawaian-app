import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APPRAISAL_STATUS_LABELS, type AppraisalPeriod, type AppraisalStatus } from "@/features/performance/types/performance";

const VARIANTS = { draft: "secondary", submitted: "warning", revision_requested: "destructive", verified: "success" } as const;

export function AppraisalStatusBadge({ status }: { status: AppraisalStatus }) {
  return <Badge variant={VARIANTS[status]}>{APPRAISAL_STATUS_LABELS[status]}</Badge>;
}

export const formatScore = (score: number | null) => (score === null ? "—" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(score));

/** Period picker shared by the forms and recap pages. */
export function PeriodSelect({ periods, value, onChange }: { periods: AppraisalPeriod[]; value: string; onChange: (id: string) => void }) {
  const items = Object.fromEntries(periods.map((p) => [p.id, p.isActive ? p.name : `${p.name} (ditutup)`]));
  return (
    <Select items={items} value={value || null} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-full sm:w-72" aria-label="Periode penilaian">
        <SelectValue placeholder="Pilih periode" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(items).map(([id, label]) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
