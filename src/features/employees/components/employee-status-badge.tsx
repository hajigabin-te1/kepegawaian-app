import { Badge } from "@/components/ui/badge";
import { ACTIVE_STATUS_LABELS, type EmployeeActiveStatus } from "@/features/employees/types/employees";

const VARIANTS = { active: "success", inactive: "secondary", retired: "accent" } as const;

export function EmployeeStatusBadge({ status }: { status: EmployeeActiveStatus }) {
  return <Badge variant={VARIANTS[status]}>{ACTIVE_STATUS_LABELS[status]}</Badge>;
}
