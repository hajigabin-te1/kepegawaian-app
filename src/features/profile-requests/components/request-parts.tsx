import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Employee } from "@/features/employees/types/employees";
import {
  CHANGE_FIELDS,
  REQUEST_STATUS_LABELS,
  formatFieldValue,
  type ChangeRequest,
  type FieldValues,
  type RequestStatus,
} from "@/features/profile-requests/types/profile-requests";

const STATUS_VARIANTS = { pending: "warning", approved: "success", rejected: "destructive", cancelled: "secondary" } as const;

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{REQUEST_STATUS_LABELS[status]}</Badge>;
}

/** Maps an employee record to the values of the fields that can be corrected. */
export function employeeToFieldValues(employee: Employee): FieldValues {
  return {
    full_name: employee.fullName,
    national_id_number: employee.nationalIdNumber ?? "",
    birth_place: employee.birthPlace ?? "",
    birth_date: employee.birthDate ?? "",
    gender: employee.gender ?? "",
    religion: employee.religion ?? "",
    marital_status: employee.maritalStatus ?? "",
    address: employee.address ?? "",
    city: employee.city ?? "",
    province: employee.province ?? "",
    postal_code: employee.postalCode ?? "",
    phone: employee.phone ?? "",
    email: employee.email ?? "",
  };
}

/** The requested changes; compares with the current value only while the request is pending. */
export function RequestDiff({ request }: { request: ChangeRequest }) {
  const showCurrent = request.status === "pending";
  const fields = CHANGE_FIELDS.filter((field) => field.key in request.requested);
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary hover:bg-secondary">
          <TableHead>Data</TableHead>
          {showCurrent ? <TableHead>Saat ini</TableHead> : null}
          <TableHead>Diajukan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => (
          <TableRow key={field.key}>
            <TableCell className="font-medium">{field.label}</TableCell>
            {showCurrent ? <TableCell className="text-muted-foreground">{formatFieldValue(field, request.current[field.key])}</TableCell> : null}
            <TableCell>{formatFieldValue(field, request.requested[field.key])}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
