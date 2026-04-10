import { useState, useMemo } from "react";
import { FileSpreadsheet, Layers, AlertTriangle, CheckCircle2, Clock, Upload } from "lucide-react";
import StatCard from "../components/dashboard/StatCard"
import ReportOwnershipTable from "../components/dashboard/ReportOwnershipTable";
import NeedsAttentionPanel from "../components/dashboard/NeedsAttentionPanel";
import WeeklyCharts from "../components/dashboard/WeeklyCharts";
import WeekSelector from "../components/dashboard/WeekSelector";
import { MOCK_REPORTS, MOCK_WEEKLY_UPLOADS, getCurrentWeek, type WeekCycle } from "../lib/mockData";

function getWeekByOffset(offset: number): WeekCycle {
  const base = getCurrentWeek();
  const start = new Date(base.startDate);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  end.setHours(23, 59, 59, 999);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return { startDate: start, endDate: end, label: `${startStr} – ${endStr}` };
}

const Index = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => getWeekByOffset(weekOffset), [weekOffset]);

  const reports = MOCK_REPORTS; // In production, filter by week
  const stats = useMemo(() => {
    const validated = reports.filter((r) => r.status === "Validated").length;
    const attention = reports.filter((r) => r.needsAttention).length;
    const pending = reports.filter((r) => r.status === "Pending").length;
    const totalRows = reports.reduce((s, r) => s + r.totalRows, 0);
    const validatedRows = reports.reduce((s, r) => s + r.validatedRows, 0);
    return { validated, attention, pending, total: reports.length, totalRows, validatedRows };
  }, [reports]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Regression Dashboard</h1>
            <p className="text-xs text-muted-foreground">Weekly regression activity overview</p>
          </div>
          <WeekSelector
            week={week}
            onPrev={() => setWeekOffset((o) => o - 1)}
            onNext={() => setWeekOffset((o) => o + 1)}
            canGoNext={weekOffset < 0}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Reports"
            value={stats.total}
            subtitle="This regression cycle"
            icon={FileSpreadsheet}
            variant="default"
          />
          <StatCard
            title="Validated"
            value={stats.validated}
            subtitle={`${Math.round((stats.validated / stats.total) * 100)}% complete`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Needs Attention"
            value={stats.attention}
            subtitle="Action required"
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatCard
            title="Pending Upload"
            value={stats.pending}
            subtitle="Awaiting from owners"
            icon={Upload}
            variant="warning"
          />
          <StatCard
            title="Row Coverage"
            value={`${Math.round((stats.validatedRows / stats.totalRows) * 100)}%`}
            subtitle={`${stats.validatedRows} / ${stats.totalRows} rows`}
            icon={Layers}
            variant="info"
          />
        </div>

        {/* Attention panel + Ownership table */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <NeedsAttentionPanel reports={reports} />
          </div>
          <div className="lg:col-span-3">
            <ReportOwnershipTable reports={reports} />
          </div>
        </div>

        {/* Charts */}
        <WeeklyCharts reports={reports} weeklyUploads={MOCK_WEEKLY_UPLOADS} />
      </main>
    </div>
  );
};

export default Index;