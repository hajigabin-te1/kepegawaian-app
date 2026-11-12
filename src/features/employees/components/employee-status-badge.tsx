import { Badge } from "@/components/ui/badge";
import { ACTIVE_STATUS_LABELS, type EmployeeActiveStatus } from "@/features/employees/types/employee";

const VARIANTS: Record<EmployeeActiveStatus, "success" | "secondary" | "warning"> = {
  active: "success",
  inactive: "secondary",
  retired: "warning",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeActiveStatus }) {
  return <Badge variant={VARIANTS[status]}>{ACTIVE_STATUS_LABELS[status]}</Badge>;
}
