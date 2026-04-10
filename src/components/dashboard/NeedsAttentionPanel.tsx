import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RegressionReport } from "@/lib/mockData";
import { AlertTriangle, Clock, ShieldAlert, Wrench } from "lucide-react";

interface Props {
  reports: RegressionReport[];
}

function getAttentionType(reasons: string[]): { icon: typeof AlertTriangle; label: string; color: string } {
  const text = reasons.join(" ").toLowerCase();
  if (text.includes("time exceeded"))
    return { icon: Clock, label: "Time Exceeded", color: "text-destructive" };
  if (text.includes("not uploaded") || text.includes("pending from"))
    return { icon: ShieldAlert, label: "Pending Upload", color: "text-warning" };
  if (text.includes("not fully verified") || text.includes("not filled"))
    return { icon: AlertTriangle, label: "Not Fully Verified", color: "text-warning" };
  return { icon: AlertTriangle, label: "Needs Review", color: "text-muted-foreground" };
}

export default function NeedsAttentionPanel({ reports }: Props) {
  const attentionReports = reports.filter((r) => r.needsAttention);

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Reports Needing Attention
          <Badge variant="outline" className="ml-auto bg-destructive/10 text-destructive border-destructive/30 text-xs">
            {attentionReports.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {attentionReports.map((r) => {
          const attn = getAttentionType(r.attentionReasons);
          const Icon = attn.icon;
          const hasSkinnyDefect = r.defectsFixed.some((d) => d.fixedInBuild === "Skinny");

          return (
            <div key={r.id} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", attn.color)} />
                  <span className="font-semibold text-sm">{r.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn("text-[10px]", attn.color === "text-destructive" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning")}>
                    {attn.label}
                  </Badge>
                  {hasSkinnyDefect && (
                    <Badge variant="outline" className="text-[10px] border-info/30 bg-info/10 text-info">
                      <Wrench className="h-3 w-3 mr-0.5" />
                      Skinny Build Needed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Owner: <strong className="text-foreground">{r.owner.name}</strong> ({r.owner.role})</span>
                <span>•</span>
                <span>{r.validatedRows}/{r.totalRows} rows validated</span>
              </div>

              <ul className="space-y-1 pl-6">
                {r.attentionReasons.map((reason, i) => (
                  <li key={i} className="text-xs text-muted-foreground list-disc">{reason}</li>
                ))}
                {hasSkinnyDefect && (
                  <li className="text-xs text-info list-disc">
                    Defect fixed in Skinny build – new Skinny build needed for re-verification
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
