import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Upload, FileSpreadsheet, LayoutDashboard, GitCompareArrows, Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MODEL_NAV = [
  { slug: "bom-diff", label: "BOM Diff", icon: GitCompareArrows },
  { slug: "aas-bom-diff", label: "AAS BOM Diff", icon: Layers },
];

const topItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload File", icon: Upload },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const NavItem = ({ to, label, icon: Icon, isActive }: { to: string; label: string; icon: React.ElementType; isActive: boolean }) => {
    const content = (
      <Link
        to={to}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-popover z-50">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight truncate">Regression</h1>
                <p className="text-xs text-sidebar-foreground/60">Dashboard</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 shrink-0 h-8 w-8"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            {topItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} isActive={location.pathname === item.to} />
            ))}
          </div>

          <div>
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">Models</p>
            )}
            {collapsed && <div className="border-t border-sidebar-border my-2" />}
            <div className="space-y-1">
              {MODEL_NAV.map((item) => {
                const path = `/model/${item.slug}`;
                return (
                  <NavItem key={item.slug} to={path} label={item.label} icon={item.icon} isActive={location.pathname === path} />
                );
              })}
            </div>
          </div>
        </nav>

        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/40">QA Regression Tool v1.0</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
