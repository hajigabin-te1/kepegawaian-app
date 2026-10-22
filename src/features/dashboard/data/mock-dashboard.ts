/**
 * MOCK DATA — for layout purposes only.
 * Replace with the real dashboard/employee API once the contract in
 * docs/api-contract.md (section 7) is confirmed.
 */
export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
  newEmployeesThisMonth: number;
  newEmployeesLastMonth: number;
  pendingDocuments: number;
  overdueDocuments: number;
  updatedAt: string;
};

export type RecentEmployeeStatus = "active" | "onLeave" | "inactive";

export type EmployeeCategory = "lecturer" | "staff";

export type RecentEmployee = {
  id: string;
  employeeNumber: string;
  name: string;
  position: string;
  unit: string;
  category: EmployeeCategory;
  joinedAt: string;
  status: RecentEmployeeStatus;
};

export type PendingDocument = {
  id: string;
  employeeName: string;
  documentType: string;
  submittedAt: string;
  waitingDays: number;
};

export const mockDashboardStats: DashboardStats = {
  totalEmployees: 248,
  activeEmployees: 231,
  onLeaveEmployees: 9,
  inactiveEmployees: 8,
  newEmployeesThisMonth: 6,
  newEmployeesLastMonth: 4,
  pendingDocuments: 14,
  overdueDocuments: 5,
  updatedAt: "2026-10-22",
};

export const mockRecentEmployees: RecentEmployee[] = [
  {
    id: "mock-1",
    employeeNumber: "198903142015032001",
    name: "Siti Rahmawati",
    position: "Analis Kepegawaian",
    unit: "Bagian Umum",
    category: "staff",
    joinedAt: "2026-10-20",
    status: "active",
  },
  {
    id: "mock-2",
    employeeNumber: "199107222016041002",
    name: "Budi Santoso, S.Kom.",
    position: "Pranata Komputer",
    unit: "UPT Teknologi Informasi",
    category: "staff",
    joinedAt: "2026-10-14",
    status: "active",
  },
  {
    id: "mock-3",
    employeeNumber: "198812052014032003",
    name: "Dr. Dewi Lestari, M.Si.",
    position: "Lektor",
    unit: "Prodi Administrasi Publik",
    category: "lecturer",
    joinedAt: "2026-10-07",
    status: "onLeave",
  },
  {
    id: "mock-4",
    employeeNumber: "199304182019031004",
    name: "Agus Prasetyo",
    position: "Arsiparis",
    unit: "Bagian Umum",
    category: "staff",
    joinedAt: "2026-10-02",
    status: "active",
  },
  {
    id: "mock-5",
    employeeNumber: "199208112018032005",
    name: "Nurul Hidayah, M.AP.",
    position: "Asisten Ahli",
    unit: "Prodi Administrasi Bisnis",
    category: "lecturer",
    joinedAt: "2026-09-30",
    status: "active",
  },
  {
    id: "mock-6",
    employeeNumber: "199501302020122006",
    name: "Rina Kurniawati",
    position: "Staf Perencanaan",
    unit: "Bagian Perencanaan",
    category: "staff",
    joinedAt: "2026-09-28",
    status: "inactive",
  },
];

export const mockPendingDocuments: PendingDocument[] = [
  { id: "doc-1", employeeName: "Siti Rahmawati", documentType: "SK Pengangkatan", submittedAt: "2026-10-21", waitingDays: 1 },
  { id: "doc-2", employeeName: "Budi Santoso, S.Kom.", documentType: "Ijazah Terakhir", submittedAt: "2026-10-17", waitingDays: 5 },
  { id: "doc-3", employeeName: "Dr. Dewi Lestari, M.Si.", documentType: "Surat Izin Cuti", submittedAt: "2026-10-13", waitingDays: 9 },
  { id: "doc-4", employeeName: "Agus Prasetyo", documentType: "Kartu Keluarga", submittedAt: "2026-10-12", waitingDays: 10 },
];
