import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sparkles,
  Bot,
  Component as ComponentIcon,
  LayoutTemplate,
  Code2,
  Plus,
  Flame,
  Code,
  Heart,
  GraduationCap,
  Menu,
  X,
  Search,
  Users,
  Briefcase,
  FileText,
  CalendarDays,
} from "lucide-react";
import { CommandPalette } from "./command-palette";
import { ErrorBoundary } from "./error-boundary";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WORKSPACE_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/tools", label: "Tools", icon: Code2 },
] as const;

const COMMUNICATION_NAV = [
  { to: "/social", label: "Social Media", icon: ComponentIcon, match: ["/social"], search: { tab: "linkedin" } },
  { to: "/mails", label: "Mails & Messaging", icon: Bot, match: ["/mails"], search: { tab: "cover-letter" } },
  { to: "/connectors", label: "Connectors", icon: Users, match: ["/connectors"], search: { tab: "companies" } },
  { to: "/cv", label: "CV Builder", icon: FileText, match: ["/cv"], search: {} },
] as const;

const FREELANCE_NAV = [
  { to: "/jobs", label: "Jobs & Freelance", icon: Briefcase, match: ["/jobs"], search: { tab: "jobs" } },
] as const;

const SKILLS_NAV = [
  { to: "/tech-skills", label: "Tech Skills", icon: Code, match: ["/tech-skills"], search: { tab: "frontend" } },
  { to: "/soft-skills", label: "Soft Skills", icon: Heart, match: ["/soft-skills"], search: { tab: "communication" } },
] as const;

function NavItem({ item, active, isCollapsed }: { item: any; active: boolean; isCollapsed: boolean }) {
  const Icon = item.icon;
  const content = (
    <Link
      to={item.to}
      search={item.search}
      className={`flex items-center rounded-xl transition-all duration-150 ${
        isCollapsed ? "justify-center size-9 mx-auto" : "gap-2.5 px-3 py-2"
      } ${
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Icon className={`size-4 shrink-0 ${active ? "text-primary" : ""}`} />
      {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
    </Link>
  );

  if (!isCollapsed) return <li>{content}</li>;

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    </li>
  );
}

const SIDEBAR_KEY = "ds-sidebar-collapsed";
function readSidebarPref(): boolean {
  try { return localStorage.getItem(SIDEBAR_KEY) !== "false"; } catch { return true; }
}
function writeSidebarPref(collapsed: boolean) {
  try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch {}
}

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed: boolean }) {
  if (isCollapsed) return <div className="my-1 h-px bg-border/50 mx-2" />;
  return (
    <p className="px-3 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
      {label}
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(readSidebarPref);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      writeSidebarPref(!prev);
      return !prev;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/30">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] md:hidden"
        />
      )}

      {/* Sidebar — floats with padding */}
      <TooltipProvider delayDuration={0}>
        <div
          className={`fixed md:relative inset-y-0 left-0 z-[110] flex shrink-0 flex-col transition-[width,transform] duration-300 ease-in-out p-2 ${
            mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
          } ${isCollapsed ? "md:w-[72px]" : "md:w-[228px]"}`}
        >
          <nav className="flex flex-col flex-1 rounded-2xl bg-sidebar border border-border/60 shadow-sm overflow-hidden">
            {/* Logo */}
            <div className={`flex items-center shrink-0 px-3 py-3 ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
              <div className="size-7 rounded-xl bg-primary grid place-items-center shrink-0 shadow-sm">
                <Flame className="size-3.5 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col leading-tight overflow-hidden">
                  <span className="font-semibold tracking-tight text-sm truncate">Dev Studio</span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">your dev hub</span>
                </div>
              )}
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto md:hidden size-7 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Nav sections */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3 scrollbar-thin">
              <div>
                <SectionLabel label="Workspace" isCollapsed={isCollapsed} />
                <ul className="space-y-0.5">
                  {WORKSPACE_NAV.map((item) => {
                    const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                    return <NavItem key={item.to} item={item} active={active} isCollapsed={isCollapsed} />;
                  })}
                </ul>
              </div>

              <div>
                <SectionLabel label="Communication" isCollapsed={isCollapsed} />
                <ul className="space-y-0.5">
                  {COMMUNICATION_NAV.map((item) => {
                    const active = item.match.some((p) => pathname.startsWith(p));
                    return <NavItem key={item.label} item={item} active={active} isCollapsed={isCollapsed} />;
                  })}
                </ul>
              </div>

              <div>
                <SectionLabel label="Skills" isCollapsed={isCollapsed} />
                <ul className="space-y-0.5">
                  {SKILLS_NAV.map((item) => {
                    const active = item.match.some((p) => pathname.startsWith(p));
                    return <NavItem key={item.label} item={item} active={active} isCollapsed={isCollapsed} />;
                  })}
                </ul>
              </div>

              <div>
                <SectionLabel label="Freelance" isCollapsed={isCollapsed} />
                <ul className="space-y-0.5">
                  {FREELANCE_NAV.map((item) => {
                    const active = item.match.some((p) => pathname.startsWith(p));
                    return <NavItem key={item.label} item={item} active={active} isCollapsed={isCollapsed} />;
                  })}
                </ul>
              </div>

              <div>
                <SectionLabel label="Resources" isCollapsed={isCollapsed} />
                <ul className="space-y-0.5">
                  <NavItem
                    item={{ to: "/interview", label: "Interview", icon: GraduationCap }}
                    active={pathname.startsWith("/interview")}
                    isCollapsed={isCollapsed}
                  />
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className={`border-t border-border/60 ${isCollapsed ? "p-2" : "p-2"}`}>
              {!isCollapsed ? (
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors text-muted-foreground mb-2"
                >
                  <span className="flex items-center gap-2">
                    <Search className="size-3.5" /> Quick search
                  </span>
                  <kbd className="font-mono bg-background text-muted-foreground px-1.5 py-0.5 rounded-md border border-border text-[10px]">
                    ⌘K
                  </kbd>
                </button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setPaletteOpen(true)}
                      className="w-9 h-9 mx-auto flex items-center justify-center rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors text-muted-foreground mb-2"
                    >
                      <Search className="size-4 shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
                    Quick search (⌘K)
                  </TooltipContent>
                </Tooltip>
              )}
              <UserMenu isCollapsed={isCollapsed} />
            </div>
          </nav>
        </div>
      </TooltipProvider>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 p-2 pl-0 md:pl-0 gap-2">
        {/* Header — floating rounded bar */}
        <header className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/60 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden size-8 grid place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden md:grid size-8 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 shrink-0"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="size-4" />
            </button>
          </div>

          {/* Search bar */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex items-center gap-2.5 flex-1 min-w-0 max-w-sm text-left px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 hover:border-ring/40 hover:bg-muted/60 transition-all"
          >
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate">Search…</span>
            <kbd className="ml-auto font-mono bg-background text-muted-foreground px-1.5 py-0.5 rounded-md border border-border text-[10px] hidden sm:block">
              ⌘K
            </kbd>
          </button>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/tools"
              className="hidden md:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-xl px-3 py-1.5 hover:bg-muted/60 transition-all"
            >
              Library
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">New</span>
            </Link>
          </div>
        </header>

        {/* Page content — rounded card */}
        <main className="flex-1 flex flex-col min-h-0 rounded-2xl bg-background border border-border/60 shadow-sm overflow-hidden">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
