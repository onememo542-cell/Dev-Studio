import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useForge } from "@/lib/store";
import { PageHeader, PageContainer, PageSection } from "@/components/layout";
import {
  Sparkles,
  Bot,
  Component as ComponentIcon,
  LayoutTemplate,
  ArrowUpRight,
  Flame,
  TrendingUp,
  Globe,
  Server,
  Container,
  FlaskConical,
  GraduationCap,
  Star,
  Database,
  Heart,
  Users,
  Send,
  Mail,
  Code2,
  Linkedin,
  Twitter,
  Instagram,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Dev Studio" },
      { name: "description", content: "Overview of your AI dev hub." },
    ],
  }),
  component: Index,
});

function Index() {
  const {
    prompts,
    agents,
    components,
    templates,
    snippets,
    interviewQuestions,
    connectors,
    socialDrafts,
    mailTemplates,
  } = useForge();

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const recentPrompts = [...prompts].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const favoritePrompts = prompts.filter((p) => p.favorite);
  const totalUsage = prompts.reduce((acc, p) => acc + p.usageCount, 0);
  const favInterviewQs = interviewQuestions.filter((q) => q.favorite);

  const recentConnectors = [...connectors].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const companiesCount = connectors.filter((c) => c.type === "companies").length;
  const hrCount = connectors.filter((c) => c.type === "hr").length;
  const clientsCount = connectors.filter((c) => c.type === "clients").length;

  const linkedInDrafts = socialDrafts.filter((d) => d.platform === "linkedin").length;
  const twitterDrafts = socialDrafts.filter((d) => d.platform === "twitter").length;
  const instagramDrafts = socialDrafts.filter((d) => d.platform === "instagram").length;

  const coverLetters = mailTemplates.filter((m) => m.channel === "cover-letter").length;
  const gmailTemplates = mailTemplates.filter((m) => m.channel === "gmail").length;
  const whatsappTemplates = mailTemplates.filter((m) => m.channel === "whatsapp").length;

  const toolStats = [
    {
      label: "Prompts",
      value: prompts.length,
      hint: "in library",
      icon: Sparkles,
      to: "/tools",
      tab: "prompts",
    },
    {
      label: "Active agents",
      value: activeAgents,
      hint: `${agents.length} total`,
      icon: Bot,
      to: "/tools",
      tab: "agents",
    },
    {
      label: "Components",
      value: components.length,
      hint: "ready to reuse",
      icon: ComponentIcon,
      to: "/tools",
      tab: "components",
    },
    {
      label: "Templates",
      value: templates.length,
      hint: `${snippets.length} snippets`,
      icon: LayoutTemplate,
      to: "/tools",
      tab: "templates",
    },
  ] as const;

  const networkStats = [
    {
      label: "Connectors",
      value: connectors.length,
      hint: `${companiesCount} co · ${hrCount} HR · ${clientsCount} clients`,
      icon: Users,
      to: "/connectors",
    },
    {
      label: "Social drafts",
      value: socialDrafts.length,
      hint: `${linkedInDrafts} LI · ${twitterDrafts} X · ${instagramDrafts} IG`,
      icon: Send,
      to: "/social",
    },
    {
      label: "Mail templates",
      value: mailTemplates.length,
      hint: `${coverLetters} cover · ${gmailTemplates} gmail · ${whatsappTemplates} WA`,
      icon: Mail,
      to: "/mails",
    },
    {
      label: "Snippets",
      value: snippets.length,
      hint: "code snippets",
      icon: Code2,
      to: "/tools",
    },
  ];

  const focusAreas: {
    to: string;
    label: string;
    icon: React.ElementType;
    desc: string;
    color: string;
    iconColor: string;
    area: string;
    search?: Record<string, unknown>;
  }[] = [
    {
      to: "/tech-skills",
      label: "Frontend",
      icon: Globe,
      desc: "React, Angular, Vue, Svelte, Next.js",
      color: "from-primary/20 to-primary/5 border-primary/20",
      iconColor: "text-primary",
      area: "frontend",
      search: { tab: "frontend" },
    },
    {
      to: "/tech-skills",
      label: "Backend",
      icon: Server,
      desc: "Node.js, ASP.NET Core, Python, Go",
      color: "from-primary/20 to-primary/5 border-primary/20",
      iconColor: "text-primary",
      area: "backend",
      search: { tab: "backend" },
    },
    {
      to: "/tech-skills",
      label: "DevOps",
      icon: Container,
      desc: "CI/CD, containers, IaC, observability",
      color: "from-primary/20 to-primary/5 border-primary/20",
      iconColor: "text-primary",
      area: "devops",
      search: { tab: "devops" },
    },
    {
      to: "/tech-skills",
      label: "Testing",
      icon: FlaskConical,
      desc: "Frontend, Backend (.NET/Node/Python), E2E",
      color: "from-primary/20 to-primary/5 border-primary/20",
      iconColor: "text-primary",
      area: "testing",
      search: { tab: "testing" },
    },
    {
      to: "/tech-skills",
      label: "Database",
      icon: Database,
      desc: "SQL, NoSQL, Redis, indexing, transactions",
      color: "from-primary/20 to-primary/5 border-primary/20",
      iconColor: "text-primary",
      area: "database",
      search: { tab: "database" },
    },
    {
      to: "/soft-skills",
      label: "Soft Skills",
      icon: Heart,
      desc: "Communication, leadership, growth mindset",
      color: "from-primary/20 to-primary/5 border-primary/20",
      iconColor: "text-primary",
      area: "softskills",
    },
  ];

  const platformIcon = (platform: string) => {
    if (platform === "linkedin") return Linkedin;
    if (platform === "twitter") return Twitter;
    return Instagram;
  };

  const channelLabel = (channel: string) => {
    if (channel === "cover-letter") return "Cover letter";
    if (channel === "gmail") return "Gmail";
    return "WhatsApp";
  };

  return (
    <PageContainer className="overflow-y-auto">
      <PageSection>
          <PageHeader
            eyebrow="Welcome back"
            title="Your development hub"
            description="Save, organize and reuse everything that powers your next ship — prompts, agents, components, templates, snippets."
            className="mb-8"
            actions={
              <Link
                to="/tools"
                search={{ tab: "prompts" }}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider border border-border rounded px-3 py-2 hover:bg-card transition-colors"
              >
                Browse library <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
      </PageSection>

      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-[1400px] mx-auto w-full">

          {/* Tool stats */}
          <div className="mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Dev tools</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {toolStats.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  to="/tools"
                  search={{ tab: s.tab }}
                  className="group p-5 rounded-lg bg-card border border-border hover:border-ring/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {s.label}
                    </p>
                    <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-3xl font-semibold mt-2 tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
                </Link>
              );
            })}
          </div>

          {/* Network / comms stats */}
          <div className="mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Network & comms</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {networkStats.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  to={s.to}
                  className="group p-5 rounded-lg bg-card border border-border hover:border-ring/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {s.label}
                    </p>
                    <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-3xl font-semibold mt-2 tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
                </Link>
              );
            })}
          </div>

          {/* Focus areas */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-tight">Focus areas</h2>
              <Link
                to="/interview"
                className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <GraduationCap className="size-3.5" /> Interview prep
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {focusAreas.map((a) => {
                const Icon = a.icon;
                const count = interviewQuestions.filter((q) => q.area === a.area).length;
                return (
                  <Link
                    key={a.label}
                    to={a.to}
                    search={a.search}
                    className={`group p-5 rounded-lg border bg-gradient-to-br ${a.color} hover:opacity-90 transition-opacity`}
                  >
                    <Icon className={`size-5 ${a.iconColor} mb-3`} />
                    <p className="text-sm font-semibold mb-1">{a.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.desc}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2 flex items-center gap-1">
                      {count} Q&A
                      <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — recent prompts + recent connectors */}
            <section className="lg:col-span-2 space-y-6">

              {/* Recent prompts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" /> Recently updated prompts
                  </h2>
                  <Link
                    to="/tools"
                    search={{ tab: "prompts" }}
                    className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    View all
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {recentPrompts.map((p) => (
                    <Link
                      key={p.id}
                      to="/tools"
                      search={{ tab: "prompts", id: p.id }}
                      className="block p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono uppercase">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {timeAgo(p.updatedAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium mb-1 text-balance">{p.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent connectors */}
              {recentConnectors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                      <Users className="size-4 text-primary" /> Recent connectors
                    </h2>
                    <Link
                      to="/connectors"
                      className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {recentConnectors.map((c) => (
                      <Link
                        key={c.id}
                        to="/connectors"
                        className="block p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono uppercase">
                            {c.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {timeAgo(c.updatedAt)}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium mb-1">{c.name}</h3>
                        {c.email && (
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        )}
                        {c.notes && !c.email && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Social & mail preview */}
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Latest social draft */}
                {socialDrafts.length > 0 && (() => {
                  const draft = [...socialDrafts].sort((a, b) => b.updatedAt - a.updatedAt)[0];
                  const PlatformIcon = platformIcon(draft.platform);
                  return (
                    <Link
                      to="/social"
                      className="block p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <PlatformIcon className="size-4 text-primary" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Latest draft · {draft.platform}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {timeAgo(draft.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground line-clamp-4 leading-relaxed">{draft.content}</p>
                      <p className="text-[11px] font-mono text-primary mt-3 flex items-center gap-1">
                        {socialDrafts.length} drafts total <ArrowUpRight className="size-3" />
                      </p>
                    </Link>
                  );
                })()}

                {/* Latest mail template */}
                {mailTemplates.length > 0 && (() => {
                  const tpl = [...mailTemplates].sort((a, b) => b.updatedAt - a.updatedAt)[0];
                  return (
                    <Link
                      to="/mails"
                      className="block p-4 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="size-4 text-primary" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Latest template · {channelLabel(tpl.channel)}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                          {timeAgo(tpl.updatedAt)}
                        </span>
                      </div>
                      {tpl.subject && (
                        <p className="text-sm font-medium mb-1 truncate">{tpl.subject}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{tpl.content}</p>
                      <p className="text-[11px] font-mono text-primary mt-3 flex items-center gap-1">
                        {mailTemplates.length} templates total <ArrowUpRight className="size-3" />
                      </p>
                    </Link>
                  );
                })()}
              </div>
            </section>

            {/* Side rail */}
            <aside className="space-y-4">
              <div className="p-5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="size-4 text-primary" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-primary">
                    Builder assistant
                  </p>
                </div>
                <h3 className="text-sm font-semibold mb-1.5">Start a new app fast</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Describe what you're building. ForgeDev pulls the right prompts, components and
                  templates.
                </p>
                <Link
                  to="/tools"
                  search={{ tab: "prompts" }}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md"
                >
                  Open builder <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {/* Starred interview Qs */}
              <div className="p-5 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="size-4 text-accent" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Starred Q&A
                  </p>
                </div>
                {favInterviewQs.length > 0 ? (
                  <ul className="space-y-2">
                    {favInterviewQs.slice(0, 4).map((q) => (
                      <li key={q.id}>
                        <Link
                          to="/interview"
                          className="block text-xs text-foreground hover:text-primary transition-colors flex items-start gap-1.5"
                        >
                          <Star className="size-3 text-accent fill-accent mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{q.question}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Star questions in any focus area to see them here.
                  </p>
                )}
                <Link
                  to="/interview"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground mt-3"
                >
                  Open interview prep <ArrowUpRight className="size-3" />
                </Link>
              </div>

              {/* Top usage */}
              <div className="p-5 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="size-4 text-accent" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Top usage
                  </p>
                </div>
                <p className="text-2xl font-semibold tracking-tight mb-1">{totalUsage}</p>
                <p className="text-xs text-muted-foreground mb-4">total prompt invocations</p>
                <ul className="space-y-2">
                  {favoritePrompts.slice(0, 3).map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-foreground">{p.title}</span>
                      <span className="font-mono text-muted-foreground ml-2 shrink-0">
                        {p.usageCount}×
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connector breakdown */}
              <div className="p-5 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="size-4 text-accent" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Network
                  </p>
                </div>
                <ul className="space-y-2">
                  {[
                    { label: "Companies", value: companiesCount },
                    { label: "HR contacts", value: hrCount },
                    { label: "Clients", value: clientsCount },
                  ].map((row) => (
                    <li key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-mono font-semibold">{row.value}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/connectors"
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground mt-3"
                >
                  Manage connectors <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
