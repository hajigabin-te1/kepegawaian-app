export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  employees: {
    list: "/employees",
    create: "/employees/new",
    detail: (id: string) => `/employees/${encodeURIComponent(id)}`,
    edit: (id: string) => `/employees/${encodeURIComponent(id)}/edit`,
  },
  masterData: {
    workUnits: "/master/work-units",
    positions: "/master/positions",
  },
  accounts: "/accounts",
  profile: {
    password: "/profile/password",
  },
} as const;
