export type UserAccount = {
  id: string;
  email: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  isActive: boolean;
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
  /** Links the account to an employee record (required when HR creates the account). */
  employeeId?: string;
};

export type AccountUpdate = {
  roleId: number;
  isActive: boolean;
};
