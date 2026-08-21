import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Layers, GitBranch, Video, FolderOpen, ArrowRight, ExternalLink,
  Wrench, X, ArrowLeft, ClipboardList,
  ShoppingCart, FileText, FileSignature, Building2, Search, AlertTriangle,
  CheckCircle2, AlertCircle,
  ChevronRight, RotateCcw, Download, Circle, GripVertical, Pencil, Trash2,
  RefreshCw, CheckCheck, Lock, LockOpen,
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
            <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>{CUSTOMER_EXAMPLES_DECKS.length} document{CUSTOMER_EXAMPLES_DECKS.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} style={{ color: "#525252" }} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          <div style={{ padding: "10px 24px 6px", fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
            DOCUMENTS
          </div>
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
  const [activeTab, setActiveTab]       = useState<"requirements" | "workflow">(wf ? "workflow" : "requirements");

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
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 18px", background: "transparent", border: "none", borderBottom: isActive ? `2px solid ${tab.id === "workflow" ? "#24a148" : color}` : "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? (tab.id === "workflow" ? "#24a148" : color) : "#525252", fontFamily: SANS, transition: "color 0.15s" }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.color = "#161616"; }}
              onMouseOut={(e)  => { if (!isActive) e.currentTarget.style.color = "#525252"; }}>
              <Icon size={13} strokeWidth={isActive ? 2 : 1.5} />
              {tab.label}
              {tab.id === "requirements" && submitted && <CheckCheck size={12} style={{ color: "#24a148" }} />}
            </button>
          );
        })}
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
