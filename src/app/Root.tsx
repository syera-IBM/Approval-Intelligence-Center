import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Layers,
  GitBranch,
  Video,
  Settings,
  HelpCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  User,
  LayoutGrid,
  Building2 as BuildingIcon,
} from "lucide-react";
import { INDUSTRIES, getIndustry, getFunctionalArea, getModule, FA_SHORT } from "./data/taxonomy";

// ─── Agent panel ─────────────────────────────────────────────────────────────

interface Message { role: "user" | "assistant"; content: string; }

const AGENT_RESPONSES: Record<string, string> = {
  default:     "Hello. I'm your **Approval Process Agent**. Ask me who needs to approve a transaction, how routing works, or which deck to reference.",
  "75000":     "For **$75,000**, the routing is:\n\n1. **Supervisor / Manager**\n2. **Department Head** (required above $10K)\n3. **Finance Controller** (required above $50K)\n\nThe CPO threshold ($250K) is not triggered. SLA: **2 business days**.",
  sole:        "**Sole-source** approval requires:\n\n1. Written justification attached\n2. **Requesting Manager** sign-off\n3. **Legal Counsel** review\n4. **CPO** final approval\n\nSLA: **5 business days**.",
  contract:    "**Contract approval** timelines:\n\n- Under $500K → Legal + Procurement Director: **5–7 days**\n- $500K–$1M → Adds CFO: **7–10 days**\n- Above $1M → Board ratification: **10+ days**",
  cpo:         "The **CPO** is required when:\n\n- Requisition > **$250,000**\n- Any **sole-source** justification filed\n- **Emergency procurement** declared\n- **Contract value > $500,000**",
  interagency: "**ICA approval** steps:\n\n1. Agency Procurement Lead\n2. Receiving Agency Head\n3. State Central Procurement\n\nSigned MOU must be on file. SLA: **3–7 business days**.",
};

function getResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("75") || q.includes("75,000"))      return AGENT_RESPONSES["75000"];
  if (q.includes("sole"))                              return AGENT_RESPONSES.sole;
  if (q.includes("contract"))                         return AGENT_RESPONSES.contract;
  if (q.includes("cpo") || q.includes("chief"))       return AGENT_RESPONSES.cpo;
  if (q.includes("interagency") || q.includes("ica")) return AGENT_RESPONSES.interagency;
  return AGENT_RESPONSES.default;
}

const SUGGESTIONS = [
  "Who approves a $75K requisition?",
  "When is CPO required?",
  "What triggers ICA routing?",
];

function AgentPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: AGENT_RESPONSES.default },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = (text?: string) => {
    const value = text ?? input.trim();
    if (!value) return;
    setMessages((m) => [...m, { role: "user", content: value }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: getResponse(value) }]);
      setLoading(false);
    }, 700);
  };

  const renderContent = (content: string) =>
    content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ color: "#0f62fe" }}>{part.slice(2, -2)}</strong>
        : part.split("\n").map((line, j, arr) => (
            <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
          ))
    );

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#ffffff" }}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid #e0e0e0", background: "#f4f4f4" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "#24a148" }} />
          <span className="text-xs font-semibold" style={{ color: "#161616", letterSpacing: "0.04em" }}>
            APPROVAL AGENT
          </span>
        </div>
        <button onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#e0e0e0] transition-colors">
          <X size={14} style={{ color: "#525252" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 rounded-full"
              style={{ background: msg.role === "assistant" ? "#d0e2ff" : "#e0e0e0" }}>
              {msg.role === "assistant"
                ? <Bot size={12} style={{ color: "#0f62fe" }} />
                : <User size={12} style={{ color: "#525252" }} />}
            </div>
            <div className="px-3 py-2.5 text-xs leading-relaxed max-w-[85%] rounded"
              style={msg.role === "assistant"
                ? { background: "#f4f4f4", color: "#161616", border: "1px solid #e0e0e0" }
                : { background: "#0f62fe", color: "#ffffff" }}>
              {renderContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 flex items-center justify-center rounded-full" style={{ background: "#d0e2ff" }}>
              <Bot size={12} style={{ color: "#0f62fe" }} />
            </div>
            <div className="px-3 py-3 flex gap-1 rounded" style={{ background: "#f4f4f4", border: "1px solid #e0e0e0" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#a8a8a8", animation: `bounce 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2 flex-shrink-0" style={{ borderTop: "1px solid #e0e0e0" }}>
        <div className="flex flex-wrap gap-1 pt-3">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="text-xs px-2.5 py-1 rounded transition-colors hover:bg-[#e0e0e0]"
              style={{ background: "#f4f4f4", color: "#525252", border: "1px solid #e0e0e0" }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-0">
          <input
            className="flex-1 px-3 py-2.5 text-xs outline-none"
            style={{ background: "#f4f4f4", color: "#161616", border: "1px solid #e0e0e0", borderRight: "none", borderBottom: "2px solid #0f62fe" }}
            placeholder="Ask about approvals…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={() => send()}
            className="w-10 flex items-center justify-center hover:bg-[#0353e9] transition-colors"
            style={{ background: "#0f62fe" }}>
            <Send size={14} style={{ color: "#ffffff" }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0); opacity:.4; }
          40%          { transform:translateY(-4px); opacity:1; }
        }
      `}</style>
    </div>
  );
}

// ─── Sidebar context hook ────────────────────────────────────────────────────
// Reads the current URL to derive industrySlug / faSlug / moduleSlug
// so the sidebar can show contextual nav items.

function useRouteContext() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  // /industry/:industrySlug/:faSlug/:moduleSlug
  if (parts[0] === "industry") {
    const industrySlug = parts[1] ?? null;
    const faSlug       = parts[2] ?? null;
    const moduleSlug   = parts[3] ?? null;
    const industry     = industrySlug ? getIndustry(industrySlug) : undefined;
    const fa           = industry && faSlug ? getFunctionalArea(industry, faSlug) : undefined;
    const mod          = fa && moduleSlug ? getModule(fa, moduleSlug) : undefined;
    return { industrySlug, faSlug, moduleSlug, industry, fa, mod };
  }
  return { industrySlug: null, faSlug: null, moduleSlug: null, industry: undefined, fa: undefined, mod: undefined };
}

// ─── Root layout ──────────────────────────────────────────────────────────────

const SANS = "'IBM Plex Sans', sans-serif";

export default function Root() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  // Track which industries are expanded in the sidebar
  const [expandedIndustries, setExpandedIndustries] = useState<Record<string, boolean>>({});
  const ctx = useRouteContext();

  const toggleIndustry = (slug: string) => {
    setExpandedIndustries((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  // Auto-expand the active industry
  const isIndustryExpanded = (slug: string) =>
    expandedIndustries[slug] !== undefined
      ? expandedIndustries[slug]
      : ctx.industrySlug === slug;

  const sidebarW = collapsed ? 48 : 224;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const btnStyle = (active: boolean, color = "#0f62fe"): React.CSSProperties => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    minHeight: 38,
    padding: collapsed ? "0" : "0 12px",
    gap: 8,
    background: active ? "#edf5ff" : "transparent",
    border: "none",
    cursor: "pointer",
    justifyContent: collapsed ? "center" : "flex-start",
    transition: "background 0.12s",
    boxSizing: "border-box",
    fontFamily: SANS,
  });

  const renderNavBtn = (
    id: string,
    label: string,
    IconComp: React.ElementType,
    path: string | null,
    color = "#0f62fe",
    indent = false,
    active?: boolean,
  ) => {
    const isAct = active ?? (path ? isActive(path) : (id === "agent" && agentOpen));
    return (
      <button
        key={id}
        onClick={() => {
          if (id === "agent") { setAgentOpen((o) => !o); return; }
          if (path) navigate(path);
        }}
        title={collapsed ? label : undefined}
        style={{
          ...btnStyle(isAct, color),
          paddingLeft: (!collapsed && indent) ? 24 : (!collapsed ? 12 : 0),
        }}
        onMouseOver={(e) => { if (!isAct) e.currentTarget.style.background = "#f4f4f4"; }}
        onMouseOut={(e)  => { if (!isAct) e.currentTarget.style.background = isAct ? "#edf5ff" : "transparent"; }}
      >
        {isAct && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />}
        <IconComp size={15} style={{ color: isAct ? color : "#525252", flexShrink: 0 }} strokeWidth={isAct ? 2 : 1.5} />
        {!collapsed && (
          <span style={{ fontSize: 12, color: isAct ? color : "#161616", fontWeight: isAct ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </span>
        )}
      </button>
    );
  };

  // ── Build contextual sidebar sections ────────────────────────────────────────

  // Header breadcrumb text
  let headerTitle = "Oracle Fusion Approval Intelligence";
  let headerSub   = "AI-Assisted Approval Workflow Designer";
  if (ctx.mod)      { headerTitle = ctx.mod.label;      headerSub = `${ctx.industry!.label} · ${FA_SHORT[ctx.fa!.slug] ?? ctx.fa!.label}`; }
  else if (ctx.fa)  { headerTitle = ctx.fa.label;       headerSub = ctx.industry!.label; }
  else if (ctx.industry) { headerTitle = ctx.industry.label; headerSub = "Select a Functional Area"; }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", fontFamily: SANS, background: "#f4f4f4" }}>

      {/* ── Left sidebar ── */}
      <aside style={{
        width: sidebarW, minWidth: sidebarW, maxWidth: sidebarW,
        background: "#ffffff", borderRight: "1px solid #e0e0e0",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease",
        overflow: "hidden", zIndex: 100, flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          height: 48, borderBottom: "1px solid #e0e0e0",
          display: "flex", alignItems: "center",
          padding: collapsed ? "0" : "0 14px", justifyContent: collapsed ? "center" : "flex-start", gap: 10, flexShrink: 0,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2.5, flexShrink: 0 }}>
            {[8, 6, 8, 6, 8].map((w, i) => <div key={i} style={{ height: 2, width: w, background: "#0f62fe" }} />)}
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#161616", letterSpacing: "0.08em", lineHeight: 1.3 }}>ORACLE FUSION</div>
              <div style={{ fontSize: 9, color: "#8d8d8d", letterSpacing: "0.05em", lineHeight: 1.3 }}>Approval Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "4px 0", scrollbarWidth: "none" }}>

          {/* Home / Industries header */}
          {!collapsed && <div style={{ padding: "8px 12px 3px", fontSize: 10, color: "#8d8d8d", letterSpacing: "0.07em", fontWeight: 600 }}>INDUSTRIES</div>}

          {/* All industries — always rendered */}
          {INDUSTRIES.map((industry) => {
            const IndIcon = industry.icon;
            const isActive = ctx.industrySlug === industry.slug;
            const isExpanded = isIndustryExpanded(industry.slug);

            return (
              <div key={industry.slug}>
                {/* Industry row */}
                <button
                  title={collapsed ? industry.label : undefined}
                  onClick={() => {
                    if (collapsed) {
                      navigate(`/industry/${industry.slug}`);
                    } else {
                      toggleIndustry(industry.slug);
                      navigate(`/industry/${industry.slug}`);
                    }
                  }}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    minHeight: 36,
                    padding: collapsed ? "0" : "0 12px",
                    gap: 8,
                    background: isActive ? "#edf5ff" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    justifyContent: collapsed ? "center" : "flex-start",
                    boxSizing: "border-box",
                    fontFamily: SANS,
                  }}
                  onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = "#f4f4f4"; }}
                  onMouseOut={(e)  => { if (!isActive) e.currentTarget.style.background = isActive ? "#edf5ff" : "transparent"; }}
                >
                  {isActive && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: industry.color }} />}
                  <IndIcon size={15} style={{ color: isActive ? industry.color : "#525252", flexShrink: 0 }} strokeWidth={isActive ? 2 : 1.5} />
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, fontSize: 12, color: isActive ? industry.color : "#161616", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
                        {industry.label}
                      </span>
                      <ChevronRight
                        size={12}
                        style={{
                          color: "#8d8d8d",
                          flexShrink: 0,
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.15s",
                        }}
                      />
                    </>
                  )}
                </button>

                {/* FA sub-items — shown when expanded and not collapsed */}
                {isExpanded && !collapsed && industry.functionalAreas.map((fa) => {
                  const FAIcon = fa.icon;
                  const faActive = ctx.industrySlug === industry.slug && ctx.faSlug === fa.slug;
                  const faExpanded = faActive;

                  return (
                    <div key={fa.slug}>
                      {/* FA row */}
                      <button
                        onClick={() => navigate(`/industry/${industry.slug}/${fa.slug}`)}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          minHeight: 34,
                          paddingLeft: 24,
                          paddingRight: 12,
                          gap: 7,
                          background: faActive ? `${fa.color}12` : "transparent",
                          border: "none",
                          cursor: "pointer",
                          justifyContent: "flex-start",
                          boxSizing: "border-box",
                          fontFamily: SANS,
                        }}
                        onMouseOver={(e) => { if (!faActive) e.currentTarget.style.background = "#f4f4f4"; }}
                        onMouseOut={(e)  => { if (!faActive) e.currentTarget.style.background = faActive ? `${fa.color}12` : "transparent"; }}
                      >
                        {faActive && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: fa.color }} />}
                        <FAIcon size={13} style={{ color: faActive ? fa.color : "#525252", flexShrink: 0 }} strokeWidth={faActive ? 2 : 1.5} />
                        <span style={{ flex: 1, fontSize: 11, color: faActive ? fa.color : "#525252", fontWeight: faActive ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
                          {FA_SHORT[fa.slug] ?? fa.label}
                        </span>
                        {faExpanded && ctx.fa && (
                          <ChevronRight size={11} style={{ color: "#8d8d8d", flexShrink: 0, transform: "rotate(90deg)" }} />
                        )}
                      </button>

                      {/* Module sub-items — shown when this FA is active */}
                      {faExpanded && ctx.fa && ctx.fa.slug === fa.slug && ctx.fa.modules.map((mod) => {
                        const ModIcon = mod.icon;
                        const modActive = ctx.moduleSlug === mod.slug;
                        const avail = mod.activities.some((a) => a.available);
                        return (
                          <button
                            key={mod.slug}
                            onClick={() => avail && navigate(`/industry/${industry.slug}/${fa.slug}/${mod.slug}`)}
                            style={{
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              minHeight: 30,
                              paddingLeft: 38,
                              paddingRight: 12,
                              gap: 7,
                              background: modActive ? `${mod.color}10` : "transparent",
                              border: "none",
                              cursor: avail ? "pointer" : "default",
                              opacity: avail ? 1 : 0.45,
                              justifyContent: "flex-start",
                              boxSizing: "border-box",
                              fontFamily: SANS,
                            }}
                            onMouseOver={(e) => { if (avail && !modActive) e.currentTarget.style.background = "#f4f4f4"; }}
                            onMouseOut={(e)  => { if (avail && !modActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            {modActive && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: mod.color }} />}
                            <ModIcon size={11} style={{ color: modActive ? mod.color : "#8d8d8d", flexShrink: 0 }} strokeWidth={1.5} />
                            <span style={{ fontSize: 11, color: modActive ? mod.color : "#525252", fontWeight: modActive ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left" }}>
                              {mod.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Resources — always visible */}
          <div style={{ height: 1, background: "#e0e0e0", margin: "6px 8px" }} />
          {!collapsed && <div style={{ padding: "6px 12px 3px", fontSize: 10, color: "#8d8d8d", letterSpacing: "0.07em", fontWeight: 600 }}>RESOURCES</div>}
          {renderNavBtn("decks",   "Resource Decks",     Layers,    "/decks")}
          {renderNavBtn("process", "Process Flows",      GitBranch, "/process")}
          {renderNavBtn("webinar", "Webinars",           Video,     "/webinar")}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid #e0e0e0", padding: "4px 0", flexShrink: 0 }}>
          {renderNavBtn("agent",    "AI Agent",  Bot,         null)}
          {renderNavBtn("settings", "Settings",  Settings,    "/settings")}
          {renderNavBtn("help",     "Help",      HelpCircle,  "/help")}

          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{ display: "flex", alignItems: "center", width: "100%", height: 38, padding: collapsed ? "0" : "0 12px", gap: 8, background: "transparent", border: "none", cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start", boxSizing: "border-box" }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
            onMouseOut={(e)  => { e.currentTarget.style.background = "transparent"; }}
          >
            {collapsed
              ? <ChevronRight size={15} style={{ color: "#8d8d8d" }} />
              : <><ChevronLeft size={15} style={{ color: "#8d8d8d" }} /><span style={{ fontSize: 12, color: "#525252" }}>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Top header */}
        <header style={{
          height: 48, background: "#0f62fe", borderBottom: "1px solid #0353e9",
          display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
        }}>
          {/* Context breadcrumb in header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            {ctx.industry && (
              <>
                <BuildingIcon size={14} style={{ color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
                <button
                  onClick={() => navigate(`/industry/${ctx.industrySlug}`)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", fontSize: 12, padding: 0, fontFamily: SANS, whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                >
                  {ctx.industry.label}
                </button>
              </>
            )}
            {ctx.fa && (
              <>
                <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <button
                  onClick={() => navigate(`/industry/${ctx.industrySlug}/${ctx.faSlug}`)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.75)", fontSize: 12, padding: 0, fontFamily: SANS, whiteSpace: "nowrap" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
                >
                  {FA_SHORT[ctx.fa.slug] ?? ctx.fa.label}
                </button>
              </>
            )}
            {ctx.mod && (
              <>
                <ChevronRight size={11} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                <span style={{ color: "#ffffff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {ctx.mod.label}
                </span>
              </>
            )}
            {!ctx.industry && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", letterSpacing: "0.01em" }}>
                Oracle Fusion Approval Intelligence Center
              </span>
            )}
          </div>

          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap", flexShrink: 0 }}>
            AI-Assisted Workflow Designer
          </span>

          {/* Avatar */}
          <div style={{ width: 30, height: 30, background: "#ffffff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0f62fe", flexShrink: 0 }}>SY</div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: "#ffffff", fontWeight: 500, lineHeight: 1.3 }}>Satyadev Y.</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>Procurement Lead</div>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          <main style={{ flex: 1, overflowY: "auto", background: "#f4f4f4", scrollbarWidth: "none" }}>
            <Outlet />
          </main>

          {agentOpen && (
            <aside style={{ width: 320, minWidth: 320, maxWidth: 320, borderLeft: "1px solid #e0e0e0", display: "flex", flexDirection: "column", flexShrink: 0, background: "#ffffff" }}>
              <AgentPanel onClose={() => setAgentOpen(false)} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
