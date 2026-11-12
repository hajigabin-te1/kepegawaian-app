"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { routes } from "@/config/routes";
import { useCreateEmployee, useEmploymentStatuses, useUpdateEmployee } from "@/features/employees/hooks/use-employees";
import { employeeSchema, type EmployeeFormValues } from "@/features/employees/schemas/employee-schemas";
import { CATEGORY_LABELS, GENDER_LABELS, MARITAL_LABELS, type Employee } from "@/features/employees/types/employees";
import { usePositions, useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { ApiError } from "@/lib/api-error";

const NONE = "none";

function toFormValues(employee: Employee | null): EmployeeFormValues {
  const s = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));
  return {
    fullName: s(employee?.fullName),
    category: employee?.category ?? "staff",
    employeeNumber: s(employee?.employeeNumber),
    lecturerNumber: s(employee?.lecturerNumber),
    nationalIdNumber: s(employee?.nationalIdNumber),
    birthPlace: s(employee?.birthPlace),
    birthDate: s(employee?.birthDate),
    gender: employee?.gender ?? "",
    religion: s(employee?.religion),
    maritalStatus: employee?.maritalStatus ?? "",
    address: s(employee?.address),
    city: s(employee?.city),
    province: s(employee?.province),
    postalCode: s(employee?.postalCode),
    phone: s(employee?.phone),
    email: s(employee?.email),
    employmentStatusCode: s(employee?.employmentStatusCode),
    appointmentDate: s(employee?.appointmentDate),
    workUnitId: s(employee?.workUnitId),
    positionId: s(employee?.positionId),
    rankGrade: s(employee?.rankGrade),
    serviceYears: s(employee?.serviceYears),
    serviceMonths: s(employee?.serviceMonths),
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

type SelectFieldProps = {
  control: Control<EmployeeFormValues>;
  name: FieldPath<EmployeeFormValues>;
  label: string;
  options: Record<string, string>;
  /** Adds a "—" choice that stores an empty value. */
  allowEmpty?: boolean;
  error?: string;
};

function SelectField({ control, name, label, options, allowEmpty = false, error }: SelectFieldProps) {
  const items = allowEmpty ? { [NONE]: "—", ...options } : options;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            items={items}
            value={field.value === "" ? NONE : String(field.value)}
            onValueChange={(value) => field.onChange(value === NONE || value === null ? "" : value)}
          >
            <SelectTrigger className="w-full" aria-label={label}>
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(items).map(([value, text]) => (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

type EmployeeFormProps = {
  /** Employee being edited, or null to create a new one. */
  employee: Employee | null;
};

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const create = useCreateEmployee();
  const update = useUpdateEmployee(employee?.id ?? "");
  const statuses = useEmploymentStatuses();
  const workUnits = useWorkUnits();
  const positions = usePositions();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues: toFormValues(employee) });

  const pending = create.isPending || update.isPending;
  const failed = (error: unknown) => toast.error(error instanceof ApiError ? error.message : "Data pegawai gagal disimpan.");

  const onSubmit = (values: EmployeeFormValues) => {
    if (employee) {
      update.mutate(values, {
        onSuccess: () => {
          toast.success("Data pegawai diperbarui.");
          router.push(routes.employees.detail(employee.id));
        },
        onError: failed,
      });
    } else {
      create.mutate(values, {
        onSuccess: (id) => {
          toast.success("Pegawai ditambahkan.");
          router.push(routes.employees.detail(id));
        },
        onError: failed,
      });
    }
  };

  const field = (name: FieldPath<EmployeeFormValues>, label: string, props: { type?: string; placeholder?: string; inputMode?: "numeric" } = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`emp-${name}`}>{label}</Label>
      <Input id={`emp-${name}`} aria-invalid={errors[name] ? true : undefined} {...props} {...register(name)} />
      {errors[name] ? <p className="text-sm text-destructive">{errors[name]?.message}</p> : null}
    </div>
  );

  const unitOptions = Object.fromEntries((workUnits.data ?? []).filter((u) => u.isActive || u.id === employee?.workUnitId).map((u) => [u.id, u.name]));
  const positionOptions = Object.fromEntries((positions.data ?? []).filter((p) => p.isActive || p.id === employee?.positionId).map((p) => [p.id, p.name]));
  const statusOptions = Object.fromEntries((statuses.data ?? []).map((s) => [s.code, s.code === s.name ? s.code : `${s.code} — ${s.name}`]));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Section title="Data pokok">
        <div className="sm:col-span-2">{field("fullName", "Nama lengkap")}</div>
        <SelectField control={control} name="category" label="Kategori" options={CATEGORY_LABELS} error={errors.category?.message} />
        {field("nationalIdNumber", "NIK")}
        {field("employeeNumber", "NIP")}
        {field("lecturerNumber", "NIDN (dosen)")}
        {field("birthPlace", "Tempat lahir")}
        {field("birthDate", "Tanggal lahir", { type: "date" })}
        <SelectField control={control} name="gender" label="Jenis kelamin" options={GENDER_LABELS} allowEmpty />
        {field("religion", "Agama")}
        <SelectField control={control} name="maritalStatus" label="Status pernikahan" options={MARITAL_LABELS} allowEmpty />
      </Section>

      <Section title="Kontak dan alamat">
        {field("phone", "No. HP")}
        {field("email", "Email", { type: "email" })}
        <div className="sm:col-span-2">{field("address", "Alamat")}</div>
        {field("city", "Kota/Kabupaten")}
        {field("province", "Provinsi")}
        {field("postalCode", "Kode pos", { inputMode: "numeric" })}
      </Section>

      <Section title="Data kepegawaian">
        <SelectField control={control} name="employmentStatusCode" label="Status kepegawaian" options={statusOptions} allowEmpty />
        {field("appointmentDate", "Tanggal pengangkatan", { type: "date" })}
        <SelectField control={control} name="workUnitId" label="Unit kerja" options={unitOptions} allowEmpty />
        <SelectField control={control} name="positionId" label="Jabatan" options={positionOptions} allowEmpty />
        {field("rankGrade", "Pangkat/golongan")}
        <div className="grid grid-cols-2 gap-4">
          {field("serviceYears", "Masa kerja (tahun)", { inputMode: "numeric" })}
          {field("serviceMonths", "Masa kerja (bulan)", { inputMode: "numeric" })}
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={employee ? routes.employees.detail(employee.id) : routes.employees.list} />}
        >
          Batal
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          Simpan
        </Button>
      </div>
    </form>
  );
}
