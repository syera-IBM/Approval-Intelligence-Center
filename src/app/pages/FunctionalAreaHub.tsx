/**
 * FunctionalAreaHub.tsx
 *
 * Unified hub page for a Functional Area (SCM, Finance, HCM) within an industry.
 * Layout intentionally mirrors ApprovalType.tsx:
 *   • Page header with icon, label, description, back button
 *   • Row 1: 4 resource tiles (Approvals Overview, Process Flows, Customer Examples, Demo)
 *   • Row 2: Module list — each module has an expandable Requirements & Process Flow accordion
 *            identical to the existing RequirementsPanel
 *
 * URL: /industry/:industrySlug/:faSlug
 * URL: /industry/:industrySlug/:faSlug/:moduleSlug  (deep-links to open a specific module)
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Layers, GitBranch, FolderOpen, Video,
  ArrowLeft, ArrowRight, ChevronRight, X, Wrench, ExternalLink, ClipboardList,
  CheckCheck,
} from "lucide-react";

import { getIndustry, getFunctionalArea, FA_SHORT } from "../data/taxonomy";
import { loadWorkflow } from "../data/workflowEngine";
import { loadProgressForSlug } from "../data/discoveryQuestions";
import { RequirementsPanel } from "./ApprovalType";

// ── Shared constants ──────────────────────────────────────────────────────────

const SANS = "'IBM Plex Sans', sans-serif";

/**
 * Maps taxonomy module slugs → discoveryQuestions type slugs.
 * Every module renders the exact same questionnaire as its matching
 * ApprovalType page — same questions, same workflow generation, same Excel export.
 */
const MODULE_SLUG_MAP: Record<string, string> = {
  "requisitions":    "requisition",
  "purchase-orders": "purchase-order",
  "agreements":      "ica",
  "suppliers":       "sole-source",
  "contracts":       "contract",
  "ap-invoices":     "sole-source",
  "journals":        "emergency",
  "projects":        "contract",
  "hiring":          "requisition",
  "compensation":    "requisition",
  "workforce":       "requisition",
};

// ── Webinar sessions (same as ApprovalType) ───────────────────────────────────

const WEBINAR_SESSIONS = [
  { title: "Oracle SCM Approval Configuration — Foundations",    date: "June 12, 2025",  duration: "52 min", status: "Recorded" },
  { title: "Requisition Approval Workflow Deep Dive",             date: "June 26, 2025",  duration: "45 min", status: "Recorded" },
  { title: "Contract & ICA Approval Configuration",               date: "July 10, 2025",  duration: "60 min", status: "Recorded" },
  { title: "Client-Specific KDD Walkthrough: COD & SLED",        date: "July 24, 2025",  duration: "55 min", status: "Upcoming" },
  { title: "Q&A: Approval Configuration Best Practices",          date: "August 7, 2025", duration: "40 min", status: "Upcoming" },
];

// ── Deck data (same as ApprovalType) ─────────────────────────────────────────

const ALL_DECKS = [
  { id: 1,  title: "Requisition Approval Workflow",                     file: "Requisition_Approval_Workflow-1.pdf"                      },
  { id: 2,  title: "Oracle SLED Req Approval — ICA Training Framework", file: "Oracle_SLED_Req_Approval_ICA_Training_Framework-1.pdf"     },
  { id: 3,  title: "EDM.335 SWBNO — SCM Approvals KDD",                file: "EDM.335_SWBNO_Key_Design_Decision_SCM_Approvals-1.pdf"     },
  { id: 4,  title: "EDM.335 APS — SCM Approvals KDD v7",               file: "EDM.335_APS_Key_Design_Decision_SCM_Approvals_v7-1.pdf"    },
  { id: 5,  title: "EDM 320 MCPS — Workflow KDD",                      file: "EDM_320_MCPS_Workflow_KDD_SUBMITTED-1.pdf"                 },
  { id: 6,  title: "EDM 320 BCPSS — Workflow KDD V2",                  file: "EDM_320_BCPSS_Workflow_KDD_V2-1.pdf"                       },
  { id: 7,  title: "COD Contract Approvals v1",                        file: "COD_Contract_Approvals_v1-1.pdf"                           },
  { id: 8,  title: "Common Design — Approvals Overview (CD.05b)",      file: "CD.05b_Common_Design_-_Approvals_Overview-1.pdf"           },
  { id: 9,  title: "COD Contract Approval Requirements",               file: "COD_Contract_Approval_Requirements-1.pdf"                  },
  { id: 10, title: "EDM.220 — Business Process Flows — PO V2",         file: "EDM.220 - Business Process Flows - PO V2 (1).pdf"          },
];

const CUSTOMER_EXAMPLES_DECKS = [
  { id: 10, title: "EDM.220 — Business Process Flows — PO V2", file: "EDM.220 - Business Process Flows - PO V2 (1).pdf" },
];

const MONO = "'IBM Plex Mono', monospace";

// ── Completion ring (same as ApprovalType) ────────────────────────────────────

function CompletionRing({ slug, size = 40 }: { slug: string; size?: number }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const calc = () => {
      const { total, filled } = loadProgressForSlug(slug);
      setPct(total > 0 ? filled / total : 0);
    };
    calc();
    window.addEventListener("storage", calc);
    return () => window.removeEventListener("storage", calc);
  }, [slug]);
  const R = size / 2 - 4;
  const C = 2 * Math.PI * R;
  const dash = C * pct;
  const rc = pct >= 1 ? "#24a148" : "#0f62fe";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#e0e0e0" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={rc} strokeWidth="3"
          strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.4s" }} />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          fontSize={size < 36 ? 8 : 10} fontWeight="700"
          fill={pct === 0 ? "#8d8d8d" : rc} fontFamily={SANS}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
    </div>
  );
}

// ── Modals / Drawers (identical to ApprovalType) ──────────────────────────────

function MaintenanceModal({ color, onClose }: { color: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: 40, textAlign: "center", background: "#ffffff", border: "1px solid #e0e0e0", borderTop: `3px solid ${color}`, maxWidth: 400, width: "90%", fontFamily: SANS }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "#525252" }} /></button>
        <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}12`, border: `1px solid ${color}30` }}>
          <Wrench size={26} style={{ color }} strokeWidth={1.5} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#161616", margin: "0 0 8px" }}>Under Maintenance</h3>
          <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0 }}>This feature will be available once content has been provided.</p>
        </div>
        <button onClick={onClose} style={{ padding: "8px 24px", background: "#f4f4f4", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 13, fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e0e0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}>Dismiss</button>
      </div>
    </div>
  );
}

function CustomerExamplesDrawer({ color, onClose }: { color: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch" style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", width: "min(480px,95vw)", background: "#ffffff", borderLeft: `3px solid ${color}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #e0e0e0" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.08em", margin: "0 0 2px" }}>CUSTOMER EXAMPLES</p>
            <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>{CUSTOMER_EXAMPLES_DECKS.length} document{CUSTOMER_EXAMPLES_DECKS.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "#525252" }} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>DOCUMENTS</div>
          {CUSTOMER_EXAMPLES_DECKS.map((deck, i) => (
            <a key={deck.id} href={`/decks/${deck.file}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", textDecoration: "none", borderBottom: "1px solid #e0e0e0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <p style={{ flex: 1, fontSize: 13, color: "#161616", margin: 0, lineHeight: 1.4 }}>{deck.title}</p>
              <ExternalLink size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeckDrawer({ color, onClose }: { color: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch" style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", width: "min(480px,95vw)", background: "#ffffff", borderLeft: `3px solid ${color}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #e0e0e0" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.08em", margin: "0 0 2px" }}>APPROVALS OVERVIEW</p>
            <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>{ALL_DECKS.length} documents · {WEBINAR_SESSIONS.length} webinars</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "#525252" }} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>DOCUMENTS</div>
          {ALL_DECKS.map((deck, i) => (
            <a key={deck.id} href={`/decks/${deck.file}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", textDecoration: "none", borderBottom: "1px solid #e0e0e0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <p style={{ flex: 1, fontSize: 13, color: "#161616", margin: 0, lineHeight: 1.4 }}>{deck.title}</p>
              <ExternalLink size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
            </a>
          ))}
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>WEBINARS</div>
          {WEBINAR_SESSIONS.map((session, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", borderBottom: "1px solid #e0e0e0" }}>
              <Video size={14} style={{ color: session.status === "Recorded" ? color : "#8d8d8d", flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: "#161616", margin: "0 0 3px", lineHeight: 1.4 }}>{session.title}</p>
                <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>{session.date} · {session.duration}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", flexShrink: 0, marginTop: 2,
                background: session.status === "Recorded" ? "#defbe6" : "#fff8e1",
                color:      session.status === "Recorded" ? "#24a148"  : "#ba4e00",
                border:     `1px solid ${session.status === "Recorded" ? "#a7f0ba" : "#ffd9be"}`,
              }}>{session.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ModuleRow — one collapsible row per module ────────────────────────────────

function ModuleRow({
  mod,
  faColor,
  industrySlug,
  faSlug,
  defaultOpen,
}: {
  mod: { slug: string; label: string; description: string; icon: React.ElementType; color: string; activities: { slug: string; available: boolean }[] };
  faColor: string;
  industrySlug: string;
  faSlug: string;
  defaultOpen: boolean;
}) {
  const typeSlug = MODULE_SLUG_MAP[mod.slug] ?? mod.slug;
  const [open, setOpen] = useState(defaultOpen);
  const [workflowExists, setWorkflowExists] = useState(() => Boolean(loadWorkflow(typeSlug)));
  const [submittedAt, setSubmittedAt] = useState<string | null>(() => localStorage.getItem(`req_submitted_at_${typeSlug}`));

  useEffect(() => {
    const sync = () => setSubmittedAt(localStorage.getItem(`req_submitted_at_${typeSlug}`));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [mod.slug]);

  const ModIcon = mod.icon;
  const color   = mod.color;

  return (
    <div style={{ marginTop: 1 }}>
      {/* Accordion trigger — matches ApprovalType Row 2 exactly */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 16, width: "100%",
          padding: "18px 22px",
          background: open ? "#edf5ff" : "#ffffff",
          border: "1px solid #e0e0e0",
          borderLeft: open ? `3px solid ${color}` : "3px solid transparent",
          cursor: "pointer", fontFamily: SANS, textAlign: "left",
          transition: "background 0.15s, border-left-color 0.15s",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "#f4f4f4"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = open ? "#edf5ff" : "#ffffff"; }}
      >
        <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}14`, border: `1px solid ${color}30`, flexShrink: 0 }}>
          <ModIcon size={17} style={{ color }} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "#161616", margin: "0 0 3px" }}>{mod.label}</h2>
          <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>{mod.description}</p>
          {submittedAt && (
            <p style={{ fontSize: 11, color: "#24a148", margin: "3px 0 0", fontWeight: 500 }}>
              Submitted · {new Date(submittedAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <CompletionRing slug={typeSlug} size={40} />
        <ChevronRight size={15} style={{ color: "#8d8d8d", flexShrink: 0, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <RequirementsPanel
          typeSlug={MODULE_SLUG_MAP[mod.slug] ?? mod.slug}
          color={color}
          onWorkflowGenerated={() => setWorkflowExists(Boolean(loadWorkflow(MODULE_SLUG_MAP[mod.slug] ?? mod.slug)))}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FunctionalAreaHub() {
  const { industrySlug, faSlug, moduleSlug } = useParams<{ industrySlug: string; faSlug: string; moduleSlug?: string }>();
  const navigate = useNavigate();

  const [deckDrawerOpen,         setDeckDrawerOpen]         = useState(false);
  const [customerExamplesOpen,   setCustomerExamplesOpen]   = useState(false);
  const [maintenanceOpen,        setMaintenanceOpen]        = useState(false);

  const industry = getIndustry(industrySlug ?? "");
  const fa       = industry ? getFunctionalArea(industry, faSlug ?? "") : undefined;

  if (!industry || !fa) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Page not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>
    );
  }

  const FAIcon = fa.icon;
  const color  = fa.color;

  // ── 4 resource tiles (identical layout to ApprovalType ROW1_TILES) ───────────
  const ROW1_TILES = [
    {
      id: "decks",
      label: "Approvals Overview",
      desc: `${ALL_DECKS.length} reference documents and webinar recordings for ${fa.label}.`,
      icon: Layers, color: "#0f62fe",
      onClick: () => setDeckDrawerOpen(true),
      maint: false,
    },
    {
      id: "process",
      label: "Industry Approvals Process Flows",
      desc: "Step-by-step approval flow, routing logic, and threshold matrix.",
      icon: GitBranch, color: "#009d9a",
      onClick: () => navigate("/process"),
      maint: false,
    },
    {
      id: "examples",
      label: "Industry Customer Examples",
      desc: "Real-world implementation examples from similar client deployments.",
      icon: FolderOpen, color: "#525252",
      onClick: () => setCustomerExamplesOpen(true),
      maint: false,
    },
    {
      id: "demo",
      label: `Oracle ${fa.label} Approvals Demo`,
      desc: `Live demo walkthrough of Oracle ${fa.label} Approvals for industry-specific configurations.`,
      icon: Video, color: "#8a3ffc",
      onClick: () => setMaintenanceOpen(true),
      maint: true,
    },
  ];

  return (
    <div style={{ fontFamily: SANS, background: "#f4f4f4", minHeight: "100%" }}>

      {/* ── Page header ── */}
      <div style={{ padding: "24px 32px 20px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        {/* Back button → returns to modules list */}
        <button
          onClick={() => navigate(`/industry/${industrySlug}/${faSlug}`)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12, color: "#525252", background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
        >
          <ArrowLeft size={13} /> {FA_SHORT[fa.slug] ?? fa.label}
        </button>

        {/* Title block — show the selected module */}
        {(() => {
          const mod = moduleSlug ? fa.modules.find((m) => m.slug === moduleSlug) : undefined;
          const ModIcon = mod?.icon ?? FAIcon;
          const modColor = mod?.color ?? color;
          return (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: `${modColor}14`, border: `1px solid ${modColor}30`, flexShrink: 0 }}>
                <ModIcon size={21} style={{ color: modColor }} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: modColor, letterSpacing: "0.09em", marginBottom: 3 }}>
                  {industry.label.toUpperCase()} · {FA_SHORT[fa.slug]?.toUpperCase() ?? fa.label.toUpperCase()} · MODULE
                </p>
                <h1 style={{ fontSize: 21, fontWeight: 400, color: "#161616", margin: "0 0 5px" }}>{mod?.label ?? fa.label}</h1>
                <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>{mod?.description ?? fa.description}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "20px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 14 }}>RESOURCES & TOOLS</p>

        {/* Row 1 — 4 equal resource tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
          {ROW1_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <button key={tile.id} onClick={tile.onClick}
                style={{ position: "relative", display: "flex", flexDirection: "column", textAlign: "left", padding: "20px 18px", background: "#ffffff", border: "none", cursor: "pointer", opacity: tile.maint ? 0.65 : 1, transition: "background 0.15s", fontFamily: SANS }}
                onMouseEnter={(e) => { if (!tile.maint) e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: `${tile.color}12`, border: `1px solid ${tile.color}28`, marginBottom: 12, flexShrink: 0 }}>
                  <Icon size={17} style={{ color: tile.color }} strokeWidth={1.5} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 600, color: "#161616", margin: 0 }}>{tile.label}</h2>
                  {tile.maint && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", background: "#f4f4f4", color: "#8d8d8d", border: "1px solid #e0e0e0" }}>SOON</span>}
                </div>
                <p style={{ fontSize: 11, color: "#525252", lineHeight: 1.5, flex: 1, margin: 0 }}>{tile.desc}</p>
                {!tile.maint && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 11, fontWeight: 500, color: tile.color }}>
                    {tile.id === "decks" ? "View overview" : "View"} <ArrowRight size={11} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 2 — requirements questionnaire for the selected module */}
        {(() => {
          const mod = moduleSlug ? fa.modules.find((m) => m.slug === moduleSlug) : undefined;
          if (!mod) return null;
          return (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 14 }}>
                {mod.label.toUpperCase()} · REQUIREMENTS &amp; PROCESS FLOW
              </p>
              <ModuleRow
                mod={mod}
                faColor={color}
                industrySlug={industrySlug!}
                faSlug={faSlug!}
                defaultOpen={true}
              />
            </div>
          );
        })()}
      </div>

      {/* ── Overlays ── */}
      {deckDrawerOpen       && <DeckDrawer color={color} onClose={() => setDeckDrawerOpen(false)} />}
      {customerExamplesOpen && <CustomerExamplesDrawer color={color} onClose={() => setCustomerExamplesOpen(false)} />}
      {maintenanceOpen      && <MaintenanceModal color={color} onClose={() => setMaintenanceOpen(false)} />}
    </div>
  );
}
