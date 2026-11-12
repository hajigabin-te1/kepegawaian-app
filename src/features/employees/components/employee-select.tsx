"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployeeOptions } from "@/features/employees/hooks/use-employees";

type EmployeeSelectProps = {
  value: string;
  onChange: (employeeId: string) => void;
  invalid?: boolean;
};

/** Picker for the employee a record belongs to (used on cross-employee pages). */
export function EmployeeSelect({ value, onChange, invalid }: EmployeeSelectProps) {
  const options = useEmployeeOptions();
  const items = Object.fromEntries(
    (options.data ?? []).map((employee) => [
      employee.id,
      employee.employeeNumber ? `${employee.fullName} · ${employee.employeeNumber}` : employee.fullName,
    ]),
  );

  return (
    <Select items={items} value={value || null} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger className="w-full" aria-label="Pegawai" aria-invalid={invalid ? true : undefined}>
        <SelectValue placeholder={options.isPending ? "Memuat pegawai…" : "Pilih pegawai"} />
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
