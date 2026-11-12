export type UserAccount = {
  id: string;
  email: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  employeeId: string | null;
  employeeName: string | null;
  lastSignInAt: string | null;
};

export type Role = {
  id: number;
  code: string;
  name: string;
};

export type NewAccount = {
  email: string;
  roleCode: string;
  temporaryPassword: string;
};

export type LinkableEmployee = { id: string; name: string; employeeNumber: string | null };

export type AccountUpdate = {
  roleId: number;
  employeeId: string | null;
  isActive: boolean;
};
