"use client";

import { SearchableSelect } from "@/components/common/searchable-select";
import { useEmployeeOptions } from "@/features/employees/hooks/use-employees";

type EmployeeSelectProps = {
  value: string;
  onChange: (employeeId: string) => void;
  invalid?: boolean;
  /** Only list employees whose status is active (e.g. for new proposals or corrections). */
  activeOnly?: boolean;
};

/** Searchable picker (name or NIP) for the employee a record belongs to. */
export function EmployeeSelect({ value, onChange, invalid, activeOnly = false }: EmployeeSelectProps) {
  const employees = useEmployeeOptions();
  const options = (employees.data ?? [])
    .filter((employee) => !activeOnly || employee.activeStatus === "active")
    .map((employee) => ({
      value: employee.id,
      label: employee.employeeNumber ? `${employee.fullName} · ${employee.employeeNumber}` : employee.fullName,
    }));

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      loading={employees.isPending}
      invalid={invalid}
      ariaLabel="Pegawai"
      placeholder="Cari nama atau NIP pegawai…"
      emptyMessage={employees.isError ? "Daftar pegawai gagal dimuat." : "Pegawai tidak ditemukan."}
    />
  );
}
