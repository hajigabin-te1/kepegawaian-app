export const routes = {
  login: "/login",
  dashboard: "/dashboard",
  employees: {
    list: "/employees",
    create: "/employees/new",
    changeRequests: "/employees/change-requests",
    detail: (id: string) => `/employees/${encodeURIComponent(id)}`,
    edit: (id: string) => `/employees/${encodeURIComponent(id)}/edit`,
  },
  attendance: {
    me: "/attendance",
    recap: "/attendance/recap",
  },
  leave: {
    me: "/leave",
    requests: "/leave/requests",
    holidays: "/leave/holidays",
  },
  masterData: {
    workUnits: "/master/work-units",
    positions: "/master/positions",
  },
  accounts: "/accounts",
  profile: {
    me: "/profile",
    password: "/profile/password",
  },
} as const;
