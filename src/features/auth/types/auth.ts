export type UserRole = "admin";

export type SessionUser = {
  username: string;
  name: string;
  role: UserRole;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type AuthResult = {
  user: SessionUser;
  sessionToken: string;
};
