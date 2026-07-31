/**
 * WorkflowBuilder.tsx
 *
 * Route: /approval/:type/workflow
 * Receives `location.state.wizResult` (WizResult) from the Intake page OR loads from localStorage.
 *
 * Features:
 *  - Builds process flow from both wizard answers AND KDD requirements answers
 *  - Drag-and-drop step reordering (HTML5 drag API — no extra deps)
 *  - Inline step editing (title, actor, action, SLA, notes)
 *  - Delete individual steps
 *  - Delete report (removes localStorage entry, navigates back)
 *  - Regenerate (navigates to intake Discovery tab)
 *  - Download 4-sheet .xlsx
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, Download, CheckCircle2, Clock, AlertCircle, GitBranch,
  FileText, Info, RotateCcw, Trash2, Edit2, GripVertical, X, Save,
} from "lucide-react";
import { utils, writeFile } from "xlsx";
import { APPROVAL_TYPES } from "./Home";
import { loadWorkflowResult, saveWorkflowResult } from "./WorkflowBuilder.helpers";

export { loadWorkflowResult, saveWorkflowResult };

const SANS = "'IBM Plex Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface WizResult {
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  approvers: string[];
  sla: string;
  documents: string[];
  notes: string[];
}

export interface WorkflowStep {
  id: string;          // stable uuid-like key for drag
  phase: string;
  stepNum: number;
  title: string;
  actor: string;
  action: string;
  system: string;
  sla: string;
  deckSource: string;
  notes: string;
  status: "start" | "auto" | "human" | "legal" | "executive" | "complete";
}

// ─────────────────────────────────────────────────────────────────────────────
// Deck knowledge
// ─────────────────────────────────────────────────────────────────────────────
const DECK_KNOWLEDGE = {
  commonDesign: {
    bpmConfig:   "Configure approval rules in Oracle BPM/AMX using Approval Management Extension (AMX). Route rules reference job-level hierarchy (supervisory chain) or cost-center-owner as primary approver.",
    delegation:  "Vacation/delegation rules must be configured before go-live. Oracle Fusion supports automatic reassignment via absence management integration.",
    escalation:  "Set timeout escalation to auto-approve or escalate after SLA breach. Recommend 24-hour reminder notifications via BIP alerts.",
    fyi:         "FYI notifications (informational, no action required) should be configured for CPO/CFO visibility on high-value transactions.",
  },
  clientPatterns: [
    { client: "SWBNO",  pattern: "Cost center owner as first approver. Department Director for amounts > $25,000. Executive Director for amounts > $100,000. Board ratification for > $500,000." },
    { client: "MCPS",   pattern: "Position-based routing via supervisory hierarchy. Finance pre-encumbrance check before approval routing. Budget controller review for all requisitions > $50,000." },
    { client: "BCPSS",  pattern: "School principal approval for site-based budgets < $10,000. Chief of Staff approval for district-wide spend > $100,000. Board approval for contracts > $250,000." },
    { client: "COD",    pattern: "Dual approval required for all contracts. Legal review mandatory for all contract types. City Council ratification for any contract > $1,000,000." },
    { client: "LCPS",   pattern: "5-level hierarchy: Program Manager → F/A Manager (7xxxx accounts) → Budget Director (Fixed Assets > $5,000) → Cabinet (> $100,000) → Buyers Group (all)." },
  ],
  icaRules: "ICA transactions require: 1) Verified signed MOU on file. 2) Agency procurement lead approval. 3) Receiving agency head sign-off. 4) State central procurement concurrence.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Build workflow steps
// ─────────────────────────────────────────────────────────────────────────────
let _stepCounter = 0;
function mkStep(partial: Omit<WorkflowStep, "id">): WorkflowStep {
  return { ...partial, id: `step-${++_stepCounter}-${Date.now()}` };
}

function buildWorkflow(result: WizResult, typeSlug: string, reqAnswers: Record<string, string>): WorkflowStep[] {
  _stepCounter = 0;
  const steps: WorkflowStep[] = [];
  let n = 1;

  // Look for Gatekeeper answer from requirements
  const gkRequired = reqAnswers["GK-001"]?.toLowerCase() === "yes";
  const gkBeforeAll = reqAnswers["GK-006"] === "Yes";

  // Phase 1 — Initiation
  steps.push(mkStep({
    phase: "Initiation", stepNum: n++,
    title: "Requisition / Transaction Created",
    actor: "Requester",
    action: "Submit transaction in Oracle Fusion with all required fields: line items, cost center, category, amount, and justification notes.",
    system: "Oracle Fusion Procurement",
    sla: "N/A — initiating event",
    deckSource: "Common Design CD.05b §3.1; EDM.335 SWBNO §2",
    notes: "Ensure all required DFF fields are populated before submission. Missing data will cause routing to fail.",
    status: "start",
  }));

  // Gatekeeper (if configured in requirements)
  if (gkRequired && gkBeforeAll) {
    const gkValidates = reqAnswers["GK-011"] || "Charge Account, Supplier, Contract, Price, Quantity, Budget Availability";
    steps.push(mkStep({
      phase: "Gatekeeper Review", stepNum: n++,
      title: "Gatekeeper Validation",
      actor: reqAnswers["GK-007"] ? `Gatekeeper (${reqAnswers["GK-007"].split("\n")[0]})` : "Gatekeeper",
      action: `Validate requisition data quality before downstream approvals. Check: ${gkValidates}.`,
      system: "Oracle Fusion Worklist",
      sla: "1 business day",
      deckSource: "Common Design CD.05b §Gatekeeper; Requirements GK-001",
      notes: reqAnswers["GK-012"] === "Edit only" ? "Gatekeeper may edit but not approve/reject."
        : reqAnswers["GK-012"] === "Approve/Reject only" ? "Gatekeeper approves or rejects — cannot edit lines."
        : "Gatekeeper may edit, approve, or reject. Return for correction enabled.",
      status: "human",
    }));
  }

  // Phase 2 — Pre-approval checks
  steps.push(mkStep({
    phase: "Pre-Approval", stepNum: n++,
    title: "Funds / Budget Availability Check",
    actor: "System (Auto)",
    action: "Oracle Fusion automatically validates encumbrance and budget availability. Transaction is held if funds check fails.",
    system: "Oracle Fusion Budgetary Control",
    sla: "Automatic — real-time",
    deckSource: "Common Design CD.05b §4; MCPS EDM 320 §Budget Check",
    notes: reqAnswers["CCM-008"] ? `Cost Center threshold note: ${reqAnswers["CCM-008"]}` : "MCPS pattern: pre-encumbrance check runs before routing.",
    status: "auto",
  }));

  // Supervisor approval (if configured)
  const supRequired = reqAnswers["SUP-004"]?.toLowerCase() !== "no";
  if (supRequired) {
    steps.push(mkStep({
      phase: "Approval", stepNum: n++,
      title: "Level 1 — Supervisor Approval",
      actor: reqAnswers["SUP-001"]?.toLowerCase() === "yes" ? "Supervisor (Oracle HCM Hierarchy)" : "Supervisor / Manager",
      action: "Validate business need and necessity of the purchase. Confirm budget owner alignment.",
      system: "Oracle Fusion Worklist / Oracle BPM",
      sla: reqAnswers["SUP-009"] ? `Escalate after ${reqAnswers["SUP-009"]} days` : "1–2 business days",
      deckSource: "Common Design CD.05b §5; Supervisor Approval SUP-001",
      notes: reqAnswers["SUP-002"] ? `No-manager scenario: ${reqAnswers["SUP-002"]}` : DECK_KNOWLEDGE.commonDesign.delegation,
      status: "human",
    }));
  }

  // Phase 3 — Main approval chain from discovery wizard
  result.approvers.forEach((approver, i) => {
    if (i === 0 && supRequired) return; // supervisor already added
    const isLegal  = approver.toLowerCase().includes("legal");
    const isExec   = approver.toLowerCase().includes("cpo") || approver.toLowerCase().includes("cfo") || approver.toLowerCase().includes("director");
    const isBoard  = approver.toLowerCase().includes("board");
    const isCC     = approver.toLowerCase().includes("finance") || approver.toLowerCase().includes("controller");

    let deckSource = "Common Design CD.05b §5";
    if (isLegal) deckSource = "COD Contract Approvals v1 §Legal; COD Contract Approval Requirements";
    if (isExec)  deckSource = "EDM.335 SWBNO §Executive Approval; Common Design CD.05b §6";
    if (isBoard) deckSource = "COD Contract Approval Requirements §Board Ratification; BCPSS EDM 320 §Board";
    if (isCC)    deckSource = "MCPS EDM 320 §Budget Check; Common Design CD.05b §Finance";

    let action = `Review and approve the transaction. Verify ${i === 0 ? "department budget, compliance, and categorization" : "prior approvals, documentation, and value justification"}.`;
    if (isLegal) action = "Review transaction for legal compliance, contract terms, sole-source justification, or ICA MOU requirements.";
    if (isBoard) action = "Board agenda item submission. Review during scheduled session. Resolution and minutes required.";

    // Inject cost-center note if CCM answers exist
    let notes = isCC && reqAnswers["CCM-008"]
      ? `Threshold: ${reqAnswers["CCM-008"]}. ${DECK_KNOWLEDGE.commonDesign.fyi}`
      : isLegal ? DECK_KNOWLEDGE.commonDesign.delegation
      : isExec  ? DECK_KNOWLEDGE.commonDesign.fyi
      : isBoard ? "Post-award ratification is an option for emergency procurements."
      : "Approver should review all attached documentation and prior-level comments.";

    steps.push(mkStep({
      phase: "Approval", stepNum: n++,
      title: `Level ${i + 1} — ${approver}`,
      actor: approver, action, system: "Oracle Fusion Worklist / Oracle BPM",
      sla: isBoard ? "10–14 business days (board cycle)" : isLegal ? "3–5 business days" : isExec ? "2–3 business days" : "1–2 business days",
      deckSource, notes,
      status: isBoard ? "executive" : isLegal ? "legal" : isExec ? "executive" : isCC ? "human" : "human",
    }));
  });

  // Project Manager approval (if configured)
  if (reqAnswers["PM-003"] && reqAnswers["PM-003"].trim()) {
    steps.push(mkStep({
      phase: "Project Review", stepNum: n++,
      title: "Project Manager Approval",
      actor: reqAnswers["PM-002"] ? `Project Manager (${reqAnswers["PM-002"].split("\n")[0]})` : "Project Manager",
      action: `Verify project budget and expenditure type compliance. ${reqAnswers["PM-003"]}`,
      system: "Oracle Fusion Projects / Worklist",
      sla: "1–2 business days",
      deckSource: "Common Design CD.05b §Projects; Requirements PM-003",
      notes: reqAnswers["PM-006"]?.toLowerCase() === "yes" ? "Must verify remaining project budget before approval." : "Review project coding and expenditure type.",
      status: "human",
    }));
  }

  // Grant approval (if configured)
  if (reqAnswers["GR-001"] && reqAnswers["GR-001"].trim()) {
    steps.push(mkStep({
      phase: "Grant Compliance", stepNum: n++,
      title: "Grant Approver Validation",
      actor: reqAnswers["GR-003"]?.toLowerCase() === "yes" ? "Grant PI / Principal Investigator" : "Grant Approver",
      action: `Validate grant allowability, period of performance, and sponsor restrictions. ${reqAnswers["GR-004"] || ""}`,
      system: "Oracle Fusion Grants / Worklist",
      sla: "2–3 business days",
      deckSource: "Common Design CD.05b §Grants; Requirements GR-001",
      notes: reqAnswers["GR-005"]?.toLowerCase() === "yes" ? "Additional grant documentation required." : "Standard grant compliance review.",
      status: "legal",
    }));
  }

  // ICA-specific step
  if (typeSlug === "ica") {
    steps.push(mkStep({
      phase: "ICA Compliance", stepNum: n++,
      title: "State Central Procurement Concurrence",
      actor: "State Central Procurement Office",
      action: "Verify MOU is on file. Confirm interagency routing meets SLED ICA framework requirements (KDD REQ-APP-001 through REQ-APP-009).",
      system: "Oracle Fusion / External State System",
      sla: "3–7 business days",
      deckSource: "Oracle SLED Req Approval ICA Training Framework; Common Design CD.05b §ICA",
      notes: DECK_KNOWLEDGE.icaRules,
      status: "legal",
    }));
  }

  // Buyer approval (if configured)
  if (reqAnswers["BUY-003"]?.toLowerCase() === "yes") {
    steps.push(mkStep({
      phase: "Buyer Review", stepNum: n++,
      title: "Buyer Review & PO Creation",
      actor: reqAnswers["BUY-001"] ? `Buyer (${reqAnswers["BUY-001"].split("\n")[0]})` : "Procurement Buyer",
      action: `Validate supplier, contract, pricing, and competitive bidding compliance before PO creation. ${reqAnswers["BUY-004"] || ""}`,
      system: "Oracle Fusion Purchasing",
      sla: "1–2 business days",
      deckSource: "Common Design CD.05b §Buyer; Requirements BUY-001",
      notes: reqAnswers["BUY-007"]?.toLowerCase() === "yes" ? "Emergency purchases bypass Buyer review." : "Buyer confirms sourcing strategy compliance.",
      status: "human",
    }));
  }

  // Phase 5 — Post-approval
  steps.push(mkStep({
    phase: "Post-Approval", stepNum: n++,
    title: "Purchase Order Auto-Generation",
    actor: "System (Auto)",
    action: "Oracle Fusion automatically generates the Purchase Order and transmits to supplier if auto-PO rules are configured (KDD REQ-APP-012).",
    system: "Oracle Fusion Purchasing",
    sla: "Automatic — within 1 business day",
    deckSource: "Common Design CD.05b §Auto-PO; EDM.335 SWBNO §PO Generation",
    notes: "Configure auto-PO criteria: contract type, supplier setup, buyer assignment.",
    status: "auto",
  }));

  steps.push(mkStep({
    phase: "Post-Approval", stepNum: n++,
    title: "Supplier Notification & Acknowledgment",
    actor: "Buyer / Oracle System",
    action: "Approved PO transmitted to supplier. Three-way match (PO–Receipt–Invoice) enabled for payment.",
    system: "Oracle Fusion Supplier Portal / iSP",
    sla: "Per supplier agreement",
    deckSource: "Common Design CD.05b §Supplier; COD Contract Approvals §Notification",
    notes: "SWBNO pattern: supplier must acknowledge within 5 business days or PO is flagged for buyer review.",
    status: "complete",
  }));

  // Emergency ratification
  if (result.notes.some((note) => note.toLowerCase().includes("emergency"))) {
    steps.push(mkStep({
      phase: "Ratification", stepNum: n++,
      title: "Post-Award Ratification",
      actor: "CPO / Procurement Director",
      action: "Within 10 business days, submit ratification memo with full documentation through standard approval chain.",
      system: "Oracle Fusion / Document Management",
      sla: "Within 10 business days of purchase",
      deckSource: "Common Design CD.05b §Emergency; EDM.335 SWBNO §Emergency Procurement",
      notes: reqAnswers["DOA-012"]?.toLowerCase() === "yes" ? "Emergency DOA thresholds apply separately." : "Emergency Declaration Memo must be attached.",
      status: "legal",
    }));
  }

  // Renumber steps sequentially
  steps.forEach((s, i) => { s.stepNum = i + 1; });
  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// Download workflow to Excel
// ─────────────────────────────────────────────────────────────────────────────
function downloadWorkflow(steps: WorkflowStep[], result: WizResult, typeSlug: string) {
  const wb = utils.book_new();

  const stepRows = steps.map((s) => ({
    "Phase":         s.phase,
    "Step #":        s.stepNum,
    "Step Title":    s.title,
    "Actor / Owner": s.actor,
    "Action":        s.action,
    "System":        s.system,
    "SLA":           s.sla,
    "Deck Source":   s.deckSource,
    "Notes":         s.notes,
  }));
  const ws1 = utils.json_to_sheet(stepRows);
  ws1["!cols"] = [{ wch: 16 }, { wch: 7 }, { wch: 36 }, { wch: 30 }, { wch: 80 }, { wch: 30 }, { wch: 28 }, { wch: 50 }, { wch: 70 }];
  utils.book_append_sheet(wb, ws1, "Process Flow");

  const chainWs = utils.json_to_sheet(result.approvers.map((ap, i) => ({
    "Level": i + 1, "Approver": ap, "Role": i === 0 ? "Initiating" : i === result.approvers.length - 1 ? "Final" : "Intermediate", "SLA": result.sla,
  })));
  chainWs["!cols"] = [{ wch: 8 }, { wch: 36 }, { wch: 24 }, { wch: 28 }];
  utils.book_append_sheet(wb, chainWs, "Approval Chain");

  const docWs = utils.json_to_sheet(result.documents.map((doc, i) => ({ "#": i + 1, "Document": doc, "Required": "Yes" })));
  docWs["!cols"] = [{ wch: 5 }, { wch: 60 }, { wch: 10 }];
  utils.book_append_sheet(wb, docWs, "Required Documents");

  const sumWs = utils.json_to_sheet([
    { Field: "Approval Type", Value: typeSlug },
    { Field: "Risk Level",    Value: result.riskLevel },
    { Field: "Estimated SLA", Value: result.sla },
    { Field: "Total Approvers", Value: result.approvers.length },
    { Field: "Total Workflow Steps", Value: steps.length },
    { Field: "Generated", Value: new Date().toLocaleString() },
  ]);
  sumWs["!cols"] = [{ wch: 24 }, { wch: 60 }];
  utils.book_append_sheet(wb, sumWs, "Summary");

  writeFile(wb, `${typeSlug}-approval-workflow.xlsx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Status chip config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<WorkflowStep["status"], { label: string; color: string; bg: string }> = {
  start:     { label: "Initiation",    color: "#0f62fe", bg: "#d0e2ff" },
  auto:      { label: "Automated",     color: "#009d9a", bg: "#9ef0f0" },
  human:     { label: "Human Approval", color: "#525252", bg: "#e0e0e0" },
  legal:     { label: "Legal Review",  color: "#8a3ffc", bg: "#e8daff" },
  executive: { label: "Executive",     color: "#ba4e00", bg: "#ffd9be" },
  complete:  { label: "Completion",    color: "#24a148", bg: "#a7f0ba" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inline step editor
// ─────────────────────────────────────────────────────────────────────────────
function StepEditor({
  step, onSave, onCancel,
}: { step: WorkflowStep; onSave: (updated: WorkflowStep) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState({ ...step });
  const field = (key: keyof WorkflowStep, label: string, rows = 1) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "#8d8d8d", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: SANS }}>{label}</label>
      {rows > 1
        ? <textarea rows={rows} value={String(draft[key])}
            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
            style={{ padding: "6px 10px", fontSize: 12, color: "#161616", background: "#fafafa", border: "1px solid #e0e0e0", borderBottom: "2px solid #0f62fe", outline: "none", resize: "vertical", fontFamily: SANS, lineHeight: 1.5 }} />
        : <input type="text" value={String(draft[key])}
            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
            style={{ padding: "6px 10px", fontSize: 12, color: "#161616", background: "#fafafa", border: "1px solid #e0e0e0", borderBottom: "2px solid #0f62fe", outline: "none", fontFamily: SANS }} />
      }
    </div>
  );
  return (
    <div style={{ padding: "16px 20px", background: "#fafafa", border: "1px solid #0f62fe", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("title",  "Step Title")}
        {field("actor",  "Actor / Owner")}
        {field("sla",    "SLA")}
        {field("system", "System")}
      </div>
      {field("action", "Action / Description", 3)}
      {field("notes",  "Implementation Notes", 2)}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel}
          style={{ padding: "6px 16px", background: "#ffffff", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
          Cancel
        </button>
        <button onClick={() => onSave(draft)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "#0f62fe", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
          <Save size={12} /> Save Step
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkflowBuilder component
// ─────────────────────────────────────────────────────────────────────────────
export default function WorkflowBuilder() {
  const { type }   = useParams<{ type: string }>();
  const navigate   = useNavigate();
  const location   = useLocation();

  const stateResult = (location.state as { wizResult?: WizResult } | null)?.wizResult ?? null;
  const stored      = loadWorkflowResult(type ?? "");
  const wizResult   = stateResult ?? stored?.result ?? null;

  // Load KDD requirements answers from localStorage
  const reqAnswers: Record<string, string> = (() => {
    try {
      const raw = localStorage.getItem(`discovery_answers_${type}`);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  useEffect(() => {
    if (stateResult && type) saveWorkflowResult(type, stateResult);
  }, [stateResult, type]);

  const approvalType = APPROVAL_TYPES.find((t) => t.slug === type);

  // Steps state — initialised from build, supports drag + edit
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragSrc = useRef<number | null>(null);

  useEffect(() => {
    if (wizResult && type) {
      setSteps(buildWorkflow(wizResult, type, reqAnswers));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizResult, type]);

  if (!approvalType) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Approval type not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back to home</button>
      </div>
    );
  }

  if (!wizResult) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, fontFamily: SANS, padding: 40 }}>
        <GitBranch size={40} style={{ color: "#c6c6c6" }} strokeWidth={1} />
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 400, color: "#161616", margin: "0 0 8px" }}>No discovery data</h2>
          <p style={{ fontSize: 13, color: "#525252", margin: 0 }}>Complete the Discovery wizard first to generate a workflow.</p>
        </div>
        <button onClick={() => navigate(`/approval/${type}/intake`, { state: { activeTab: "discovery" } })}
          style={{ padding: "10px 24px", background: "#0f62fe", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontFamily: SANS }}>
          Go to Discovery →
        </button>
      </div>
    );
  }

  const { color, colorLight, label } = approvalType;
  const TypeIcon  = approvalType.icon;
  const risk      = wizResult.riskLevel;
  const riskColor = risk === "Low" ? "#24a148" : risk === "Medium" ? "#c17f24" : risk === "High" ? "#ff832b" : "#da1e28";

  // Drag handlers
  const onDragStart = (i: number) => { dragSrc.current = i; };
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragSrc.current === null || dragSrc.current === i) return;
    setSteps((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragSrc.current!, 1);
      next.splice(i, 0, item);
      dragSrc.current = i;
      return next.map((s, idx) => ({ ...s, stepNum: idx + 1 }));
    });
  };
  const onDragEnd = () => { dragSrc.current = null; };

  const handleEdit   = (id: string) => setEditingId(id);
  const handleSave   = (updated: WorkflowStep) => { setSteps((prev) => prev.map((s) => s.id === updated.id ? updated : s)); setEditingId(null); };
  const handleDelete = (id: string) => {
    if (window.confirm("Remove this step from the workflow?"))
      setSteps((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, stepNum: i + 1 })));
  };

  const handleDeleteReport = () => {
    if (window.confirm("Delete this workflow report? You can regenerate it from the Discovery tab.")) {
      localStorage.removeItem(`workflow_result_${type}`);
      navigate(`/approval/${type}`);
    }
  };

  return (
    <div style={{ fontFamily: SANS, background: "#ffffff", minHeight: "100%" }}>

      {/* ── Header ── */}
      <div style={{ padding: "24px 40px 20px", borderBottom: "1px solid #e0e0e0" }}>
        <button onClick={() => navigate(`/approval/${type}/intake`)}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, color: "#525252", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}>
          <ArrowLeft size={13} /> Back to Discovery & Requirements
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: colorLight, flexShrink: 0 }}>
              <TypeIcon size={22} style={{ color }} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color, marginBottom: 4, textTransform: "uppercase" }}>{label} · Workflow</p>
              <h1 style={{ fontSize: 24, fontWeight: 300, color: "#161616", margin: "0 0 4px" }}>Approval Process Flow</h1>
              <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>
                {steps.length} steps · Risk: <strong style={{ color: riskColor }}>{risk}</strong> · SLA: {wizResult.sla}
                {Object.keys(reqAnswers).length > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: "#24a148" }}>· KDD requirements applied</span>}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#8d8d8d", fontFamily: MONO }}>drag rows to reorder</span>
            <button onClick={() => navigate(`/approval/${type}/intake`, { state: { activeTab: "discovery" } })}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <RotateCcw size={12} /> Regenerate
            </button>
            <button onClick={handleDeleteReport}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#ffffff", color: "#da1e28", border: "1px solid #da1e28", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={() => downloadWorkflow(steps, wizResult, type!)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", background: "#0f62fe", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
              <Download size={13} /> Download (.xlsx)
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 40px", display: "flex", flexDirection: "column", gap: 28, maxWidth: 920 }}>

        {/* Deck Sources banner */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "#f4f4f4", border: "1px solid #e0e0e0" }}>
          <Info size={13} style={{ color: "#0f62fe", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "#525252", margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: "#161616" }}>Sourced from:</strong>{" "}
            Common Design CD.05b · COD Contract Approvals · EDM.335 SWBNO · EDM 320 MCPS · EDM 320 BCPSS · Oracle SLED ICA Training Framework · Requisition Approval Workflow (LCPS)
            {Object.keys(reqAnswers).length > 0 && " · Your KDD Requirements Answers"}
          </p>
        </div>

        {/* Process flow */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", textTransform: "uppercase", margin: 0 }}>
              Process Flow — {steps.length} Steps
            </p>
            <span style={{ fontSize: 11, color: "#8d8d8d" }}>· Click <Edit2 size={10} style={{ verticalAlign: "middle" }} /> to edit a step</span>
          </div>

          <div style={{ position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", left: 31, top: 24, bottom: 24, width: 2, background: "#e0e0e0", zIndex: 0 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {steps.map((step, i) => {
                const cfg    = STATUS_CFG[step.status];
                const isLast = i === steps.length - 1;
                const isEdit = editingId === step.id;
                return (
                  <div key={step.id}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDragEnd={onDragEnd}
                    style={{ display: "flex", gap: 12, paddingBottom: isLast ? 0 : 16, position: "relative", zIndex: 1, cursor: "grab" }}>
                    {/* Drag handle + step node */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: 2 }}>
                      <GripVertical size={12} style={{ color: "#c6c6c6", marginBottom: 2 }} />
                      <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: cfg.bg, border: `2px solid ${cfg.color}`, zIndex: 2 }}>
                        {step.status === "complete"
                          ? <CheckCircle2 size={18} style={{ color: cfg.color }} strokeWidth={2} />
                          : step.status === "auto"
                          ? <GitBranch size={16} style={{ color: cfg.color }} strokeWidth={1.5} />
                          : step.status === "legal"
                          ? <FileText size={16} style={{ color: cfg.color }} strokeWidth={1.5} />
                          : step.status === "executive"
                          ? <AlertCircle size={16} style={{ color: cfg.color }} strokeWidth={1.5} />
                          : <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: MONO }}>{String(step.stepNum).padStart(2, "0")}</span>
                        }
                      </div>
                    </div>

                    {/* Card */}
                    <div style={{ flex: 1, border: "1px solid #e0e0e0", background: "#ffffff" }}>
                      {isEdit
                        ? <StepEditor step={step} onSave={handleSave} onCancel={() => setEditingId(null)} />
                        : (
                          <div style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#8d8d8d", textTransform: "uppercase" }}>{step.phase}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", padding: "1px 6px", background: cfg.bg, color: cfg.color, textTransform: "uppercase" }}>{cfg.label}</span>
                              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                                <button onClick={() => handleEdit(step.id)} title="Edit step"
                                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#f4f4f4", border: "1px solid #e0e0e0", cursor: "pointer", color: "#525252" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#e0e0e0"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}>
                                  <Edit2 size={11} />
                                </button>
                                <button onClick={() => handleDelete(step.id)} title="Delete step"
                                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "#f4f4f4", border: "1px solid #e0e0e0", cursor: "pointer", color: "#da1e28" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}>
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#161616", margin: "0 0 3px" }}>{step.title}</h3>
                            <p style={{ fontSize: 11, color: "#525252", margin: "0 0 8px" }}>
                              <strong>Actor:</strong> {step.actor} &nbsp;·&nbsp; <strong>System:</strong> {step.system}
                            </p>
                            <p style={{ fontSize: 12, color: "#161616", lineHeight: 1.6, margin: "0 0 8px" }}>{step.action}</p>
                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#525252" }}>
                                <Clock size={10} /> {step.sla}
                              </span>
                              <span style={{ fontSize: 11, color: "#8d8d8d", fontStyle: "italic" }}>Source: {step.deckSource}</span>
                            </div>
                            {step.notes && (
                              <div style={{ marginTop: 8, padding: "6px 10px", background: "#f4f4f4", borderLeft: `2px solid ${cfg.color}` }}>
                                <p style={{ fontSize: 11, color: "#525252", lineHeight: 1.5, margin: 0 }}>
                                  <strong style={{ color: "#161616" }}>Note:</strong> {step.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Client reference patterns */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", marginBottom: 10, textTransform: "uppercase" }}>Client Reference Patterns</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#e0e0e0" }}>
            {DECK_KNOWLEDGE.clientPatterns.map((cp) => (
              <div key={cp.client} style={{ display: "flex", gap: 16, padding: "10px 14px", background: "#ffffff" }}>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: "#0f62fe", minWidth: 48, flexShrink: 0 }}>{cp.client}</span>
                <p style={{ fontSize: 12, color: "#525252", margin: 0, lineHeight: 1.6 }}>{cp.pattern}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BPM guidance */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", marginBottom: 10, textTransform: "uppercase" }}>Oracle BPM / AMX Configuration Guidance</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "#e0e0e0" }}>
            {[
              { label: "BPM Configuration",  value: DECK_KNOWLEDGE.commonDesign.bpmConfig },
              { label: "Delegation Rules",    value: DECK_KNOWLEDGE.commonDesign.delegation },
              { label: "Escalation Policy",   value: DECK_KNOWLEDGE.commonDesign.escalation },
              { label: "FYI Notifications",   value: DECK_KNOWLEDGE.commonDesign.fyi },
            ].map((item) => (
              <div key={item.label} style={{ padding: "12px 14px", background: "#ffffff" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "#0f62fe", textTransform: "uppercase", margin: "0 0 5px" }}>{item.label}</p>
                <p style={{ fontSize: 11, color: "#525252", lineHeight: 1.6, margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom download */}
        <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: "#8d8d8d", margin: 0 }}>
            {steps.length} steps · {[...new Set(steps.map((s) => s.phase))].length} phases · Export includes Process Flow, Approval Chain, Required Documents, Summary.
          </p>
          <button onClick={() => downloadWorkflow(steps, wizResult, type!)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#0f62fe", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
            <Download size={13} /> Download (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}

// Re-export Info for the banner (was imported in old file)
const Info = ({ size, style }: { size: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);
