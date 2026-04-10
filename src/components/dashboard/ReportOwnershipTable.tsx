import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RegressionReport } from "@/lib/mockData";
import { Users } from "lucide-react";

interface Props {
  reports: RegressionReport[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  Validated: { label: "Validated", className: "bg-success/15 text-success border-success/30" },
  "Partially Validated": { label: "Partial", className: "bg-warning/15 text-warning border-warning/30" },
  Pending: { label: "Pending", className: "bg-destructive/15 text-destructive border-destructive/30" },
  "Not Started": { label: "Not Started", className: "bg-muted text-muted-foreground border-border" },
  Uploaded: { label: "Uploaded", className: "bg-info/15 text-info border-info/30" },
};

export default function ReportOwnershipTable({ reports }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-primary" />
          Report Ownership Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Report</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Model</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Build</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Owner</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Progress</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const sc = statusConfig[r.status] || statusConfig["Not Started"];
                const pct = r.totalRows > 0 ? Math.round((r.validatedRows / r.totalRows) * 100) : 0;
                return (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.modelType}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{r.buildType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {r.owner.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-xs font-medium leading-none">{r.owner.name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.owner.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("text-[10px] font-semibold", sc.className)}>
                        {sc.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct === 100 ? "bg-success" : pct > 0 ? "bg-warning" : "bg-destructive/40"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
