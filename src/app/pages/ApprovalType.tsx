import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Layers, GitBranch, Video, FolderOpen, ArrowRight, ExternalLink,
  Wrench, X, ArrowLeft, ClipboardList,
  ShoppingCart, FileText, FileSignature, Building2, Search, AlertTriangle,
  CheckCircle2, AlertCircle,
  ChevronRight, RotateCcw, Download, Circle, GripVertical, Pencil, Trash2,
  RefreshCw, CheckCheck, Lock, LockOpen, Workflow, Loader2, TriangleAlert,
  Share2, Upload,
} from "lucide-react";
import { APPROVAL_TYPES } from "./Home";
import { getQuestionsForType, getVisibleQuestions, loadProgressForSlug } from "../data/discoveryQuestions";
import {
  OtherApproversPanel,
  loadApprovers,
  saveApprovers,
  type OthApprover,
} from "../components/OtherApproversPanel";
import { RosterPanel, loadRoster } from "../components/RosterPanel";
import {
  generateWorkflow, saveWorkflow, loadWorkflow, deleteWorkflow,
  type GeneratedWorkflow, type WorkflowStep, type WizAnswers,
} from "../data/workflowEngine";
import { downloadRequirementsXlsx, downloadProcessFlowXlsx } from "../data/xlsxFormatter";
import {
  loadUnifiedVersions, addUnifiedVersion, renameUnifiedVersion, deleteUnifiedVersion, attachWorkflowToVersion, toggleVersionLock,
  type UnifiedVersion,
} from "../data/versionStore";

// ─── Webinar data ─────────────────────────────────────────────────────────────

const WEBINAR_SESSIONS = [
  { title: "Oracle SCM Approval Configuration — Foundations",    date: "June 12, 2025",  duration: "52 min", status: "Recorded" },
  { title: "Requisition Approval Workflow Deep Dive",             date: "June 26, 2025",  duration: "45 min", status: "Recorded" },
  { title: "Contract & ICA Approval Configuration",               date: "July 10, 2025",  duration: "60 min", status: "Recorded" },
  { title: "Client-Specific KDD Walkthrough: COD & SLED",        date: "July 24, 2025",  duration: "55 min", status: "Upcoming" },
  { title: "Q&A: Approval Configuration Best Practices",          date: "August 7, 2025", duration: "40 min", status: "Upcoming" },
];

// ─── Deck data ────────────────────────────────────────────────────────────────

const DECK_MAP: Record<string, number[]> = {
  requisition:      [1, 2, 3, 4, 5, 6],
  "purchase-order": [8, 9],
  contract:         [7, 8, 9],
  ica:              [2, 8],
  "sole-source":    [1, 8],
  emergency:        [1, 8],
};
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

// Customer Examples deck (shown in the Customer Examples drawer)
const CUSTOMER_EXAMPLES_DECKS = [
  { id: 1, title: "Procurement – Process Flows", file: "Procurement - Process Flows.pdf" },
];

const CUSTOMER_EXAMPLES_VSDX = [
  { id: 10, title: "EDM.220 — Business Process Flows — PO V2", file: "EDM.220 - Business Process Flows - PO V2 (1).pdf" },
];

const SANS = "'IBM Plex Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  Low: "#24a148", Medium: "#f1c21b", High: "#ff832b", Critical: "#da1e28",
};

function riskBadge(level: string) {
  const c = RISK_COLOR[level] ?? "#8d8d8d";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: `${c}18`, color: c, border: `1px solid ${c}44` }}>
      {level}
    </span>
  );
}

// ─── Completion ring (reads localStorage, respects gate answers) ──────────────

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

// ─── Modals ───────────────────────────────────────────────────────────────────

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
          <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0 }}>Customer Examples will be available once content has been provided.</p>
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
            <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>{CUSTOMER_EXAMPLES_DECKS.length + CUSTOMER_EXAMPLES_VSDX.length} document{(CUSTOMER_EXAMPLES_DECKS.length + CUSTOMER_EXAMPLES_VSDX.length) !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "#525252" }} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
            DOCUMENTS
          </div>
          {CUSTOMER_EXAMPLES_DECKS.map((deck, i) => (
            <a key={deck.id} href={`/${deck.file}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", textDecoration: "none", borderBottom: "1px solid #e0e0e0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <p style={{ flex: 1, fontSize: 13, color: "#161616", margin: 0, lineHeight: 1.4 }}>{deck.title}</p>
              <ExternalLink size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
            </a>
          ))}
          {CUSTOMER_EXAMPLES_VSDX.map((vsdx, i) => (
            <a key={vsdx.id} href={`/decks/${vsdx.file}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", textDecoration: "none", borderBottom: "1px solid #e0e0e0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", flexShrink: 0, marginTop: 2 }}>{String(CUSTOMER_EXAMPLES_DECKS.length + i + 1).padStart(2, "0")}</span>
              <p style={{ flex: 1, fontSize: 13, color: "#161616", margin: 0, lineHeight: 1.4 }}>{vsdx.title}</p>
              <ExternalLink size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeckDrawer({ decks, color, onClose }: { decks: typeof ALL_DECKS; color: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch" style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", width: "min(480px,95vw)", background: "#ffffff", borderLeft: `3px solid ${color}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #e0e0e0" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.08em", margin: "0 0 2px" }}>APPROVALS OVERVIEW</p>
            <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>{decks.length} document{decks.length !== 1 ? "s" : ""} · {WEBINAR_SESSIONS.length} webinars</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "#525252" }} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {/* Documents section */}
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
            DOCUMENTS
          </div>
          {decks.map((deck, i) => (
            <a key={deck.id} href={`/decks/${deck.file}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", textDecoration: "none", borderBottom: "1px solid #e0e0e0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              <p style={{ flex: 1, fontSize: 13, color: "#161616", margin: 0, lineHeight: 1.4 }}>{deck.title}</p>
              <ExternalLink size={12} style={{ color, flexShrink: 0, marginTop: 2 }} />
            </a>
          ))}
          {/* Webinars section */}
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
            WEBINARS
          </div>
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

// ─── Unified version bar ──────────────────────────────────────────────────────

function UnifiedVersionBar({
  versions, activeId, onSelect, onRename, onDelete, onToggleLock,
}: {
  versions: UnifiedVersion[];
  activeId: string | null;
  onSelect: (v: UnifiedVersion) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  if (versions.length === 0) return null;

  const handleDelete = (v: UnifiedVersion) => {
    if (v.locked) {
      if (!window.confirm(`"${v.name}" is locked. Are you sure you want to delete it?`)) return;
      if (!window.confirm(`This action is permanent. Delete locked version "${v.name}"?`)) return;
    }
    onDelete(v.id);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 20px", borderBottom: "1px solid #e0e0e0", background: "#f4f4f4", flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.07em", marginRight: 4 }}>VERSIONS</span>
      {versions.map((v) => {
        const isActive = v.id === activeId;
        const hasWf = Boolean(v.workflow);
        const isLocked = Boolean(v.locked);
        return (
          <div key={v.id} style={{ display: "flex", alignItems: "center", border: `1px solid ${isActive ? "#0f62fe" : "#e0e0e0"}`, background: isActive ? "#edf5ff" : "#ffffff", borderRadius: 2 }}>
            {editingId === v.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => { onRename(v.id, editName || v.name); setEditingId(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") { onRename(v.id, editName || v.name); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                style={{ width: 72, padding: "4px 8px", fontSize: 12, fontFamily: SANS, border: "none", outline: "none", background: "transparent", color: "#161616" }}
              />
            ) : (
              <button
                onClick={() => onSelect(v)}
                onDoubleClick={() => { setEditingId(v.id); setEditName(v.name); }}
                title={`${v.name} · ${new Date(v.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}${hasWf ? " · has process flow" : " · requirements only"} · double-click to rename`}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 5px 5px 10px", fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? "#0f62fe" : "#525252", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, whiteSpace: "nowrap" }}
              >
                {v.name}
                {hasWf && <GitBranch size={11} style={{ color: isActive ? "#24a148" : "#8d8d8d" }} />}
              </button>
            )}
            {/* Lock toggle — once locked, cannot be unlocked */}
            <button
              onClick={(e) => { e.stopPropagation(); if (!isLocked) onToggleLock(v.id); }}
              title={isLocked ? "This version is permanently locked" : "Lock this version"}
              style={{ padding: "5px 5px", background: "none", border: "none", cursor: isLocked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", color: isLocked ? "#da1e28" : "#24a148" }}
              onMouseEnter={(e) => { if (!isLocked) e.currentTarget.style.color = "#198038"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isLocked ? "#da1e28" : "#24a148"; }}
            >
              {isLocked ? <Lock size={11} /> : <LockOpen size={11} />}
            </button>
            {/* Delete */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(v); }}
              title="Delete this version"
              style={{ padding: "5px 7px 5px 3px", background: "none", border: "none", cursor: "pointer", color: "#8d8d8d", display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#da1e28"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#8d8d8d"; }}
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
      <span style={{ fontSize: 10, color: "#8d8d8d", marginLeft: 4, fontStyle: "italic" }}>double-click to rename</span>
    </div>
  );
}

// ─── Requirements tab — receives state from RequirementsPanel ─────────────────

function RequirementsTab({
  typeSlug, color, answers, submitted, submittedAt, othApprovers,
  onAnswersChange, onOthApproversChange, onSubmit, onEdit, onDownload, onGenerate,
}: {
  typeSlug: string;
  color: string;
  answers: Record<string, string>;
  submitted: boolean;
  submittedAt: string | null;
  othApprovers: OthApprover[];
  onAnswersChange: (id: string, v: string) => void;
  onOthApproversChange: (a: OthApprover[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: () => void;
  onDownload: () => void;
  onGenerate: (answers: Record<string, string>) => void;
}) {
  const allQuestions = getQuestionsForType(typeSlug);
  const [resetPending, setResetPending] = useState(false);
  const handleChange = useCallback(onAnswersChange, [onAnswersChange]);

  type SecData = { title: string; sectionIndex: number; gate: typeof allQuestions[0] | null; body: typeof allQuestions };
  const sections: SecData[] = [];
  allQuestions.forEach((q) => {
    let sec = sections.find((s) => s.sectionIndex === q.sectionIndex);
    if (!sec) { sec = { title: q.section, sectionIndex: q.sectionIndex, gate: null, body: [] }; sections.push(sec); }
    if (q.isGate) { sec.gate = q; } else { sec.body.push(q); }
  });

  const visibleQuestions = getVisibleQuestions(typeSlug, answers);
  const filledCount = visibleQuestions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;

  const handleResetClick = () => {
    if (!resetPending) { setResetPending(true); return; }
    onAnswersChange("__RESET__", "");   // signal to parent to clear answers
    setResetPending(false);
  };
  const handleResetCancel = () => setResetPending(false);

  return (
    <form onSubmit={onSubmit} style={{ fontFamily: SANS }}>
      {/* Sub-header */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid #e0e0e0", background: "#fafafa" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: "#161616", fontWeight: 500, margin: "0 0 4px" }}>KDD Requirements Questionnaire</p>
            <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>For each approver type, confirm if it is required — answering No hides all follow-up questions for that section. Progress auto-saved.</p>
            {submitted && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <CheckCheck size={13} style={{ color: "#24a148" }} />
                <span style={{ fontSize: 11, color: "#24a148", fontWeight: 600 }}>
                  Submitted{submittedAt ? ` · ${new Date(submittedAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <CompletionRing slug={typeSlug} size={52} />
            <span style={{ fontSize: 10, color: "#525252" }}>{filledCount}/{visibleQuestions.length}</span>
          </div>
        </div>

        {/* Reset bar */}
        {!submitted && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #e0e0e0" }}>
            {resetPending ? (
              <>
                <span style={{ fontSize: 12, color: "#da1e28", fontWeight: 500 }}>This will erase all responses. Are you sure?</span>
                <button type="button" onClick={handleResetClick}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#da1e28", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#b01520"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#da1e28"; }}>
                  <RotateCcw size={11} /> Yes, reset all
                </button>
                <button type="button" onClick={handleResetCancel}
                  style={{ padding: "5px 14px", background: "transparent", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={handleResetClick}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "transparent", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <RotateCcw size={11} /> Reset all responses
              </button>
            )}
          </div>
        )}
      </div>

      {submitted ? (
        /* Submitted / locked view */
        <div style={{ padding: "24px 28px" }}>
          <div style={{ padding: "16px 20px", background: "#defbe6", border: "1px solid #a7f0ba", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <CheckCheck size={16} style={{ color: "#24a148", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#198038", margin: "0 0 2px" }}>Requirements submitted</p>
              <p style={{ fontSize: 12, color: "#198038", margin: 0 }}>
                {filledCount} of {visibleQuestions.length} questions answered.
                {submittedAt && (
                  <span style={{ display: "block", fontSize: 11, color: "#24a148", marginTop: 2, fontWeight: 500 }}>
                    Submitted {new Date(submittedAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => onGenerate(answers)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "#24a148", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#198038"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#24a148"; }}>
                <GitBranch size={14} /> Generate Process Flow
              </button>
              <button type="button" onClick={onEdit}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                <Pencil size={11} /> Edit
              </button>
              <button type="button" onClick={onDownload}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#ffffff", color: "#0f62fe", border: "1px solid #0f62fe", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#d0e2ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                <Download size={11} /> .xlsx
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.map((sec) => {
              const gateAns = sec.gate ? (answers[sec.gate.id] ?? "").trim() : "";
              const active = !sec.gate || gateAns !== "No";
              const visibleInSec = [...(sec.gate ? [sec.gate] : []), ...(active ? sec.body : [])];
              const answered = visibleInSec.filter((q) => (answers[q.id] ?? "").trim() !== "");
              if (!answered.length) return null;
              return (
                <div key={sec.title} style={{ border: "1px solid #e0e0e0", padding: "12px 16px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: "0.06em", margin: "0 0 8px" }}>{sec.title}</p>
                  {answered.map((q) => (
                    <div key={q.id} style={{ display: "flex", gap: 12, padding: "4px 0", borderBottom: "1px solid #f4f4f4" }}>
                      <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", minWidth: 58, flexShrink: 0 }}>{q.id}</span>
                      <span style={{ fontSize: 12, color: "#161616", flex: 1, lineHeight: 1.5 }}>{answers[q.id]}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Edit view */
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {sections.map((sec) => {
            const gateAns = sec.gate ? (answers[sec.gate.id] ?? "").trim() : "";
            const sectionActive = !sec.gate || gateAns !== "No";
            const visibleInSec = [...(sec.gate ? [sec.gate] : []), ...(sectionActive ? sec.body : [])];
            return (
              <div key={sec.title}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", marginBottom: 12, borderBottom: `2px solid ${color}22` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em" }}>{sec.title.toUpperCase()}</span>
                  {!sectionActive && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 8px", background: "#e0e0e0", color: "#525252" }}>SKIPPED</span>}
                  <span style={{ fontSize: 10, color: "#8d8d8d", marginLeft: "auto" }}>
                    {visibleInSec.filter((q) => (answers[q.id] ?? "").trim() !== "").length}/{visibleInSec.length} answered
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {visibleInSec.map((q, idx) => {
                    const val = answers[q.id] ?? "";
                    const answered = val.trim() !== "";
                    return (
                      <div key={q.id}>
                        <div style={{ border: "1px solid #e0e0e0", borderLeft: `3px solid ${q.isGate ? color : answered ? color : "#e0e0e0"}`, padding: "14px 18px", background: q.isGate ? "#fafafa" : "#ffffff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d" }}>{String(idx + 1).padStart(2, "0")}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.7, letterSpacing: "0.06em" }}>{q.id}</span>
                            {q.isGate && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", background: `${color}18`, color, letterSpacing: "0.06em" }}>REQUIRED</span>}
                            <div style={{ marginLeft: "auto" }}>
                              {answered ? <CheckCircle2 size={13} style={{ color }} /> : <Circle size={13} style={{ color: "#c6c6c6" }} />}
                            </div>
                          </div>
                          <label style={{ display: "block", fontSize: 13, fontWeight: q.isGate ? 600 : 500, color: "#161616", lineHeight: 1.5, marginBottom: q.hint ? 4 : 8 }}>{q.question}</label>
                          {q.hint && <p style={{ fontSize: 11, color: "#8d8d8d", margin: "0 0 8px", lineHeight: 1.4, fontStyle: "italic" }}>{q.hint}</p>}
                          {q.inputType === "yesno" ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              {["Yes", "No"].map((opt) => (
                                <button key={opt} type="button" onClick={() => handleChange(q.id, opt)}
                                  style={{ padding: "6px 18px", fontSize: 12, fontFamily: SANS, cursor: "pointer", border: `1px solid ${val === opt ? color : "#e0e0e0"}`, background: val === opt ? color : "#ffffff", color: val === opt ? "#ffffff" : "#161616" }}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : q.inputType === "select" && q.options ? (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {q.options.map((opt) => (
                                <button key={opt} type="button" onClick={() => handleChange(q.id, opt)}
                                  style={{ padding: "6px 16px", fontSize: 12, fontFamily: SANS, cursor: "pointer", border: `1px solid ${val === opt ? color : "#e0e0e0"}`, background: val === opt ? color : "#ffffff", color: val === opt ? "#ffffff" : "#161616" }}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : q.inputType === "roster" ? (
                            <RosterPanel
                              slug={typeSlug}
                              rosterKey={q.rosterKey!}
                              columns={q.rosterColumns!}
                              color={color}
                              label={q.rosterKey === "gatekeeper_roster" ? "Gatekeeper Roster" : "CC Manager Roster"}
                            />
                          ) : (
                            <textarea value={val} onChange={(e) => handleChange(q.id, e.target.value)} rows={q.inputType === "textarea" ? 3 : 2}
                              style={{ width: "100%", padding: "8px 12px", fontSize: 12, color: "#161616", background: "#fafafa", border: "1px solid #e0e0e0", borderBottom: `2px solid ${answered ? color : "#8d8d8d"}`, outline: "none", resize: "vertical", fontFamily: SANS, lineHeight: 1.6, boxSizing: "border-box" }}
                              onFocus={(e) => { e.currentTarget.style.borderBottomColor = color; e.currentTarget.style.background = "#fff"; }}
                              onBlur={(e) => { e.currentTarget.style.borderBottomColor = answered ? color : "#8d8d8d"; e.currentTarget.style.background = "#fafafa"; }}
                              placeholder="Enter your response…" />
                          )}
                        </div>
                        {q.id === "GATE-OTH" && val === "Yes" && (
                          <div style={{ marginTop: 12 }}>
                            <OtherApproversPanel color={color} approvers={othApprovers} onApproversChange={onOthApproversChange} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!sectionActive && sec.body.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f4f4f4", border: "1px solid #e0e0e0", borderLeft: "3px solid #e0e0e0" }}>
                      <span style={{ fontSize: 11, color: "#8d8d8d" }}>
                        {sec.body.length} question{sec.body.length !== 1 ? "s" : ""} hidden — change your answer to Yes to reveal them.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8, borderTop: "1px solid #e0e0e0" }}>
            <button type="submit"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#0f62fe", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
              Submit Requirements <ArrowRight size={14} />
            </button>
            <button type="button" onClick={onDownload}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#ffffff", color: "#0f62fe", border: "1px solid #0f62fe", cursor: "pointer", fontSize: 13, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d0e2ff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <Download size={13} /> .xlsx
            </button>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#8d8d8d" }}>{filledCount}/{visibleQuestions.length} answered</span>
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Workflow Report view ─────────────────────────────────────────────────────

function WorkflowReport({
  wf, color, onDelete, onRegenerate,
}: { wf: GeneratedWorkflow; color: string; onDelete: () => void; onRegenerate: () => void }) {
  const [editMode, setEditMode]   = useState(false);
  const [steps, setSteps]         = useState<WorkflowStep[]>(wf.steps);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVals, setEditVals]   = useState<Partial<WorkflowStep>>({});
  const dragId = useRef<string | null>(null);

  // Save edits back to localStorage on every change
  useEffect(() => {
    if (!editMode) return;
    const updated: GeneratedWorkflow = { ...wf, steps };
    saveWorkflow(updated);
  }, [steps, editMode, wf]);

  // ── Drag-and-drop (HTML5) ──
  const onDragStart = (id: string) => { dragId.current = id; };
  const onDragOver  = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId.current || dragId.current === targetId) return;
    setSteps((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((s) => s.id === dragId.current);
      const toIdx   = arr.findIndex((s) => s.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };
  const onDragEnd = () => { dragId.current = null; };

  // ── Inline step edit ──
  const startEdit = (s: WorkflowStep) => { setEditingId(s.id); setEditVals({ title: s.title, actor: s.actor, role: s.role, sla: s.sla, action: s.action, description: s.description, conditions: s.conditions }); };
  const saveEdit  = () => {
    setSteps((prev) => prev.map((s) => s.id === editingId ? { ...s, ...editVals } : s));
    setEditingId(null);
  };
  const deleteStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));

  // ── Excel download ──
  const handleDownload = () => {
    downloadProcessFlowXlsx(
      wf,
      steps,
      {
        gatekeeper: loadRoster(wf.slug, "gatekeeper_roster"),
        ccManager:  loadRoster(wf.slug, "cc_manager_roster"),
      },
    );
  };

  const catColors: Record<string, string> = { initiation: "#0f62fe", validation: "#8a3ffc", approval: "#009d9a", legal: "#ba4e00", executive: "#da1e28", system: "#8d8d8d", completion: "#24a148" };

  return (
    <div style={{ fontFamily: SANS }}>
      {/* Report header */}
      <div style={{ padding: "16px 28px", borderBottom: "1px solid #e0e0e0", background: "#fafafa", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#161616", margin: 0 }}>Generated Process Flow</h2>
            {riskBadge(wf.riskLevel)}
          </div>
          <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>
            {steps.length} steps · {wf.totalApprovers} approvers · SLA: <strong style={{ color: "#161616" }}>{wf.estimatedSLA}</strong> · Generated {new Date(wf.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {editMode ? (
            <button onClick={() => { setEditMode(false); setEditingId(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#24a148", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#198038"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#24a148"; }}>
              <CheckCheck size={12} /> Done Editing
            </button>
          ) : (
            <button onClick={() => setEditMode(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <Pencil size={12} /> Edit
            </button>
          )}
          <button onClick={handleDownload}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#0f62fe", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
            <Download size={12} /> .xlsx
          </button>
          <button onClick={onRegenerate}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#ffffff", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
            <RefreshCw size={12} /> Regenerate
          </button>
          <button onClick={onDelete}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#ffffff", color: "#da1e28", border: "1px solid #da1e28", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {editMode && (
        <div style={{ padding: "8px 28px", background: "#fdf6dd", borderBottom: "1px solid #e8d44d", display: "flex", alignItems: "center", gap: 8 }}>
          <GripVertical size={13} style={{ color: "#8d8d8d" }} />
          <span style={{ fontSize: 12, color: "#525252" }}>Drag rows to reorder steps · Click step title to edit actor, SLA, action, and description · Click <Trash2 size={11} style={{ display: "inline", verticalAlign: "middle" }} /> to remove a step</span>
        </div>
      )}

      {/* Summary notes */}
      {wf.summaryNotes.length > 0 && (
        <div style={{ margin: "16px 28px 0", padding: "12px 16px", background: "#fdf6dd", border: "1px solid #e8d44d", display: "flex", gap: 10 }}>
          <AlertCircle size={14} style={{ color: "#f1c21b", flexShrink: 0, marginTop: 2 }} />
          <div>
            {wf.summaryNotes.map((n, i) => <p key={i} style={{ fontSize: 12, color: "#161616", margin: i < wf.summaryNotes.length - 1 ? "0 0 4px" : 0, lineHeight: 1.5 }}>{n}</p>)}
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ padding: "16px 28px 28px", display: "flex", flexDirection: "column", gap: 2 }}>
        {steps.map((s) => {
          const cc = catColors[s.category] ?? "#8d8d8d";
          const isEditing = editingId === s.id;

          return (
            <div key={s.id}
              draggable={editMode}
              onDragStart={() => editMode && onDragStart(s.id)}
              onDragOver={(e) => editMode && onDragOver(e, s.id)}
              onDragEnd={onDragEnd}
              style={{ display: "flex", alignItems: "flex-start", gap: 0, background: "#ffffff", border: "1px solid #e0e0e0", borderLeft: `3px solid ${cc}`, cursor: editMode ? "grab" : "default", transition: "box-shadow 0.1s" }}
              onMouseEnter={(e) => { if (editMode) (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              {/* Drag handle */}
              {editMode && (
                <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0", flexShrink: 0, borderRight: "1px solid #e0e0e0", color: "#c6c6c6" }}>
                  <GripVertical size={14} />
                </div>
              )}
              {/* Step number */}
              <div style={{ width: 36, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: "#8d8d8d" }}>{String(s.order).padStart(2, "0")}</span>
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: "12px 16px 12px 0", minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {([["title", "Step Title"], ["actor", "Actor / Approver"], ["role", "Role"], ["sla", "SLA"]] as [keyof WorkflowStep, string][]).map(([field, label]) => (
                        <div key={field}>
                          <p style={{ fontSize: 10, color: "#8d8d8d", margin: "0 0 3px", fontWeight: 600, letterSpacing: "0.06em" }}>{label.toUpperCase()}</p>
                          <input value={(editVals[field] as string) ?? ""} onChange={(e) => setEditVals((v) => ({ ...v, [field]: e.target.value }))}
                            style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #e0e0e0", borderBottom: "2px solid #0f62fe", outline: "none", fontFamily: SANS, boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>
                    {([["action", "Action"], ["conditions", "Conditions"], ["description", "Description"]] as [keyof WorkflowStep, string][]).map(([field, label]) => (
                      <div key={field}>
                        <p style={{ fontSize: 10, color: "#8d8d8d", margin: "0 0 3px", fontWeight: 600, letterSpacing: "0.06em" }}>{label.toUpperCase()}</p>
                        <textarea value={(editVals[field] as string) ?? ""} onChange={(e) => setEditVals((v) => ({ ...v, [field]: e.target.value }))} rows={2}
                          style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: "1px solid #e0e0e0", borderBottom: "2px solid #0f62fe", outline: "none", resize: "vertical", fontFamily: SANS, boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={saveEdit} style={{ padding: "6px 14px", background: "#0f62fe", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: "6px 14px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>{s.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", background: `${cc}14`, color: cc, border: `1px solid ${cc}30`, letterSpacing: "0.05em" }}>{s.category.toUpperCase()}</span>
                      {!s.required && <span style={{ fontSize: 9, padding: "1px 6px", background: "#f4f4f4", color: "#8d8d8d", border: "1px solid #e0e0e0" }}>CONDITIONAL</span>}
                    </div>
                    <p style={{ fontSize: 12, color: "#525252", margin: "0 0 6px" }}><strong style={{ color: "#161616" }}>{s.actor}</strong> · {s.role} · SLA: {s.sla}</p>
                    <p style={{ fontSize: 12, color: "#525252", margin: "0 0 4px", lineHeight: 1.5 }}><em style={{ color: "#8d8d8d", fontStyle: "normal" }}>Action:</em> {s.action}</p>
                    <p style={{ fontSize: 12, color: "#525252", margin: 0, lineHeight: 1.5 }}>{s.description}</p>
                    {s.conditions && s.conditions !== "Required for all transactions." && (
                      <p style={{ fontSize: 11, color: "#8d8d8d", margin: "4px 0 0", lineHeight: 1.4, fontStyle: "italic" }}>Conditions: {s.conditions}</p>
                    )}
                  </>
                )}
              </div>
              {/* Edit/delete actions */}
              {editMode && !isEditing && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 10px", flexShrink: 0 }}>
                  <button onClick={() => startEdit(s)} title="Edit step"
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid #e0e0e0", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                    <Pencil size={11} style={{ color: "#525252" }} />
                  </button>
                  <button onClick={() => { if (window.confirm("Remove this step?")) deleteStep(s.id); }} title="Delete step"
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid #da1e28", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                    <Trash2 size={11} style={{ color: "#da1e28" }} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── Blueworks Live tab ───────────────────────────────────────────────────────

const BWL_URL = import.meta.env.VITE_BWL_URL as string | undefined;

// Category → colour mapping for swimlane cells
const STEP_CATEGORY_COLOR: Record<string, string> = {
  initiation:  "#e8f1ff",
  validation:  "#fff8e6",
  approval:    "#f0fff4",
  legal:       "#fdf4ff",
  executive:   "#fff1f1",
  system:      "#e8f1ff",
  completion:  "#f4f4f4",
};
const STEP_CATEGORY_STROKE: Record<string, string> = {
  initiation:  "#0062ff",
  validation:  "#f1a100",
  approval:    "#24a148",
  legal:       "#7c5cd8",
  executive:   "#da1e28",
  system:      "#0062ff",
  completion:  "#8d8d8d",
};

/**
 * Builds the swimlane step list from a GeneratedWorkflow.
 * Each WorkflowStep becomes one swimlane node; the "actor" field
 * is used as the lane label.
 */
function buildStepsFromWorkflow(wf: GeneratedWorkflow): Array<{
  label: string; sublabel: string; sla: string;
  actor: string; category: string;
}> {
  return wf.steps.map((s) => ({
    label:    s.title,
    sublabel: s.role,
    sla:      s.sla,
    actor:    s.actor,
    category: s.category,
  }));
}

/**
 * Derives the swimlane participants from questionnaire answers (fallback when no wf).
 */
function buildSwimlaneLanes(typeSlug: string, answers: Record<string, string>): { title: string; lanes: string[] } {
  const title = `${typeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Approval Process`;
  const lanes: string[] = ["Requester"];
  if (answers["approver_level"] !== "none")                                                    lanes.push("Supervisor / Manager");
  if (answers["value_range"] === "50k-250k" || answers["value_range"] === "over-250k")         lanes.push("Finance Controller");
  if (answers["needs_legal"] === "yes")                                                         lanes.push("Legal Counsel");
  if (answers["approval_type"] === "contract")                                                  lanes.push("Procurement Director");
  if (answers["value_range"] === "over-250k")                                                   lanes.push("CPO / Procurement Director");
  lanes.push("System (Oracle Fusion)");
  return { title, lanes };
}

/**
 * Generates a BPMN 2.0 XML string from workflow steps.
 * Each step becomes a UserTask (or ServiceTask for "system" category) in its own lane.
 */
function generateBpmn(typeSlug: string, wf: GeneratedWorkflow | null, answers: Record<string, string>): string {
  const title = wf ? wf.label : `${typeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Approval Process`;
  const pid   = `Process_${typeSlug.replace(/[^a-zA-Z0-9]/g, "_")}`;

  // Build the node list: [Start, ...steps, End]
  const steps = wf ? buildStepsFromWorkflow(wf) : buildSwimlaneLanes(typeSlug, answers).lanes.map((lane, i) => ({
    label:    i === 0 ? "Submit Requisition" : lane.startsWith("System") ? "Record in System" : `Approve`,
    sublabel: lane,
    sla:      "",
    actor:    lane,
    category: lane.startsWith("System") ? "system" : i === 0 ? "initiation" : "approval",
  }));

  const startId = "StartEvent_1";
  const endId   = "EndEvent_1";
  const taskIds = steps.map((_, i) => `Task_${i}`);
  const allNodes = [startId, ...taskIds, endId];

  const colW  = 800;
  const laneH = 110;
  const totalH = laneH * steps.length;

  // Unique lane names (actors) for the laneSet
  const laneXml = steps.map((s, i) => {
    const hasStart = i === 0;
    const hasEnd   = i === steps.length - 1;
    return `    <lane id="Lane_${i}" name="${s.actor.replace(/"/g, "&quot;")}">
      ${hasStart ? `<flowNodeRef>${startId}</flowNodeRef>` : ""}
      <flowNodeRef>${taskIds[i]}</flowNodeRef>
      ${hasEnd ? `<flowNodeRef>${endId}</flowNodeRef>` : ""}
    </lane>`;
  }).join("\n");

  const seqFlows = allNodes.slice(0, -1).map((src, i) =>
    `  <sequenceFlow id="Flow_${i}" sourceRef="${src}" targetRef="${allNodes[i + 1]}" />`
  ).join("\n");

  const taskSpacingX = colW / (steps.length + 1);
  const diShapes = [
    `      <bpmndi:BPMNShape id="Shape_${startId}" bpmnElement="${startId}"><dc:Bounds x="80" y="${laneH * 0 + 37}" width="36" height="36" /></bpmndi:BPMNShape>`,
    ...steps.map((s, i) => {
      const x = 80 + (i + 1) * taskSpacingX;
      return `      <bpmndi:BPMNShape id="Shape_Task_${i}" bpmnElement="Task_${i}"><dc:Bounds x="${Math.round(x)}" y="${laneH * i + 25}" width="140" height="60" /></bpmndi:BPMNShape>`;
    }),
    `      <bpmndi:BPMNShape id="Shape_${endId}" bpmnElement="${endId}"><dc:Bounds x="${colW - 60}" y="${laneH * (steps.length - 1) + 37}" width="36" height="36" /></bpmndi:BPMNShape>`,
  ].join("\n");

  const diEdges = allNodes.slice(0, -1).map((_, i) =>
    `      <bpmndi:BPMNEdge id="Edge_Flow_${i}" bpmnElement="Flow_${i}" />`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             targetNamespace="http://ibm.com/approvals"
             id="Definitions_1">
  <collaboration id="Collab_1">
    <participant id="Participant_1" name="${title}" processRef="${pid}" />
  </collaboration>
  <process id="${pid}" name="${title}" isExecutable="false">
    <laneSet id="LaneSet_1">
${laneXml}
    </laneSet>
    <startEvent id="${startId}" name="Start" />
${steps.map((s, i) =>
  s.category === "system"
    ? `    <serviceTask id="Task_${i}" name="${s.label.replace(/"/g, "&quot;")}" />`
    : `    <userTask id="Task_${i}" name="${s.label.replace(/"/g, "&quot;")}" />`
).join("\n")}
    <endEvent id="${endId}" name="End" />
${seqFlows}
  </process>
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collab_1">
      <bpmndi:BPMNShape id="Shape_Participant_1" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="40" y="0" width="${colW}" height="${totalH}" />
      </bpmndi:BPMNShape>
${diShapes}
${diEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;
}

/**
 * Renders a professional BPMN-style horizontal swimlane SVG from workflow steps.
 *
 * Layout (left → right):
 *   [Pool strip 28px] [Lane label 200px] [Flow col 72px] [Task card 280px] [SLA col 180px] [right margin 24px]
 *
 * Each step gets its own horizontal lane row of fixed height 140px — tall enough
 * that no text ever overlaps across rows. All text positions are computed from
 * explicit pixel offsets relative to the lane top, not the lane centre, so
 * overflow is impossible.
 */
function renderSwimlaneSvg(typeSlug: string, wf: GeneratedWorkflow | null, answers: Record<string, string>): string {
  // ── Helpers ────────────────────────────────────────────────────────────────
  const esc   = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const trunc = (s: string, n: number) => s.length > n ? s.substring(0, n - 1) + "…" : s;

  /** Word-wrap a string into lines no longer than maxChars. */
  function wrap(text: string, maxChars: number, maxLines = 99): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (candidate.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, maxLines);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  const diagramTitle = wf ? wf.label : `${typeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Approval Process`;
  const generatedAt  = wf ? new Date(wf.generatedAt).toLocaleString() : new Date().toLocaleString();
  const riskLevel    = wf?.riskLevel ?? "";
  const slaTotal     = wf?.estimatedSLA ?? "";

  const steps = wf
    ? buildStepsFromWorkflow(wf)
    : buildSwimlaneLanes(typeSlug, answers).lanes.map((lane, i) => ({
        label:    i === 0 ? "Submit Requisition" : lane.startsWith("System") ? "Record in System" : "Approve",
        sublabel: lane,
        sla:      "",
        actor:    lane,
        category: (lane.startsWith("System") ? "system" : i === 0 ? "initiation" : "approval") as string,
      }));

  const n = steps.length;

  // ── Colour palette ─────────────────────────────────────────────────────────
  const C = {
    laneBgEven: "#ffffff",
    laneBgOdd:  "#f8f9fb",
    laneBorder: "#dde1e7",
    labelBg:    "#0f62fe",  // IBM Blue 60
    poolBg:     "#0043ce",  // IBM Blue 70
    titleBg:    "#001d6c",  // IBM Blue 90
    spineCol:   "#4d5358",
    textDark:   "#161616",
    textMid:    "#525252",
    textFaint:  "#8d8d8d",
  };

  const RISK_COLOR: Record<string, string> = {
    Low: "#198038", Medium: "#d4910b", High: "#da1e28", Critical: "#a2191f",
  };

  const CAT: Record<string, { fill: string; stroke: string }> = {
    initiation: { fill: "#edf5ff", stroke: "#0f62fe" },
    validation: { fill: "#fdf6dd", stroke: "#d4910b" },
    approval:   { fill: "#defbe6", stroke: "#198038" },
    legal:      { fill: "#f6f2ff", stroke: "#6929c4" },
    executive:  { fill: "#fff1f1", stroke: "#da1e28" },
    system:     { fill: "#e5f6ff", stroke: "#0072c3" },
    completion: { fill: "#f2f4f8", stroke: "#4d5358" },
  };

  const LEGEND_LABELS: Record<string, string> = {
    initiation: "Initiation", validation: "Validation", approval: "Approval",
    legal: "Legal Review", executive: "Executive", system: "System", completion: "Completion",
  };

  // ── Fixed dimensions ───────────────────────────────────────────────────────
  const POOL_W    =  28;   // left rotated-text strip
  const LABEL_W   = 210;   // actor name column
  const FLOW_W    =  80;   // flow spine column (start/end events live here)
  const CARD_W    = 290;   // task card width
  const SLA_W     = 170;   // SLA annotation column
  const R_MARGIN  =  20;   // right padding
  const TITLE_H   =  60;   // top title bar height
  const LANE_H    = 160;   // each lane — CARD_H=110 + 25px pad top + 25px pad bottom
  const LEGEND_H  =  40;   // legend strip
  const FOOTER_H  =  56;   // footer summary bar

  const SVG_W = POOL_W + LABEL_W + FLOW_W + CARD_W + SLA_W + R_MARGIN;
  const SVG_H = TITLE_H + LANE_H * n + LEGEND_H + FOOTER_H;

  // Key x coordinates
  const SPINE_X  = POOL_W + LABEL_W + FLOW_W / 2;   // centre of flow column
  const CARD_X   = POOL_W + LABEL_W + FLOW_W + 4;   // task card left edge
  const SLA_X    = CARD_X + CARD_W + 12;             // SLA box left edge

  // Event radii
  const START_R  = 14;
  const END_R    = 14;

  // Lane top and vertical centre helpers
  const laneTop  = (i: number) => TITLE_H + i * LANE_H;
  const laneMid  = (i: number) => laneTop(i) + LANE_H / 2;

  // ── Task card renderer ─────────────────────────────────────────────────────
  //
  // Card layout — two columns inside the card:
  //
  //  ┌──────────────────────────────────────────────┐
  //  │▌  [badge col 34px]  [text col — rest]        │
  //  │▌  ┌────┐  Title line 1 (font 12 bold)        │
  //  │▌  │ N  │  Title line 2 (font 12 bold)        │
  //  │▌  └────┘  Role         (font 10)             │
  //  │▌          ⏱ SLA chip   (font 9)              │
  //  └──────────────────────────────────────────────┘
  //
  // All baselines are absolute offsets from cardY (the card's own top edge).
  // cardY = laneMid(i) - CARD_H/2, so the card is always vertically centred
  // within its 160px lane row. CARD_H = 110px ensures at least 25px padding
  // above and below the card inside the lane.
  //
  // Strict vertical rhythm (no cascade — every row is an absolute offset):
  //   PAD_TOP   = 14px   (inner top padding)
  //   title1    = PAD_TOP + 12  = 26   (baseline; font-size 12 → cap ≈ 9px)
  //   title2    = title1 + 16   = 42   (16px line-height)
  //   role      = (has 2 title lines ? title2 : title1) + 18 = 60 or 44
  //   slaChip   = role + 16            (top of chip rect)
  //   slaText   = slaChip + 10         (baseline inside chip)
  //   (actorY removed — actor info already in the lane label column)
  //
  // Badge circle: cx = CARD_X + ACCENT + 17, cy = cardY + 26 (aligned to title1)

  const CARD_H   = 110;  // card height; LANE_H=160 → 25px pad top+bottom
  const ACCENT   =   5;  // left colour-bar width
  const BADGE_R  =  12;  // step-number circle radius
  const BADGE_CX = CARD_X + ACCENT + 17;         // badge centre-x
  const TEXT_X   = CARD_X + ACCENT + BADGE_R * 2 + 12; // text left edge (after badge + gap)
  const TEXT_W   = CARD_W - ACCENT - BADGE_R * 2 - 18;  // max text width (chars * ~7px)

  function taskCard(s: typeof steps[0], idx: number): string {
    const theme = CAT[s.category] ?? CAT.approval;
    const mid   = laneMid(idx);
    const cardY = mid - CARD_H / 2;          // card top — always centred in lane

    const BADGE_CY = cardY + 26;             // badge centre-y = title1 baseline - 0

    // Title: wrap to fit TEXT_W (≈ 28 chars at font-size 12, ~7.2px/char)
    const titleMaxChars = Math.floor(TEXT_W / 7.2);
    const titleLines    = wrap(s.label, titleMaxChars, 2);

    // Absolute baselines (from cardY)
    const T1 = 26;                                    // title line 1
    const T2 = 42;                                    // title line 2 (only if 2 lines)
    const RL = titleLines.length > 1 ? 60 : 46;      // role line
    const SC = RL + 15;                               // SLA chip top
    const ST = SC + 10;                               // SLA chip text baseline

    const roleText = trunc(s.sublabel, Math.floor(TEXT_W / 6));
    const slaText  = s.sla ? trunc(s.sla, Math.floor(TEXT_W / 6)) : "";

    return `
  <!-- ══ Step ${idx + 1}: ${esc(trunc(s.label, 32))} ══ -->
  <!-- Drop shadow -->
  <rect x="${CARD_X + 2}" y="${cardY + 3}" width="${CARD_W}" height="${CARD_H}" rx="6" fill="#00000014" />
  <!-- Card body -->
  <rect x="${CARD_X}" y="${cardY}" width="${CARD_W}" height="${CARD_H}" rx="6"
        fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="1.5" />
  <!-- Left accent bar (solid, no radius trickery) -->
  <rect x="${CARD_X}" y="${cardY}" width="${ACCENT}" height="${CARD_H}" rx="0" fill="${theme.stroke}" />
  <rect x="${CARD_X}" y="${cardY}" width="${ACCENT}" height="6" rx="3" fill="${theme.stroke}" />
  <rect x="${CARD_X}" y="${cardY + CARD_H - 6}" width="${ACCENT}" height="6" rx="3" fill="${theme.stroke}" />
  <!-- Step badge -->
  <circle cx="${BADGE_CX}" cy="${BADGE_CY}" r="${BADGE_R}" fill="${theme.stroke}" />
  <text x="${BADGE_CX}" y="${BADGE_CY + 4}" text-anchor="middle"
        font-size="10" font-weight="800" fill="#ffffff">${idx + 1}</text>
  <!-- Title line 1 -->
  <text x="${TEXT_X}" y="${cardY + T1}"
        font-size="12" font-weight="700" fill="${C.textDark}">${esc(titleLines[0] ?? "")}</text>
  ${titleLines[1] ? `<!-- Title line 2 -->
  <text x="${TEXT_X}" y="${cardY + T2}"
        font-size="12" font-weight="700" fill="${C.textDark}">${esc(titleLines[1])}</text>` : ""}
  <!-- Role -->
  <text x="${TEXT_X}" y="${cardY + RL}"
        font-size="10" fill="${C.textMid}">${esc(roleText)}</text>
  ${slaText ? `<!-- SLA chip -->
  <rect x="${TEXT_X}" y="${cardY + SC}" width="${Math.min(slaText.length * 5.6 + 22, CARD_W - ACCENT - BADGE_R * 2 - 18)}" height="14" rx="7"
        fill="${theme.stroke}" opacity="0.15" />
  <text x="${TEXT_X + 8}" y="${cardY + ST}"
        font-size="8.5" font-weight="600" fill="${theme.stroke}">⏱ ${esc(slaText)}</text>` : ""}`;
  }

  // ── SLA annotation box renderer ────────────────────────────────────────────
  function slaBox(s: typeof steps[0], idx: number): string {
    if (!s.sla) return "";
    const theme   = CAT[s.category] ?? CAT.approval;
    const mid     = laneMid(idx);
    const boxH    = 44;
    const boxY    = mid - boxH / 2;
    const slaText = trunc(s.sla, 28);
    return `
  <!-- SLA annotation box: step ${idx + 1} -->
  <line x1="${CARD_X + CARD_W}" y1="${mid}" x2="${SLA_X}" y2="${mid}"
        stroke="${C.laneBorder}" stroke-width="1" stroke-dasharray="4 3" />
  <rect x="${SLA_X}" y="${boxY}" width="${SLA_W - 12}" height="${boxH}" rx="4"
        fill="#ffffff" stroke="${C.laneBorder}" stroke-width="1" stroke-dasharray="4 3" />
  <text x="${SLA_X + 8}" y="${boxY + 14}" font-size="8" font-weight="700"
        fill="${theme.stroke}" letter-spacing="0.04em">SLA</text>
  <text x="${SLA_X + 8}" y="${boxY + 28}" font-size="9" fill="${C.textMid}">${esc(slaText)}</text>`;
  }

  // ── Flow elements (spine, events, arrows) ──────────────────────────────────
  function flowElements(): string {
    const parts: string[] = [];

    const firstMid = laneMid(0);
    const lastMid  = laneMid(n - 1);

    // Vertical spine — drawn first so events paint over it
    if (n > 1) {
      parts.push(
        `<line x1="${SPINE_X}" y1="${firstMid + START_R}" x2="${SPINE_X}" y2="${lastMid - END_R}"` +
        ` stroke="${C.spineCol}" stroke-width="2" />`
      );
    }

    // Horizontal arrows from spine to each card
    steps.forEach((_, i) => {
      const mid = laneMid(i);
      parts.push(
        `<line x1="${SPINE_X + (i === 0 ? START_R : 6)}" y1="${mid}" x2="${CARD_X - 2}" y2="${mid}"` +
        ` stroke="${C.spineCol}" stroke-width="1.5" marker-end="url(#bwlArrow)" />`
      );
      // Small dot on spine for intermediate lanes
      if (i > 0 && i < n - 1) {
        parts.push(`<circle cx="${SPINE_X}" cy="${mid}" r="4" fill="${C.spineCol}" />`);
      }
    });

    // Start event — centred in row 0, no label inside the lane content area
    parts.push(`
  <!-- BPMN Start event -->
  <circle cx="${SPINE_X}" cy="${firstMid}" r="${START_R}" fill="#198038" />
  <circle cx="${SPINE_X}" cy="${firstMid}" r="${START_R - 4}" fill="none" stroke="#ffffff" stroke-width="1.5" />
  <text x="${SPINE_X}" y="${firstMid + 4}" text-anchor="middle"
        font-size="8" font-weight="900" fill="#ffffff">▶</text>`);

    // End event — centred in last row
    parts.push(`
  <!-- BPMN End event -->
  <circle cx="${SPINE_X}" cy="${lastMid}" r="${END_R}" fill="#ffffff" stroke="#da1e28" stroke-width="3.5" />
  <circle cx="${SPINE_X}" cy="${lastMid}" r="${END_R - 6}" fill="#da1e28" />`);

    // Labels for start/end — placed OUTSIDE the lane rows, in the padding above/below
    // Start label: just below the title bar, above lane content
    parts.push(
      `<text x="${SPINE_X}" y="${TITLE_H - 6}" text-anchor="middle"` +
      ` font-size="8.5" fill="#198038" font-weight="700">START</text>`
    );
    // End label: in the legend bar
    parts.push(
      `<text x="${SPINE_X}" y="${TITLE_H + LANE_H * n + 14}" text-anchor="middle"` +
      ` font-size="8.5" fill="#da1e28" font-weight="700">END</text>`
    );

    return parts.join("\n  ");
  }

  // ── Lane label column ──────────────────────────────────────────────────────
  // Actor names in BWL often follow pattern "Role Name — Dept/System"
  // We split on em-dash or en-dash to get two lines.
  // All text is truncated to fit the LABEL_W column width.
  // Font sizes and line positions are computed so nothing overflows the LANE_H=160px row.
  function laneLabels(): string {
    return steps.map((s, i) => {
      const top   = laneTop(i);
      const mid   = laneMid(i);
      const theme = CAT[s.category] ?? CAT.approval;

      // Split actor name on " — ", " – ", or " - "
      const actorParts = s.actor.split(/\s[—–-]\s/);
      // Line 1: role name portion (before the dash)
      // Line 2: department/system portion (after the dash)
      // Truncate each to fit in LABEL_W=210px at font-size 11 (~6.5px/char → 30 chars max)
      const L1 = trunc(actorParts[0] ?? s.actor, 28);
      const L2 = actorParts[1] ? trunc(actorParts[1], 28) : "";
      // If still no split and the string is long, try wrapping at 20 chars
      const needsWrap = !L2 && L1.length > 22;
      const wrapped   = needsWrap ? wrap(s.actor, 20, 2) : [L1];
      const line1 = esc(wrapped[0] ?? L1);
      const line2 = esc(wrapped[1] ?? L2);

      // Vertical positions for label text — centred, with room for 2 lines + badge
      const textY1 = line2 ? mid - 10 : mid + 5;   // baseline of first text line
      const textY2 = mid + 8;                        // baseline of second text line

      // Category badge — always 20px above the bottom border of this lane
      const catLabel = trunc((LEGEND_LABELS[s.category] ?? s.category).toUpperCase(), 12);
      const badgeW   = catLabel.length * 5 + 12;

      return `
  <!-- ── Lane label ${i + 1} ── -->
  <rect x="${POOL_W}" y="${top}" width="${LABEL_W}" height="${LANE_H}"
        fill="${C.labelBg}" opacity="${Math.max(0.65, 0.95 - i * 0.04)}" />
  <!-- Category colour stripe on right edge -->
  <rect x="${POOL_W + LABEL_W - 5}" y="${top}" width="5" height="${LANE_H}" fill="${theme.stroke}" />
  <!-- Actor line 1 -->
  <text x="${POOL_W + (LABEL_W - 5) / 2}" y="${textY1}"
        text-anchor="middle" font-size="11" font-weight="600" fill="#ffffff">${line1}</text>
  ${line2 ? `<!-- Actor line 2 -->
  <text x="${POOL_W + (LABEL_W - 5) / 2}" y="${textY2}"
        text-anchor="middle" font-size="9.5" fill="#ffffff" opacity="0.88">${line2}</text>` : ""}
  <!-- Category badge -->
  <rect x="${POOL_W + 8}" y="${top + LANE_H - 20}" width="${badgeW}" height="14" rx="7"
        fill="${theme.stroke}" opacity="0.38" />
  <text x="${POOL_W + 15}" y="${top + LANE_H - 10}"
        font-size="7" font-weight="700" fill="#ffffff" letter-spacing="0.06em">${esc(catLabel)}</text>
  <!-- Lane bottom divider -->
  <line x1="${POOL_W}" y1="${top + LANE_H}" x2="${SVG_W}" y2="${top + LANE_H}"
        stroke="${C.laneBorder}" stroke-width="1" />`;
    }).join("");
  }

  // ── Legend strip ───────────────────────────────────────────────────────────
  function legendStrip(): string {
    const usedCats = [...new Set(steps.map((s) => s.category))];
    const legendY  = TITLE_H + LANE_H * n;
    let lx = POOL_W + LABEL_W + FLOW_W + 8;
    const items = usedCats.map((cat) => {
      const theme = CAT[cat] ?? CAT.approval;
      const label = LEGEND_LABELS[cat] ?? cat;
      const item  = `<rect x="${lx}" y="${legendY + 12}" width="10" height="10" rx="2" fill="${theme.stroke}" />` +
                    `<text x="${lx + 14}" y="${legendY + 21}" font-size="9" fill="${C.textMid}">${label}</text>`;
      lx += label.length * 5.8 + 24;
      return item;
    }).join("\n  ");

    return `
  <rect x="0" y="${legendY}" width="${SVG_W}" height="${LEGEND_H}" fill="#f2f4f8" />
  <line x1="0" y1="${legendY}" x2="${SVG_W}" y2="${legendY}" stroke="${C.laneBorder}" stroke-width="1" />
  <text x="${POOL_W + 8}" y="${legendY + 22}" font-size="8.5" fill="${C.textFaint}" font-weight="700">LEGEND</text>
  ${items}`;
  }

  // ── Footer bar ─────────────────────────────────────────────────────────────
  function footerBar(): string {
    const fy = TITLE_H + LANE_H * n + LEGEND_H;
    return `
  <rect x="0" y="${fy}" width="${SVG_W}" height="${FOOTER_H}" fill="${C.titleBg}" />
  <!-- Left: generated date + SLA -->
  <text x="16" y="${fy + 18}" font-size="9" fill="#ffffff" opacity="0.65">Generated: ${esc(generatedAt)}</text>
  ${slaTotal ? `<text x="16" y="${fy + 34}" font-size="9" fill="#ffffff" opacity="0.65">Est. SLA: ${esc(slaTotal)}</text>` : ""}
  <!-- Centre watermark -->
  <text x="${SVG_W / 2}" y="${fy + FOOTER_H / 2 + 4}" text-anchor="middle"
        font-size="9" fill="#ffffff" opacity="0.35" letter-spacing="0.07em">IBM BLUEWORKS LIVE  ·  BPMN 2.0 PROCESS DIAGRAM</text>
  <!-- Right: step / approver counts -->
  <text x="${SVG_W - 16}" y="${fy + 18}" text-anchor="end" font-size="9" fill="#ffffff" opacity="0.65">Steps: ${n}</text>
  ${wf ? `<text x="${SVG_W - 16}" y="${fy + 34}" text-anchor="end" font-size="9" fill="#ffffff" opacity="0.65">Approvers: ${wf.totalApprovers}</text>` : ""}`;
  }

  // ── Final assembly ─────────────────────────────────────────────────────────
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}"
     font-family="'IBM Plex Sans','Segoe UI',system-ui,sans-serif"
     style="background:#ffffff;display:block">
  <defs>
    <marker id="bwlArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="${C.spineCol}" />
    </marker>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.titleBg}" />
      <stop offset="100%" stop-color="${C.labelBg}" />
    </linearGradient>
  </defs>

  <!-- ═══════════════ TITLE BAR ═══════════════ -->
  <rect x="0" y="0" width="${SVG_W}" height="${TITLE_H}" fill="url(#titleGrad)" />
  <text x="16" y="20" font-size="8.5" font-weight="700" fill="#ffffff" opacity="0.6"
        letter-spacing="0.1em">IBM BLUEWORKS LIVE</text>
  <text x="${SVG_W / 2}" y="${TITLE_H / 2 + 8}" text-anchor="middle"
        font-size="16" font-weight="700" fill="#ffffff" letter-spacing="0.01em">${esc(diagramTitle)}</text>
  ${riskLevel ? `<rect x="${SVG_W - 106}" y="${TITLE_H / 2 - 11}" width="90" height="22" rx="4"
        fill="${RISK_COLOR[riskLevel] ?? C.spineCol}" opacity="0.9" />
  <text x="${SVG_W - 61}" y="${TITLE_H / 2 + 4}" text-anchor="middle"
        font-size="9" font-weight="800" fill="#ffffff" letter-spacing="0.05em">RISK: ${esc(riskLevel.toUpperCase())}</text>` : ""}

  <!-- ═══════════════ POOL LABEL STRIP ═══════════════ -->
  <rect x="0" y="${TITLE_H}" width="${POOL_W}" height="${LANE_H * n}" fill="${C.poolBg}" />
  <text transform="translate(${POOL_W / 2},${TITLE_H + (LANE_H * n) / 2}) rotate(-90)"
        text-anchor="middle" font-size="8.5" font-weight="700" fill="#ffffff"
        letter-spacing="0.1em" opacity="0.85">APPROVAL PROCESS</text>

  <!-- ═══════════════ LANE CONTENT BACKGROUNDS ═══════════════ -->
  ${steps.map((_, i) => {
    const bg = i % 2 === 0 ? C.laneBgEven : C.laneBgOdd;
    return `<rect x="${POOL_W + LABEL_W}" y="${laneTop(i)}" width="${SVG_W - POOL_W - LABEL_W}" height="${LANE_H}" fill="${bg}" />`;
  }).join("\n  ")}

  <!-- ═══════════════ LANE LABELS ═══════════════ -->
  ${laneLabels()}

  <!-- ═══════════════ TASK CARDS ═══════════════ -->
  ${steps.map((s, i) => taskCard(s, i)).join("")}

  <!-- ═══════════════ SLA ANNOTATION BOXES ═══════════════ -->
  ${steps.map((s, i) => slaBox(s, i)).join("")}

  <!-- ═══════════════ FLOW SPINE + EVENTS ═══════════════ -->
  ${flowElements()}

  <!-- ═══════════════ LEGEND STRIP ═══════════════ -->
  ${legendStrip()}

  <!-- ═══════════════ FOOTER BAR ═══════════════ -->
  ${footerBar()}
</svg>`;
}

/** Downloads a string as a file */
function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Draw.io tab ──────────────────────────────────────────────────────────────

/**
 * Generates a draw.io XML string (mxGraph format) that exactly mirrors the SVG
 * swimlane diagram shown on the dashboard: vertical lanes stacked top-to-bottom,
 * IBM blue title bar, pool label strip, actor label column, flow spine with
 * start/end events, task cards with left accent + step badge, SLA annotation
 * boxes, legend strip, and footer bar — all as absolutely-positioned mxCell shapes.
 */
function generateDrawio(typeSlug: string, wf: GeneratedWorkflow | null, answers: Record<string, string>): string {
  // ── Same data + helpers as the SVG renderer ──────────────────────────────────
  const title = wf
    ? wf.label
    : `${typeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Approval Process`;

  const generatedAt = wf ? new Date(wf.generatedAt).toLocaleString() : new Date().toLocaleString();
  const riskLevel   = wf?.riskLevel ?? "";
  const slaTotal    = wf?.estimatedSLA ?? "";

  const steps = wf
    ? buildStepsFromWorkflow(wf)
    : buildSwimlaneLanes(typeSlug, answers).lanes.map((lane, i) => ({
        label:    i === 0 ? "Submit Requisition" : lane.startsWith("System") ? "Record in System" : "Approve",
        sublabel: lane,
        sla:      "",
        actor:    lane,
        category: (lane.startsWith("System") ? "system" : i === 0 ? "initiation" : "approval") as string,
      }));

  const n = steps.length;

  // XML-escape plain text
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  // Double-escape an HTML string for use inside an XML attribute value (draw.io html=1 label)
  const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ── Same colour palette as the SVG ───────────────────────────────────────────
  const CAT: Record<string, { fill: string; stroke: string }> = {
    initiation: { fill: "#edf5ff", stroke: "#0f62fe" },
    validation: { fill: "#fdf6dd", stroke: "#d4910b" },
    approval:   { fill: "#defbe6", stroke: "#198038" },
    legal:      { fill: "#f6f2ff", stroke: "#6929c4" },
    executive:  { fill: "#fff1f1", stroke: "#da1e28" },
    system:     { fill: "#e5f6ff", stroke: "#0072c3" },
    completion: { fill: "#f2f4f8", stroke: "#4d5358" },
  };
  const LEGEND_LABELS: Record<string, string> = {
    initiation: "Initiation", validation: "Validation", approval: "Approval",
    legal: "Legal Review", executive: "Executive", system: "System", completion: "Completion",
  };
  const RISK_COLOR: Record<string, string> = {
    Low: "#198038", Medium: "#d4910b", High: "#da1e28", Critical: "#a2191f",
  };

  // ── Exact same dimensions as the SVG renderer ────────────────────────────────
  const POOL_W   =  28;
  const LABEL_W  = 210;
  const FLOW_W   =  80;
  const CARD_W   = 290;
  const SLA_W    = 170;
  const R_MARGIN =  20;
  const TITLE_H  =  60;
  const LANE_H   = 160;
  const LEGEND_H =  40;
  const FOOTER_H =  56;
  const CARD_H   = 110;
  const ACCENT   =   5;
  const BADGE_R  =  12;
  const START_R  =  14;
  const END_R    =  14;

  const SVG_W    = POOL_W + LABEL_W + FLOW_W + CARD_W + SLA_W + R_MARGIN;
  const SVG_H    = TITLE_H + LANE_H * n + LEGEND_H + FOOTER_H;

  const SPINE_X  = POOL_W + LABEL_W + FLOW_W / 2;
  const CARD_X   = POOL_W + LABEL_W + FLOW_W + 4;
  const SLA_X    = CARD_X + CARD_W + 12;
  const BADGE_CX = CARD_X + ACCENT + 17;
  const TEXT_X   = CARD_X + ACCENT + BADGE_R * 2 + 12;
  const TEXT_W   = CARD_W - ACCENT - BADGE_R * 2 - 18;

  const laneTop = (i: number) => TITLE_H + i * LANE_H;
  const laneMid = (i: number) => laneTop(i) + LANE_H / 2;

  // ── Cell ID counter ───────────────────────────────────────────────────────────
  let _id = 10;
  const nextId = () => `c${_id++}`;

  // ── Helper: place an absolute mxCell rect/shape ───────────────────────────────
  const rect = (
    id: string, x: number, y: number, w: number, h: number,
    style: string, value = "", html = false,
  ) => {
    const v = html ? escAttr(value) : esc(value);
    return `<mxCell id="${id}" value="${v}" style="${style}" vertex="1" parent="page_bg"><mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(w)}" height="${Math.round(h)}" as="geometry"/></mxCell>\n`;
  };

  // ── Helper: edge between two cell IDs ─────────────────────────────────────────
  const edge = (id: string, src: string, tgt: string, style: string) =>
    `<mxCell id="${id}" value="" style="${style}" edge="1" source="${src}" target="${tgt}" parent="page_bg"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;

  // ── Collect all cells ─────────────────────────────────────────────────────────
  let cells = "";

  // Invisible background container at exact SVG size (so draw.io canvas = SVG canvas)
  cells += `<mxCell id="page_bg" value="" style="text;html=1;strokeColor=none;fillColor=none;" vertex="1" parent="1"><mxGeometry x="20" y="20" width="${SVG_W}" height="${SVG_H}" as="geometry"/></mxCell>\n`;

  // ── Title bar ─────────────────────────────────────────────────────────────────
  cells += rect(nextId(), 0, 0, SVG_W, TITLE_H,
    "fillColor=#001d6c;strokeColor=none;fontColor=#ffffff;fontSize=14;fontStyle=1;align=center;verticalAlign=middle;",
    esc(title));
  // Watermark label top-left
  cells += rect(nextId(), 16, 6, 200, 16,
    "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=7;fontStyle=1;fontColor=#ffffff;opacity=60;",
    "DRAW.IO PROCESS DIAGRAM");
  // Risk badge
  if (riskLevel) {
    const rc = RISK_COLOR[riskLevel] ?? "#4d5358";
    cells += rect(nextId(), SVG_W - 106, TITLE_H / 2 - 11, 90, 22,
      `fillColor=${rc};strokeColor=none;rounded=1;arcSize=30;fontColor=#ffffff;fontSize=9;fontStyle=1;align=center;verticalAlign=middle;`,
      `RISK: ${riskLevel.toUpperCase()}`);
  }

  // ── Pool label strip (left vertical bar) ──────────────────────────────────────
  cells += rect(nextId(), 0, TITLE_H, POOL_W, LANE_H * n,
    "fillColor=#0043ce;strokeColor=none;",
    "");
  // Rotated text label — draw.io: use a fixed text cell with rotation
  cells += `<mxCell id="${nextId()}" value="${esc("APPROVAL PROCESS")}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=8;fontStyle=1;fontColor=#ffffff;rotation=-90;opacity=85;" vertex="1" parent="page_bg"><mxGeometry x="${-LANE_H * n / 2 + POOL_W / 2}" y="${TITLE_H + LANE_H * n / 2 - POOL_W / 2}" width="${LANE_H * n}" height="${POOL_W}" as="geometry"/></mxCell>\n`;

  // ── Lane backgrounds + label columns ──────────────────────────────────────────
  steps.forEach((s, i) => {
    const theme = CAT[s.category] ?? CAT.approval;
    const top   = laneTop(i);
    const mid   = laneMid(i);

    // Alternating lane background (content area only)
    const bg = i % 2 === 0 ? "#ffffff" : "#f8f9fb";
    cells += rect(nextId(), POOL_W + LABEL_W, top, SVG_W - POOL_W - LABEL_W, LANE_H,
      `fillColor=${bg};strokeColor=#dde1e7;strokeWidth=1;`,
      "");

    // Actor label column (IBM blue)
    const opacity = Math.max(0.65, 0.95 - i * 0.04);
    cells += rect(nextId(), POOL_W, top, LABEL_W, LANE_H,
      `fillColor=#0f62fe;strokeColor=none;opacity=${Math.round(opacity * 100)};`,
      "");
    // Category colour stripe on right edge of label col
    cells += rect(nextId(), POOL_W + LABEL_W - 5, top, 5, LANE_H,
      `fillColor=${theme.stroke};strokeColor=none;`,
      "");
    // Actor name text
    const actorParts = s.actor.split(/\s[—–-]\s/);
    const L1 = actorParts[0] ?? s.actor;
    const L2 = actorParts[1] ?? "";
    const actorLabel = L2
      ? escAttr(`<b>${esc(L1)}</b><br/><font style="font-size:9px;opacity:0.88;">${esc(L2)}</font>`)
      : escAttr(`<b>${esc(L1)}</b>`);
    cells += `<mxCell id="${nextId()}" value="${actorLabel}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=11;fontColor=#ffffff;whiteSpace=wrap;" vertex="1" parent="page_bg"><mxGeometry x="${POOL_W}" y="${top}" width="${LABEL_W - 5}" height="${LANE_H}" as="geometry"/></mxCell>\n`;

    // Category badge (bottom-left of label col)
    const catLabel = (LEGEND_LABELS[s.category] ?? s.category).toUpperCase();
    const badgeW   = catLabel.length * 5 + 12;
    cells += rect(nextId(), POOL_W + 8, top + LANE_H - 20, badgeW, 14,
      `fillColor=${theme.stroke};strokeColor=none;rounded=1;arcSize=50;opacity=38;`,
      "");
    cells += `<mxCell id="${nextId()}" value="${esc(catLabel)}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=7;fontStyle=1;fontColor=#ffffff;opacity=90;" vertex="1" parent="page_bg"><mxGeometry x="${POOL_W + 15}" y="${top + LANE_H - 20}" width="${badgeW}" height="14" as="geometry"/></mxCell>\n`;

    // Lane bottom divider
    cells += `<mxCell id="${nextId()}" value="" style="line;strokeColor=#dde1e7;strokeWidth=1;fillColor=none;" vertex="1" parent="page_bg"><mxGeometry x="${POOL_W}" y="${top + LANE_H}" width="${SVG_W - POOL_W}" height="1" as="geometry"/></mxCell>\n`;

    // ── Task card ──────────────────────────────────────────────────────────────
    const cardY = mid - CARD_H / 2;
    // Drop shadow
    cells += rect(nextId(), CARD_X + 2, cardY + 3, CARD_W, CARD_H,
      `fillColor=#00000014;strokeColor=none;rounded=1;arcSize=5;`,
      "");
    // Card body
    const cardId = nextId();
    const labelHtml = s.sla
      ? `<b>${esc(s.label)}</b><br/><font style="font-size:9px;color:#525252;">${esc(s.sublabel)}</font><br/><font style="font-size:9px;color:#8d8d8d;">&#x23F1; ${esc(s.sla)}</font>`
      : `<b>${esc(s.label)}</b><br/><font style="font-size:9px;color:#525252;">${esc(s.sublabel)}</font>`;
    cells += rect(cardId, CARD_X, cardY, CARD_W, CARD_H,
      `fillColor=${theme.fill};strokeColor=${theme.stroke};rounded=1;arcSize=5;whiteSpace=wrap;html=1;align=left;verticalAlign=middle;spacingLeft=${ACCENT + BADGE_R * 2 + 14};fontSize=11;`,
      labelHtml, true);
    // Left accent bar
    cells += rect(nextId(), CARD_X, cardY, ACCENT, CARD_H,
      `fillColor=${theme.stroke};strokeColor=none;`,
      "");
    // Step badge circle
    cells += rect(nextId(), BADGE_CX - BADGE_R, mid - BADGE_R, BADGE_R * 2, BADGE_R * 2,
      `ellipse;fillColor=${theme.stroke};strokeColor=none;fontColor=#ffffff;fontSize=10;fontStyle=1;align=center;verticalAlign=middle;`,
      String(i + 1));

    // ── SLA annotation box ─────────────────────────────────────────────────────
    if (s.sla) {
      const boxH  = 44;
      const boxY  = mid - boxH / 2;
      const slaId = nextId();
      // Dashed connector line from card edge to SLA box
      cells += `<mxCell id="${nextId()}" value="" style="endArrow=none;dashed=1;strokeColor=#dde1e7;strokeWidth=1;" edge="1" parent="page_bg"><mxGeometry x="${CARD_X + CARD_W}" y="${mid}" width="${SLA_X - (CARD_X + CARD_W)}" height="1" as="geometry"><Array as="points"/></mxGeometry></mxCell>\n`;
      // SLA box
      cells += rect(slaId, SLA_X, boxY, SLA_W - 12, boxH,
        `fillColor=#ffffff;strokeColor=#dde1e7;dashed=1;rounded=1;arcSize=10;`,
        "");
      cells += `<mxCell id="${nextId()}" value="${esc("SLA")}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=8;fontStyle=1;fontColor=${theme.stroke};" vertex="1" parent="page_bg"><mxGeometry x="${SLA_X + 8}" y="${boxY + 4}" width="40" height="14" as="geometry"/></mxCell>\n`;
      cells += `<mxCell id="${nextId()}" value="${esc(s.sla)}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=9;fontColor=#525252;" vertex="1" parent="page_bg"><mxGeometry x="${SLA_X + 8}" y="${boxY + 18}" width="${SLA_W - 28}" height="14" as="geometry"/></mxCell>\n`;
    }
  });

  // ── Flow spine ────────────────────────────────────────────────────────────────
  const firstMid = laneMid(0);
  const lastMid  = laneMid(n - 1);

  // Vertical spine line
  if (n > 1) {
    cells += `<mxCell id="${nextId()}" value="" style="endArrow=none;strokeColor=#4d5358;strokeWidth=2;" edge="1" parent="page_bg"><mxGeometry x="${SPINE_X}" y="${firstMid + START_R}" width="1" height="${lastMid - firstMid - START_R - END_R}" as="geometry"><mxPoint x="${SPINE_X}" y="${firstMid + START_R}" as="sourcePoint"/><mxPoint x="${SPINE_X}" y="${lastMid - END_R}" as="targetPoint"/></mxGeometry></mxCell>\n`;
  }

  // Horizontal arrows spine → card
  const arrowIds: string[] = [];
  steps.forEach((_, i) => {
    const mid = laneMid(i);
    const aid = nextId();
    arrowIds.push(aid);
    cells += `<mxCell id="${aid}" value="" style="endArrow=block;endFill=1;strokeColor=#4d5358;strokeWidth=1.5;" edge="1" parent="page_bg"><mxGeometry x="${SPINE_X + (i === 0 ? START_R : 6)}" y="${mid}" width="${CARD_X - 2 - SPINE_X}" height="0" as="geometry"><mxPoint x="${SPINE_X + (i === 0 ? START_R : 6)}" y="${mid}" as="sourcePoint"/><mxPoint x="${CARD_X - 2}" y="${mid}" as="targetPoint"/></mxGeometry></mxCell>\n`;
    // Dot on spine for intermediate lanes
    if (i > 0 && i < n - 1) {
      cells += rect(nextId(), SPINE_X - 4, mid - 4, 8, 8,
        "ellipse;fillColor=#4d5358;strokeColor=none;",
        "");
    }
  });

  // Start event (green filled circle)
  const startCellId = nextId();
  cells += rect(startCellId, SPINE_X - START_R, firstMid - START_R, START_R * 2, START_R * 2,
    "ellipse;fillColor=#198038;strokeColor=none;fontColor=#ffffff;fontSize=9;fontStyle=1;align=center;verticalAlign=middle;",
    "▶");
  // START label above first lane
  cells += `<mxCell id="${nextId()}" value="${esc("START")}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=bottom;fontSize=8;fontStyle=1;fontColor=#198038;" vertex="1" parent="page_bg"><mxGeometry x="${SPINE_X - 20}" y="${TITLE_H - 16}" width="40" height="14" as="geometry"/></mxCell>\n`;

  // End event (white circle with red double ring)
  const endCellId = nextId();
  cells += rect(endCellId, SPINE_X - END_R, lastMid - END_R, END_R * 2, END_R * 2,
    "ellipse;fillColor=#ffffff;strokeColor=#da1e28;strokeWidth=3;double=1;",
    "");
  cells += rect(nextId(), SPINE_X - END_R + 6, lastMid - END_R + 6, (END_R - 6) * 2, (END_R - 6) * 2,
    "ellipse;fillColor=#da1e28;strokeColor=none;",
    "");
  // END label in legend bar
  cells += `<mxCell id="${nextId()}" value="${esc("END")}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=top;fontSize=8;fontStyle=1;fontColor=#da1e28;" vertex="1" parent="page_bg"><mxGeometry x="${SPINE_X - 20}" y="${TITLE_H + LANE_H * n + 4}" width="40" height="14" as="geometry"/></mxCell>\n`;

  // ── Legend strip ──────────────────────────────────────────────────────────────
  const legendY = TITLE_H + LANE_H * n;
  cells += rect(nextId(), 0, legendY, SVG_W, LEGEND_H,
    "fillColor=#f2f4f8;strokeColor=#dde1e7;strokeWidth=1;",
    "");
  cells += `<mxCell id="${nextId()}" value="${esc("LEGEND")}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=8;fontStyle=1;fontColor=#8d8d8d;" vertex="1" parent="page_bg"><mxGeometry x="${POOL_W + 8}" y="${legendY + 2}" width="60" height="${LEGEND_H - 4}" as="geometry"/></mxCell>\n`;
  const usedCats = [...new Set(steps.map((s) => s.category))];
  let lx = POOL_W + LABEL_W + FLOW_W + 8;
  usedCats.forEach((cat) => {
    const theme = CAT[cat] ?? CAT.approval;
    const label = LEGEND_LABELS[cat] ?? cat;
    cells += rect(nextId(), lx, legendY + 13, 10, 10,
      `fillColor=${theme.stroke};strokeColor=none;rounded=1;arcSize=20;`,
      "");
    cells += `<mxCell id="${nextId()}" value="${esc(label)}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;fontSize=9;fontColor=#525252;" vertex="1" parent="page_bg"><mxGeometry x="${lx + 14}" y="${legendY + 10}" width="${label.length * 6 + 4}" height="16" as="geometry"/></mxCell>\n`;
    lx += label.length * 5.8 + 24;
  });

  // ── Footer bar ────────────────────────────────────────────────────────────────
  const fy = legendY + LEGEND_H;
  cells += rect(nextId(), 0, fy, SVG_W, FOOTER_H,
    "fillColor=#001d6c;strokeColor=none;",
    "");
  cells += `<mxCell id="${nextId()}" value="${esc(`Generated: ${generatedAt}`)}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=9;fontColor=#ffffff;opacity=65;" vertex="1" parent="page_bg"><mxGeometry x="16" y="${fy + 6}" width="240" height="16" as="geometry"/></mxCell>\n`;
  if (slaTotal) {
    cells += `<mxCell id="${nextId()}" value="${esc(`Est. SLA: ${slaTotal}`)}" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;fontSize=9;fontColor=#ffffff;opacity=65;" vertex="1" parent="page_bg"><mxGeometry x="16" y="${fy + 24}" width="240" height="16" as="geometry"/></mxCell>\n`;
  }
  cells += `<mxCell id="${nextId()}" value="${esc("IBM APPROVAL INTELLIGENCE  ·  DRAW.IO PROCESS DIAGRAM")}" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=9;fontColor=#ffffff;opacity=35;" vertex="1" parent="page_bg"><mxGeometry x="${SVG_W / 2 - 160}" y="${fy}" width="320" height="${FOOTER_H}" as="geometry"/></mxCell>\n`;
  cells += `<mxCell id="${nextId()}" value="${esc(`Steps: ${n}`)}" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=top;fontSize=9;fontColor=#ffffff;opacity=65;" vertex="1" parent="page_bg"><mxGeometry x="${SVG_W - 120}" y="${fy + 6}" width="100" height="16" as="geometry"/></mxCell>\n`;
  if (wf) {
    cells += `<mxCell id="${nextId()}" value="${esc(`Approvers: ${wf.totalApprovers}`)}" style="text;html=1;strokeColor=none;fillColor=none;align=right;verticalAlign=top;fontSize=9;fontColor=#ffffff;opacity=65;" vertex="1" parent="page_bg"><mxGeometry x="${SVG_W - 120}" y="${fy + 24}" width="100" height="16" as="geometry"/></mxCell>\n`;
  }

  return `<mxfile host="ApprovalDashboard" modified="${new Date().toISOString()}" agent="IBM Approval Intelligence" version="21.0.0" type="device">
  <diagram name="${esc(title)}" id="diagram_1">
    <mxGraphModel dx="1422" dy="762" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${SVG_W + 40}" pageHeight="${SVG_H + 40}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        ${cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

// ─── Draw.io preview SVG (simplified horizontal flow for in-browser display) ──

function renderDrawioPreviewSvg(typeSlug: string, wf: GeneratedWorkflow | null, answers: Record<string, string>): string {
  // Reuse the existing swimlane SVG renderer — same visual, but labelled for draw.io context
  return renderSwimlaneSvg(typeSlug, wf, answers);
}

// ─── Draw.io tab component ────────────────────────────────────────────────────

function DrawioTab({
  typeSlug,
  answers,
  color,
  wf,
}: {
  typeSlug: string;
  answers: Record<string, string>;
  color: string;
  wf: GeneratedWorkflow | null;
}) {
  const [generated, setGenerated]         = useState(false);
  const [svgContent, setSvgContent]       = useState<string | null>(null);
  const [uploadedXml, setUploadedXml]     = useState<string | null>(null);
  const [uploadedName, setUploadedName]   = useState<string | null>(null);
  const [uploadError, setUploadError]     = useState<string | null>(null);
  const [dragOver, setDragOver]           = useState(false);
  const fileInputRef                       = useRef<HTMLInputElement>(null);

  const diagramTitle = wf ? wf.label : buildSwimlaneLanes(typeSlug, answers).title;

  const handleGenerate = () => {
    setSvgContent(renderDrawioPreviewSvg(typeSlug, wf, answers));
    setGenerated(true);
    setUploadedXml(null);
    setUploadedName(null);
    setUploadError(null);
  };

  const handleDownloadDrawio = () => {
    const xml = generateDrawio(typeSlug, wf, answers);
    downloadFile(xml, `${typeSlug}-approval-process.drawio`, "application/xml");
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    downloadFile(svgContent, `${typeSlug}-approval-process-drawio.svg`, "image/svg+xml");
  };

  const parseUpload = (file: File) => {
    if (!file.name.endsWith(".drawio") && !file.name.endsWith(".xml")) {
      setUploadError("Only .drawio or .xml files are supported.");
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        // Validate it parses as XML
        const parser = new DOMParser();
        const doc    = parser.parseFromString(text, "text/xml");
        if (doc.querySelector("parsererror")) throw new Error("Invalid XML");
        setUploadedXml(text);
        setUploadedName(file.name);
        setGenerated(true);
        setSvgContent(null);
      } catch {
        setUploadError("Could not parse the uploaded file. Make sure it is a valid draw.io XML file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseUpload(file);
  };

  // Extract step data from uploaded draw.io XML and re-render as SVG
  const uploadedSvg: string | null = uploadedXml ? (() => {
    try {
      const doc   = new DOMParser().parseFromString(uploadedXml, "text/xml");
      const cells = Array.from(doc.querySelectorAll("mxCell"));
      // Find task card cells: vertex, has value, not pool/lane/bg/text-only, not start/end
      const taskCells = cells.filter((c) => {
        const val   = c.getAttribute("value") ?? "";
        const style = c.getAttribute("style") ?? "";
        const id    = c.getAttribute("id") ?? "";
        if (c.getAttribute("vertex") !== "1") return false;
        if (c.getAttribute("edge") === "1")   return false;
        if (["0","1","page_bg"].includes(id))  return false;
        // Keep only rounded task cards (not pool strips, lane backgrounds, text labels, spine dots, events)
        return style.includes("rounded=1") && val.length > 0;
      });

      if (taskCells.length === 0) return null;

      // Rebuild steps array from the task cells
      const steps: Array<{ label: string; sublabel: string; sla: string; actor: string; category: string }> =
        taskCells.map((c) => {
          const raw = c.getAttribute("value") ?? "";
          // Strip XML-escaped HTML: &lt;b&gt;Title&lt;/b&gt;&lt;br/&gt;&lt;font...&gt;Role&lt;/font&gt;...
          const unescaped = raw
            .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
          // Extract bold title
          const titleMatch = unescaped.match(/<b>(.*?)<\/b>/);
          const title = titleMatch?.[1] ?? raw.replace(/<[^>]+>/g, " ").trim().split(" ").slice(0, 4).join(" ");
          // Extract role (first font tag)
          const fontMatches = [...unescaped.matchAll(/<font[^>]*>(.*?)<\/font>/gs)];
          const role = fontMatches[0]?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
          const sla  = fontMatches[1]?.[1]?.replace(/<[^>]+>/g, "").replace("⏱", "").trim() ?? "";
          // Derive category from fill colour in style
          const style = c.getAttribute("style") ?? "";
          const fillMatch = style.match(/fillColor=([^;]+)/);
          const fill = fillMatch?.[1] ?? "";
          const category = fill === "#edf5ff" ? "initiation"
            : fill === "#fdf6dd"              ? "validation"
            : fill === "#defbe6"              ? "approval"
            : fill === "#f6f2ff"              ? "legal"
            : fill === "#fff1f1"              ? "executive"
            : fill === "#e5f6ff"              ? "system"
            : fill === "#f2f4f8"              ? "completion"
            : "approval";
          // Actor: find the lane cell whose parent lane index matches
          const actor = role || "Approver";
          return { label: title, sublabel: role, sla, actor, category };
        });

      // Re-use wf if available (it has the actor names from the original); otherwise build a synthetic wf
      if (wf) {
        // Rebuild wf steps from uploaded task cells, preserving actor names from original wf where possible
        const rebuiltWf: GeneratedWorkflow = {
          ...wf,
          steps: steps.map((s, i) => ({
            ...(wf.steps[i] ?? wf.steps[wf.steps.length - 1]),
            title:       s.label,
            role:        s.sublabel,
            sla:         s.sla || (wf.steps[i]?.sla ?? ""),
            category:    s.category as GeneratedWorkflow["steps"][0]["category"],
          })),
        };
        return renderSwimlaneSvg(typeSlug, rebuiltWf, answers);
      }
      return renderSwimlaneSvg(typeSlug, null, answers);
    } catch { return null; }
  })() : null;

  const uploadedDiagramName = uploadedXml ? (() => {
    try {
      const doc = new DOMParser().parseFromString(uploadedXml, "text/xml");
      return doc.querySelector("diagram")?.getAttribute("name") ?? uploadedName ?? "Uploaded diagram";
    } catch { return uploadedName ?? "Uploaded diagram"; }
  })() : null;

  return (
    <div style={{ fontFamily: SANS, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#6929c4", margin: "0 0 4px", textTransform: "uppercase" }}>draw.io / diagrams.net</p>
          <h2 style={{ fontSize: 17, fontWeight: 400, color: "#161616", margin: "0 0 4px" }}>Editable Process Flow Diagram</h2>
          <p style={{ fontSize: 12, color: "#525252", margin: 0, lineHeight: 1.6 }}>
            Generate and download a fully editable draw.io diagram from your process flow.
            Edit shapes, arrows, and text in draw.io then re-upload your changes here.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={handleGenerate}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#6929c4", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontFamily: SANS, fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#491d8b"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#6929c4"; }}
          >
            <Share2 size={14} /> {generated && !uploadedXml ? "Regenerate" : "Generate Diagram"}
          </button>
          <button
            onClick={handleDownloadDrawio}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "transparent", color: "#6929c4", border: "1px solid #6929c4", cursor: "pointer", fontSize: 13, fontFamily: SANS, fontWeight: 500 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f6f2ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Download as .drawio file — open and edit in diagrams.net or draw.io desktop"
          >
            <Download size={14} /> Download .drawio
          </button>
        </div>
      </div>

      {/* Source banner */}
      {wf ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#defbe6", border: "1px solid #a7f0ba" }}>
          <CheckCircle2 size={13} style={{ color: "#24a148", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#161616", margin: 0, lineHeight: 1.6 }}>
            Diagram built from the <strong>Process Flow</strong> tab — {wf.steps.length} steps, {wf.totalApprovers} approver{wf.totalApprovers !== 1 ? "s" : ""}, estimated SLA: <strong>{wf.estimatedSLA}</strong>.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#fff8e6", border: "1px solid #f1c21b" }}>
          <AlertCircle size={13} style={{ color: "#f1a100", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#161616", margin: 0, lineHeight: 1.6 }}>
            No process flow generated yet. Go to <strong>Requirements → Generate Process Flow</strong> first for a richer diagram.
          </p>
        </div>
      )}

      {/* How-to tip */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#f6f2ff", border: "1px solid #d4bbff" }}>
        <ExternalLink size={13} style={{ color: "#6929c4", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12, color: "#161616", margin: 0, lineHeight: 1.6 }}>
          To edit: click <strong>Download .drawio</strong> → open in{" "}
          <a href="https://app.diagrams.net" target="_blank" rel="noopener noreferrer" style={{ color: "#6929c4" }}>diagrams.net</a>
          {" "}or the{" "}
          <a href="https://www.diagrams.net/blog/diagrams-desktop" target="_blank" rel="noopener noreferrer" style={{ color: "#6929c4" }}>draw.io desktop app</a>
          {" "}→ edit shapes, arrows, and labels → save as <code>.drawio</code> → drag-and-drop or upload the file back here to preview your changes.
        </p>
      </div>

      {/* Idle placeholder */}
      {!generated && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #e0e0e0", padding: 48, gap: 12, minHeight: 200 }}>
          <Share2 size={36} style={{ color: "#c6c6c6" }} strokeWidth={1} />
          <p style={{ fontSize: 13, color: "#8d8d8d", margin: 0, textAlign: "center" }}>
            {wf
              ? <>Click <strong style={{ color: "#161616" }}>Generate Diagram</strong> to preview the swimlane,<br />then <strong style={{ color: "#161616" }}>Download .drawio</strong> to edit it.</>
              : <>Go to <strong style={{ color: "#161616" }}>Requirements → Generate Process Flow</strong> first,<br />then return here to generate the draw.io diagram.</>
            }
          </p>
        </div>
      )}

      {/* Generated SVG preview */}
      {generated && !uploadedXml && svgContent && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: "#24a148" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>{diagramTitle}</span>
            </div>
            <button
              onClick={handleDownloadSvg}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6929c4", fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              <Download size={12} /> Save as SVG
            </button>
          </div>
          <div style={{ border: "1px solid #e0e0e0", background: "#fafafa", padding: 16, overflowX: "auto" }}
               dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>
      )}

      {/* Uploaded file preview — rendered via viewer.diagrams.net iframe */}
      {uploadedXml && uploadedDiagramName && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: "#24a148" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>{uploadedDiagramName}</span>
              <span style={{ fontSize: 11, color: "#8d8d8d" }}>— {uploadedName}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  const blob = new Blob([uploadedXml], { type: "application/xml" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href = url; a.download = uploadedName ?? "edited-diagram.drawio"; a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#6929c4", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#491d8b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#6929c4"; }}
              >
                <Download size={12} /> Download edited .drawio
              </button>
              <button
                onClick={() => { setUploadedXml(null); setUploadedName(null); setGenerated(false); setSvgContent(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#fff", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <RotateCcw size={12} /> Clear upload
              </button>
            </div>
          </div>
          {/* Render the uploaded diagram as SVG */}
          {uploadedSvg
            ? <div style={{ border: "1px solid #e0e0e0", background: "#fafafa", padding: 16, overflowX: "auto" }}
                   dangerouslySetInnerHTML={{ __html: uploadedSvg }} />
            : <div style={{ border: "1px solid #e0e0e0", padding: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, color: "#8d8d8d" }}>Could not render diagram preview — the file may use unsupported shapes.</span>
              </div>
          }
        </div>
      )}

      {/* Upload zone — always visible below preview */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#525252", letterSpacing: "0.06em", margin: "0 0 8px" }}>UPLOAD EDITED .DRAWIO FILE</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#6929c4" : "#e0e0e0"}`,
            background: dragOver ? "#f6f2ff" : "#fafafa",
            padding: "28px 24px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <Upload size={22} style={{ color: dragOver ? "#6929c4" : "#c6c6c6" }} strokeWidth={1.5} />
          <p style={{ fontSize: 13, color: "#525252", margin: 0, textAlign: "center" }}>
            Drag &amp; drop your edited <code>.drawio</code> file here, or <strong style={{ color: "#6929c4" }}>click to browse</strong>
          </p>
          <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>Accepts .drawio and .xml files</p>
        </div>
        <input ref={fileInputRef} type="file" accept=".drawio,.xml" style={{ display: "none" }} onChange={handleFileInput} />
        {uploadError && (
          <p style={{ fontSize: 12, color: "#da1e28", margin: "6px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={12} /> {uploadError}
          </p>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function BlueworksTab({
  typeSlug,
  answers,
  color,
  wf,
}: {
  typeSlug: string;
  answers: Record<string, string>;
  color: string;
  wf: GeneratedWorkflow | null;
}) {
  const [generated, setGenerated] = useState(false);

  const diagramTitle = wf ? wf.label : buildSwimlaneLanes(typeSlug, answers).title;
  const svgContent   = generated ? renderSwimlaneSvg(typeSlug, wf, answers) : null;
  const bwlImportUrl = (BWL_URL ?? "https://ibm.blueworkslive.com").replace(/\/$/, "");

  const handleDownloadBpmn = () => {
    const xml = generateBpmn(typeSlug, wf, answers);
    downloadFile(xml, `${typeSlug}-approval-process.bpmn`, "application/xml");
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    downloadFile(svgContent, `${typeSlug}-approval-process.svg`, "image/svg+xml");
  };

  return (
    <div style={{ fontFamily: SANS, padding: "28px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#0062ff", margin: "0 0 4px", textTransform: "uppercase" }}>IBM Blueworks Live</p>
          <h2 style={{ fontSize: 17, fontWeight: 400, color: "#161616", margin: "0 0 4px" }}>Process Flow Diagram</h2>
          <p style={{ fontSize: 12, color: "#525252", margin: 0, lineHeight: 1.6 }}>
            Generate a BPMN 2.0 swimlane diagram from your submitted requirements.
            Download the BPMN file and import it directly into IBM Blueworks Live.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={() => setGenerated(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
              background: "#0062ff", color: "#fff", border: "none", cursor: "pointer",
              fontSize: 13, fontFamily: SANS, fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0043ce"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0062ff"; }}
          >
            <Workflow size={14} /> {generated ? "Regenerate Diagram" : "Generate Blueworks Diagram"}
          </button>
          <button
            onClick={handleDownloadBpmn}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
              background: "transparent", color: "#0062ff", border: "1px solid #0062ff",
              cursor: "pointer", fontSize: 13, fontFamily: SANS, fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#edf4ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Download BPMN 2.0 XML — import this file into IBM Blueworks Live"
          >
            <Download size={14} /> Download BPMN
          </button>
        </div>
      </div>

      {/* Source info banner */}
      {wf ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#defbe6", border: "1px solid #a7f0ba" }}>
          <CheckCircle2 size={13} style={{ color: "#24a148", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#161616", margin: 0, lineHeight: 1.6 }}>
            Diagram generated from the <strong>Process Flow</strong> tab — {wf.steps.length} steps, {wf.totalApprovers} approver{wf.totalApprovers !== 1 ? "s" : ""}, estimated SLA: <strong>{wf.estimatedSLA}</strong>.
            {" "}Go to the <strong>Process Flow</strong> tab to regenerate if requirements changed.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#fff8e6", border: "1px solid #f1c21b" }}>
          <AlertCircle size={13} style={{ color: "#f1a100", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#161616", margin: 0, lineHeight: 1.6 }}>
            No process flow generated yet. Go to <strong>Requirements → Generate Process Flow</strong> first for a richer diagram with SLA, actor and step detail.
          </p>
        </div>
      )}

      {/* Import tip */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#edf4ff", border: "1px solid #b8d4f8" }}>
        <ExternalLink size={13} style={{ color: "#0062ff", flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12, color: "#161616", margin: 0, lineHeight: 1.6 }}>
          To import into{" "}
          <a href={bwlImportUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0062ff" }}>
            IBM Blueworks Live
          </a>
          {": "}go to <strong>Library → Processes</strong>, then click the <strong>⊡+ import button</strong> in the toolbar (the square-with-plus icon, third after the ★ star and ⊞ grid) → select the downloaded <code>.bpmn</code> file.
        </p>
      </div>

      {/* Idle placeholder */}
      {!generated && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #e0e0e0", padding: 48, gap: 12, minHeight: 200 }}>
          <Workflow size={36} style={{ color: "#c6c6c6" }} strokeWidth={1} />
          <p style={{ fontSize: 13, color: "#8d8d8d", margin: 0, textAlign: "center" }}>
            {wf
              ? <>Click <strong style={{ color: "#161616" }}>Generate Blueworks Diagram</strong> to render the swimlane<br />from your <strong>{wf.steps.length}-step</strong> process flow.</>
              : <>Go to <strong style={{ color: "#161616" }}>Requirements → Generate Process Flow</strong> first,<br />then return here to generate the Blueworks diagram.</>
            }
          </p>
        </div>
      )}

      {/* SVG diagram */}
      {generated && svgContent && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={14} style={{ color: "#24a148" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>{diagramTitle}</span>
            </div>
            <button
              onClick={handleDownloadSvg}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#0062ff", fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              <Download size={12} /> Save as SVG
            </button>
          </div>
          <div style={{ border: "1px solid #e0e0e0", background: "#fafafa", padding: 16, overflowX: "auto" }}
               dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


// ─── Requirements & Process Flow panel ───────────────────────────────────────

export function RequirementsPanel({ typeSlug, color, onWorkflowGenerated, onSubmittedAtChange }: { typeSlug: string; color: string; onWorkflowGenerated: () => void; onSubmittedAtChange?: (ts: string | null) => void }) {
  // ── Unified version state ──
  const [versions, setVersions]     = useState<UnifiedVersion[]>(() => loadUnifiedVersions(typeSlug));
  const [activeId, setActiveId]     = useState<string | null>(() => {
    const vs = loadUnifiedVersions(typeSlug);
    return vs.length > 0 ? vs[vs.length - 1].id : null;
  });

  const activeVersion = versions.find((v) => v.id === activeId) ?? null;

  // ── Per-version reactive state ──
  const [answers, setAnswers]           = useState<Record<string, string>>(() =>
    activeVersion?.answers ?? (() => { try { return JSON.parse(localStorage.getItem(`discovery_answers_${typeSlug}`) ?? "{}"); } catch { return {}; } })()
  );
  const [submitted, setSubmitted]       = useState(() => Boolean(activeVersion?.submittedAt));
  const [submittedAt, setSubmittedAt]   = useState<string | null>(() => activeVersion?.submittedAt ?? null);
  const [othApprovers, setOthApprovers] = useState<OthApprover[]>(() => loadApprovers(typeSlug));
  const [wf, setWf]                     = useState<GeneratedWorkflow | null>(() => activeVersion?.workflow ?? loadWorkflow(typeSlug));
  const [activeTab, setActiveTab]       = useState<"requirements" | "workflow" | "blueworks" | "drawio">(wf ? "workflow" : "requirements");

  // Notify parent whenever the active version's submittedAt changes
  useEffect(() => {
    onSubmittedAtChange?.(submittedAt);
  }, [submittedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist answers to localStorage for CompletionRing etc.
  useEffect(() => {
    localStorage.setItem(`discovery_answers_${typeSlug}`, JSON.stringify(answers));
    window.dispatchEvent(new Event("storage"));
  }, [answers, typeSlug]);

  useEffect(() => { saveApprovers(typeSlug, othApprovers); }, [othApprovers, typeSlug]);

  // ── Version selection ──
  const selectVersion = (v: UnifiedVersion) => {
    setActiveId(v.id);
    setAnswers(v.answers);
    setWf(v.workflow ?? null);
    setActiveTab("requirements");
    setSubmitted(Boolean(v.answers && Object.keys(v.answers).length > 0));
    setSubmittedAt(v.submittedAt ?? null);
  };

  // ── Requirements handlers ──
  const handleAnswersChange = (id: string, value: string) => {
    if (id === "__RESET__") { setAnswers({}); setOthApprovers([]); setSubmitted(false); setSubmittedAt(null); return; }
    setAnswers((p) => ({ ...p, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = new Date().toISOString();
    localStorage.setItem(`req_submitted_${typeSlug}`, "true");
    localStorage.setItem(`req_submitted_at_${typeSlug}`, ts);
    // Create new unified version with current answers — store timestamp on the version itself
    const { versions: updated, newId } = addUnifiedVersion(typeSlug, answers, versions, ts);
    setVersions(updated);
    setActiveId(newId);
    setSubmitted(true);
    setSubmittedAt(ts);
    window.dispatchEvent(new Event("storage"));
  };

  const handleEdit = () => {
    localStorage.removeItem(`req_submitted_${typeSlug}`);
    localStorage.removeItem(`req_submitted_at_${typeSlug}`);
    setSubmitted(false);
    setSubmittedAt(null);
    window.dispatchEvent(new Event("storage"));
  };

  const handleDownload = () => {
    const approvalType = APPROVAL_TYPES.find((t) => t.slug === typeSlug);
    const visibleQs = getVisibleQuestions(typeSlug, answers);
    downloadRequirementsXlsx(typeSlug, approvalType?.label ?? typeSlug, visibleQs, answers, {
      gatekeeper: loadRoster(typeSlug, "gatekeeper_roster"),
      ccManager:  loadRoster(typeSlug, "cc_manager_roster"),
    });
  };

  // ── Workflow handlers ──
  const handleGenerate = (reqAnswers: Record<string, string>) => {
    const approvalType = APPROVAL_TYPES.find((t) => t.slug === typeSlug);
    const generated = generateWorkflow(typeSlug, approvalType?.label ?? typeSlug, reqAnswers);
    saveWorkflow(generated);
    // Attach to current active version (or create a new one if none)
    let updated: UnifiedVersion[];
    let targetId = activeId;
    if (targetId && versions.find((v) => v.id === targetId)) {
      updated = attachWorkflowToVersion(typeSlug, targetId, generated, versions);
    } else {
      const result = addUnifiedVersion(typeSlug, reqAnswers, versions);
      updated = attachWorkflowToVersion(typeSlug, result.newId, generated, result.versions);
      targetId = result.newId;
    }
    setVersions(updated);
    setActiveId(targetId);
    setWf(generated);
    setActiveTab("workflow");
    onWorkflowGenerated();
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this process flow version?")) return;
    if (!activeId) { deleteWorkflow(typeSlug); setWf(null); setActiveTab("requirements"); onWorkflowGenerated(); return; }
    // Remove workflow from the active version (keep requirements)
    const updated = attachWorkflowToVersion(typeSlug, activeId, undefined as any, versions);
    // Actually strip the workflow property
    const stripped = updated.map((v) => v.id === activeId ? { ...v, workflow: undefined } : v);
    setVersions(stripped);
    saveUnifiedVersions(typeSlug, stripped);
    deleteWorkflow(typeSlug);
    setWf(null);
    setActiveTab("requirements");
    onWorkflowGenerated();
  };

  const handleRegenerate = () => {
    if (!window.confirm("Generate a new process flow from the current requirements? The old flow will be kept in the current version.")) return;
    handleGenerate(answers);
  };

  const handleVersionDelete = (id: string) => {
    const updated = deleteUnifiedVersion(typeSlug, id);
    setVersions(updated);
    if (activeId === id) {
      const last = updated[updated.length - 1];
      if (last) { selectVersion(last); }
      else { setActiveId(null); setAnswers({}); setWf(null); setSubmitted(false); setActiveTab("requirements"); deleteWorkflow(typeSlug); }
    }
    onWorkflowGenerated();
  };

  const tabs = [
    { id: "requirements" as const, label: "Requirements", icon: ClipboardList },
    ...(wf ? [{ id: "workflow" as const, label: "Process Flow", icon: GitBranch }] : []),
    ...((wf || submitted) ? [{ id: "blueworks" as const, label: "Blueworks Live", icon: Workflow }] : []),
    ...((wf || submitted) ? [{ id: "drawio" as const, label: "Draw.io", icon: Share2 }] : []),
  ];

  return (
    <div style={{ border: "1px solid #e0e0e0", background: "#ffffff", marginTop: 1 }}>
      {/* Unified version bar — single row above tabs */}
      <UnifiedVersionBar
        versions={versions}
        activeId={activeId}
        onSelect={selectVersion}
        onRename={(id, name) => setVersions(renameUnifiedVersion(typeSlug, id, name))}
        onDelete={handleVersionDelete}
        onToggleLock={(id) => setVersions(toggleVersionLock(typeSlug, id))}
      />

      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #e0e0e0", background: "#f4f4f4" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon; const isActive = activeTab === tab.id;
          const tabAccent = tab.id === "workflow" ? "#24a148" : tab.id === "blueworks" ? "#0062ff" : tab.id === "drawio" ? "#6929c4" : color;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 18px", background: "transparent", border: "none", borderBottom: isActive ? `2px solid ${tabAccent}` : "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? tabAccent : "#525252", fontFamily: SANS, transition: "color 0.15s" }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.color = "#161616"; }}
              onMouseOut={(e)  => { if (!isActive) e.currentTarget.style.color = "#525252"; }}>
              <Icon size={13} strokeWidth={isActive ? 2 : 1.5} />
              {tab.label}
              {tab.id === "requirements" && submitted && <CheckCheck size={12} style={{ color: "#24a148" }} />}
            </button>
          );
        })}
      </div>

      {/* Reference document bar — visible on all tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 20px", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
        <FileText size={13} style={{ color: "#525252", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "#525252" }}>Reference:</span>
        <a
          href="/Procurement - Process Flows.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: "#0f62fe", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
        >
          Procurement – Process Flows.pdf <ExternalLink size={11} />
        </a>
      </div>

      {activeTab === "requirements" && (
        <RequirementsTab
          typeSlug={typeSlug}
          color={color}
          answers={answers}
          submitted={submitted}
          submittedAt={submittedAt}
          othApprovers={othApprovers}
          onAnswersChange={handleAnswersChange}
          onOthApproversChange={setOthApprovers}
          onSubmit={handleSubmit}
          onEdit={handleEdit}
          onDownload={handleDownload}
          onGenerate={handleGenerate}
        />
      )}
      {activeTab === "workflow" && wf && (
        <WorkflowReport wf={wf} color={color} onDelete={handleDelete} onRegenerate={handleRegenerate} />
      )}
      {activeTab === "blueworks" && (
        <BlueworksTab typeSlug={typeSlug} answers={answers} color={color} wf={wf} />
      )}
      {activeTab === "drawio" && (
        <DrawioTab typeSlug={typeSlug} answers={answers} color={color} wf={wf} />
      )}
    </div>
  );
}

// ─── Workflow tile (Row 3 of ApprovalType) ────────────────────────────────────

function WorkflowTile({ slug, color, onOpen }: { slug: string; color: string; onOpen: () => void }) {
  const wf = loadWorkflow(slug);
  if (!wf) return null;
  const rc = RISK_COLOR[wf.riskLevel] ?? "#8d8d8d";

  return (
    <div style={{ marginTop: 1 }}>
      <button onClick={onOpen}
        style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 24px", background: "#ffffff", border: "1px solid #e0e0e0", borderLeft: `3px solid #24a148`, cursor: "pointer", fontFamily: SANS, textAlign: "left", transition: "background 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
        <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "#24a14814", border: "1px solid #24a14830", flexShrink: 0, position: "relative" }}>
          <GitBranch size={18} style={{ color: "#24a148" }} strokeWidth={1.5} />
          <div style={{ position: "absolute", top: -4, right: -4, width: 12, height: 12, borderRadius: "50%", background: "#24a148", border: "2px solid #ffffff" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>Generated Process Flow</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", background: "#a7f0ba", color: "#198038" }}>BUILT</span>
            {riskBadge(wf.riskLevel)}
          </div>
          <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>
            {wf.steps.length} steps · {wf.totalApprovers} approvers · SLA: {wf.estimatedSLA} · {new Date(wf.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#24a148", flexShrink: 0 }}>
          View <ArrowRight size={12} />
        </div>
      </button>
    </div>
  );
}

// ─── Main ApprovalType page ───────────────────────────────────────────────────

export default function ApprovalType() {
  const { type }  = useParams<{ type: string }>();
  const navigate  = useNavigate();
  const [maintenanceOpen, setMaintenanceOpen]               = useState(false);
  const [deckDrawerOpen, setDeckDrawerOpen]                 = useState(false);
  const [customerExamplesOpen, setCustomerExamplesOpen]     = useState(false);
  const [discoveryOpen, setDiscoveryOpen]                   = useState(false);
  const [workflowExists, setWorkflowExists]   = useState(() => Boolean(loadWorkflow(type ?? "")));
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const approvalType = APPROVAL_TYPES.find((t) => t.slug === type);

  if (!approvalType) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Approval type not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back to home</button>
      </div>
    );
  }

  const { color } = approvalType;
  const TypeIcon  = approvalType.icon;
  const relevantDecks = ALL_DECKS.filter((d) => (DECK_MAP[type!] ?? [8]).includes(d.id));

  const ROW1_TILES = [
    { id: "decks",    label: "Approvals Overview",                      desc: `${relevantDecks.length} reference document${relevantDecks.length !== 1 ? "s" : ""} and webinar recordings specific to ${approvalType.label} approvals.`, icon: Layers,     color: "#0f62fe", onClick: () => setDeckDrawerOpen(true),   maint: false },
    { id: "process",  label: "Industry Approvals Process Flows",        desc: "Step-by-step approval flow, routing logic, and threshold matrix.",                                                                                          icon: GitBranch,  color: "#009d9a", onClick: () => navigate("/process"),     maint: false },
    { id: "examples", label: "Industry Customer Examples",              desc: "Real-world implementation examples from similar client deployments.",                                                                                       icon: FolderOpen, color: "#525252", onClick: () => setCustomerExamplesOpen(true), maint: false },
    { id: "demo",     label: "Oracle Requisition Approvals Demo [Industry]", desc: "Live demo walkthrough of Oracle Requisition Approvals for industry-specific configurations.",                                                         icon: Video,      color: "#8a3ffc", onClick: () => setMaintenanceOpen(true), maint: true  },
  ];

  return (
    <div style={{ fontFamily: SANS, background: "#f4f4f4", minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ padding: "24px 32px 20px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12, color: "#525252", background: "none", border: "none", cursor: "pointer", fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}14`, border: `1px solid ${color}30`, flexShrink: 0 }}>
            <TypeIcon size={21} style={{ color }} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: "0.09em", marginBottom: 3 }}>{approvalType.category.toUpperCase()} · APPROVAL TYPE</p>
            <h1 style={{ fontSize: 21, fontWeight: 400, color: "#161616", margin: "0 0 5px" }}>{approvalType.label} Approvals</h1>
            <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 520 }}>{approvalType.description}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 14 }}>RESOURCES & TOOLS</p>

        {/* Row 1 — 4 equal tiles */}
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

        {/* Row 2 — Requirements & Process Flow accordion */}
        <div style={{ marginTop: 1 }}>
          <button onClick={() => setDiscoveryOpen((o) => !o)}
            style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: "18px 22px", background: discoveryOpen ? "#edf5ff" : "#ffffff", border: "1px solid #e0e0e0", borderLeft: discoveryOpen ? `3px solid ${color}` : "3px solid transparent", cursor: "pointer", fontFamily: SANS, textAlign: "left", transition: "background 0.15s, border-left-color 0.15s" }}
            onMouseEnter={(e) => { if (!discoveryOpen) e.currentTarget.style.background = "#f4f4f4"; }}
            onMouseLeave={(e) => { if (!discoveryOpen) e.currentTarget.style.background = discoveryOpen ? "#edf5ff" : "#ffffff"; }}>
            <div style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}14`, border: `1px solid ${color}30`, flexShrink: 0 }}>
              <ClipboardList size={17} style={{ color }} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "#161616", margin: "0 0 3px" }}>Requirements &amp; Process Flow</h2>
              <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>Answer KDD requirements then generate your process flow directly from your responses.</p>
              {submittedAt && (
                <p style={{ fontSize: 11, color: "#24a148", margin: "3px 0 0", fontWeight: 500 }}>
                  Submitted · {new Date(submittedAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            <CompletionRing slug={type!} size={40} />
            <ChevronRight size={15} style={{ color: "#8d8d8d", flexShrink: 0, transform: discoveryOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>

          {discoveryOpen && (
            <RequirementsPanel
              typeSlug={type!}
              color={color}
              onWorkflowGenerated={() => setWorkflowExists(Boolean(loadWorkflow(type!)))}
              onSubmittedAtChange={setSubmittedAt}
            />
          )}
        </div>

        {/* Row 3 — Generated workflow tile (only when a workflow exists) */}
        {workflowExists && (
          <WorkflowTile
            slug={type!}
            color={color}
            onOpen={() => { setDiscoveryOpen(true); }}
          />
        )}
      </div>

      {maintenanceOpen        && <MaintenanceModal color={color} onClose={() => setMaintenanceOpen(false)} />}
      {deckDrawerOpen         && <DeckDrawer decks={relevantDecks} color={color} onClose={() => setDeckDrawerOpen(false)} />}
      {customerExamplesOpen   && <CustomerExamplesDrawer color={color} onClose={() => setCustomerExamplesOpen(false)} />}
    </div>
  );
}
