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

export type AccountUpdate = {
  roleId: number;
  isActive: boolean;
};
