/**
 * MOCK DATA — for layout purposes only.
 * Replace with the real dashboard/employee API once the contract in
 * docs/api-contract.md (section 7) is confirmed.
 */
export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  newEmployeesThisMonth: number;
  pendingDocuments: number;
  updatedAt: string;
};

export type RecentEmployeeStatus = "active" | "onLeave" | "inactive";

export type RecentEmployee = {
  id: string;
  name: string;
  position: string;
  unit: string;
  joinedAt: string;
  status: RecentEmployeeStatus;
};

export const mockDashboardStats: DashboardStats = {
  totalEmployees: 248,
  activeEmployees: 231,
  newEmployeesThisMonth: 6,
  pendingDocuments: 14,
  updatedAt: "2026-10-22",
};

export const mockRecentEmployees: RecentEmployee[] = [
  {
    id: "mock-1",
    name: "Siti Rahmawati",
    position: "Analis Kepegawaian",
    unit: "Bagian Umum",
    joinedAt: "2026-10-20",
    status: "active",
  },
  {
    id: "mock-2",
    name: "Budi Santoso",
    position: "Pranata Komputer",
    unit: "Bagian Teknologi Informasi",
    joinedAt: "2026-10-14",
    status: "active",
  },
  {
    id: "mock-3",
    name: "Dewi Lestari",
    position: "Bendahara",
    unit: "Bagian Keuangan",
    joinedAt: "2026-10-07",
    status: "onLeave",
  },
  {
    id: "mock-4",
    name: "Agus Prasetyo",
    position: "Arsiparis",
    unit: "Bagian Umum",
    joinedAt: "2026-10-02",
    status: "active",
  },
  {
    id: "mock-5",
    name: "Rina Kurniawati",
    position: "Staf Perencanaan",
    unit: "Bagian Perencanaan",
    joinedAt: "2026-09-28",
    status: "inactive",
  },
];
