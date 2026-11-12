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
  performance: {
    me: "/performance",
    periods: "/performance/periods",
    forms: "/performance/forms",
    form: (id: string) => `/performance/forms/${encodeURIComponent(id)}`,
    recap: "/performance/recap",
  },
  announcements: "/announcements",
  training: {
    me: "/training",
    manage: "/training/manage",
  },
  mutations: "/mutations",
  promotions: "/promotions",
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
