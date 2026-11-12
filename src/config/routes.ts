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
    organization: "/master/organization",
  },
  histories: {
    positions: "/histories/positions",
    education: "/histories/education",
  },
  documents: "/documents",
  accounts: "/accounts",
  settings: {
    roles: "/settings/roles",
    app: "/settings/app",
  },
  profile: {
    password: "/profile/password",
  },
} as const;
