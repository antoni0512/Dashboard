// Mock data for executive regression dashboard
// Replace with real Supabase queries later

export interface Owner {
  id: string;
  name: string;
  role: "QA" | "KE" | "KB";
  avatar?: string;
}

export interface ValidationRow {
  id: string;
  rowLabel: string;
  keComment: string | null; // KE Comments (Related ALM / PERT ID)
  kbGoNoGo: "Go" | "No Go" | null; // KB Go/No Go
  validatedAt: string | null;
}

export interface RegressionReport {
  id: string;
  name: string;
  modelType: string;
  buildType: "Skinny" | "Fat" | "Full";
  status: "Uploaded" | "Pending" | "Validated" | "Partially Validated" | "Not Started";
  owner: Owner;
  uploadedAt: string | null;
  releaseDate: string | null;
  totalRows: number;
  validatedRows: number;
  validationRows: ValidationRow[];
  needsAttention: boolean;
  attentionReasons: string[];
  defectsFixed: { id: string; description: string; fixedInBuild: "Skinny" | "Fat" }[];
}

export interface WeekCycle {
  startDate: Date;
  endDate: Date;
  label: string;
}

// Owners
export const MOCK_OWNERS: Owner[] = [
  { id: "o1", name: "Priya Sharma", role: "QA" },
  { id: "o2", name: "Ravi Kumar", role: "KE" },
  { id: "o3", name: "Anita Desai", role: "KB" },
  { id: "o4", name: "Vikram Patel", role: "QA" },
  { id: "o5", name: "Meena Iyer", role: "KE" },
  { id: "o6", name: "Suresh Reddy", role: "KB" },
];

// Helper to get current regression week (starts Monday)
export function getCurrentWeek(): WeekCycle {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 4); // Friday
  end.setHours(23, 59, 59, 999);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return { startDate: start, endDate: end, label: `${startStr} – ${endStr}` };
}

function makeValidationRows(total: number, validated: number): ValidationRow[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `vr-${i}`,
    rowLabel: `Test Case ${i + 1}`,
    keComment: i < validated ? `ALM-${1000 + i}` : null,
    kbGoNoGo: i < validated ? "Go" : null,
    validatedAt: i < validated ? new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() : null,
  }));
}

const week = getCurrentWeek();
const mon = week.startDate.toISOString();
const tue = new Date(week.startDate.getTime() + 86400000).toISOString();
const wed = new Date(week.startDate.getTime() + 86400000 * 2).toISOString();

export const MOCK_REPORTS: RegressionReport[] = [
  {
    id: "r1",
    name: "BOM Diff",
    modelType: "ECU-A",
    buildType: "Skinny",
    status: "Pending",
    owner: MOCK_OWNERS[0],
    uploadedAt: null,
    releaseDate: mon,
    totalRows: 24,
    validatedRows: 0,
    validationRows: makeValidationRows(24, 0),
    needsAttention: true,
    attentionReasons: [
      "Report not uploaded – Pending from QA (Priya Sharma)",
      "BOM comparison cannot proceed without baseline file",
    ],
    defectsFixed: [],
  },
  {
    id: "r2",
    name: "Memory Map Analysis",
    modelType: "ECU-A",
    buildType: "Fat",
    status: "Partially Validated",
    owner: MOCK_OWNERS[1],
    uploadedAt: tue,
    releaseDate: mon,
    totalRows: 18,
    validatedRows: 7,
    validationRows: makeValidationRows(18, 7),
    needsAttention: true,
    attentionReasons: [
      "Not fully verified – 11 of 18 rows pending KE validation",
      "KE Comments missing for rows 8–18",
      "KB Go/No Go not filled for 11 rows",
    ],
    defectsFixed: [],
  },
  {
    id: "r3",
    name: "Calibration Delta Report",
    modelType: "ECU-B",
    buildType: "Skinny",
    status: "Partially Validated",
    owner: MOCK_OWNERS[4],
    uploadedAt: mon,
    releaseDate: mon,
    totalRows: 32,
    validatedRows: 10,
    validationRows: makeValidationRows(32, 10),
    needsAttention: true,
    attentionReasons: [
      "Time exceeded – 22 of 32 rows not validated",
      "KE yet to complete validation (Meena Iyer)",
      "Uploaded 3 days ago with minimal progress",
    ],
    defectsFixed: [
      { id: "d1", description: "Cal param offset in module X", fixedInBuild: "Skinny" },
    ],
  },
  {
    id: "r4",
    name: "DTC Mapping Verification",
    modelType: "ECU-A",
    buildType: "Full",
    status: "Validated",
    owner: MOCK_OWNERS[2],
    uploadedAt: mon,
    releaseDate: mon,
    totalRows: 15,
    validatedRows: 15,
    validationRows: makeValidationRows(15, 15),
    needsAttention: false,
    attentionReasons: [],
    defectsFixed: [],
  },
  {
    id: "r5",
    name: "CAN Signal Matrix",
    modelType: "ECU-C",
    buildType: "Fat",
    status: "Not Started",
    owner: MOCK_OWNERS[1],
    uploadedAt: wed,
    releaseDate: mon,
    totalRows: 40,
    validatedRows: 0,
    validationRows: makeValidationRows(40, 0),
    needsAttention: true,
    attentionReasons: [
      "Time exceeded – KE yet to start the validation",
      "All 40 rows pending: KE Comments and KB Go/No Go not filled",
    ],
    defectsFixed: [
      { id: "d2", description: "Signal timeout on CAN-FD bus", fixedInBuild: "Skinny" },
    ],
  },
  {
    id: "r6",
    name: "Flash Sequence Report",
    modelType: "ECU-B",
    buildType: "Skinny",
    status: "Partially Validated",
    owner: MOCK_OWNERS[3],
    uploadedAt: tue,
    releaseDate: mon,
    totalRows: 12,
    validatedRows: 9,
    validationRows: makeValidationRows(12, 9),
    needsAttention: true,
    attentionReasons: [
      "Not fully verified – 3 remaining rows need KB sign-off",
    ],
    defectsFixed: [
      { id: "d3", description: "Flash checksum mismatch", fixedInBuild: "Skinny" },
    ],
  },
  {
    id: "r7",
    name: "NVM Data Integrity",
    modelType: "ECU-C",
    buildType: "Full",
    status: "Validated",
    owner: MOCK_OWNERS[5],
    uploadedAt: mon,
    releaseDate: mon,
    totalRows: 20,
    validatedRows: 20,
    validationRows: makeValidationRows(20, 20),
    needsAttention: false,
    attentionReasons: [],
    defectsFixed: [],
  },
  {
    id: "r8",
    name: "Bootloader Compatibility",
    modelType: "ECU-A",
    buildType: "Fat",
    status: "Pending",
    owner: MOCK_OWNERS[4],
    uploadedAt: null,
    releaseDate: mon,
    totalRows: 28,
    validatedRows: 0,
    validationRows: makeValidationRows(28, 0),
    needsAttention: true,
    attentionReasons: [
      "Report not uploaded – Pending from KE (Meena Iyer)",
      "Bootloader test results awaited from lab",
    ],
    defectsFixed: [],
  },
];

// Weekly upload history for charts (last 6 weeks)
export const MOCK_WEEKLY_UPLOADS = (() => {
  const data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekLabel = `W${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    data.push({
      week: weekLabel,
      uploads: Math.floor(Math.random() * 6) + 2,
      validated: Math.floor(Math.random() * 5) + 1,
    });
  }
  // Current week is real
  data[5] = {
    week: "This Week",
    uploads: MOCK_REPORTS.filter((r) => r.uploadedAt).length,
    validated: MOCK_REPORTS.filter((r) => r.status === "Validated").length,
  };
  return data;
})();
