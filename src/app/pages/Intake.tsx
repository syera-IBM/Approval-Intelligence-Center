/**
 * Intake.tsx — Discovery & Requirements
 *
 * Route: /approval/:type/intake
 *
 * Tab "Requirements" = sectioned KDD question form (10 sections + cross-cutting)
 *   • Each question has inputType: yesno / select / text / textarea
 *   • Submit locks the form; Edit unlocks it
 *   • Answers persisted to localStorage: discovery_answers_<slug>
 *
 * Tab "Discovery" = 5-step routing wizard
 *   • Submit locks; Edit unlocks; Build Workflow → navigates to /workflow
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, Download, CheckCircle2, ArrowRight,
  ShoppingCart, FileText, FileSignature, Building2, Search, AlertTriangle,
  DollarSign, Clock, Scale, Zap, FileCheck, AlertCircle,
  ChevronRight, RotateCcw, GitBranch, Edit2, Send, Circle,
} from "lucide-react";
import { utils, writeFile } from "xlsx";
import { APPROVAL_TYPES } from "./Home";
import { getSectionsForType, getQuestionsForType, DiscoveryQuestion } from "../data/discoveryQuestions";
import {
  OtherApproversPanel,
  loadApprovers,
  saveApprovers,
  type OthApprover,
} from "../components/OtherApproversPanel";

const SANS = "'IBM Plex Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// ─────────────────────────────────────────────────────────────────────────────
// Progress ring (large — shown in header)
// ─────────────────────────────────────────────────────────────────────────────
function ProgressRing({ filled, total, size = 72 }: { filled: number; total: number; size?: number }) {
  const pct  = total > 0 ? filled / total : 0;
  const R    = (size / 2) - 6;
  const C    = 2 * Math.PI * R;
  const dash = C * pct;
  const done = pct >= 1;
  const cx   = size / 2;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="#e0e0e0" strokeWidth="5" />
        <circle cx={cx} cy={cx} r={R} fill="none"
          stroke={done ? "#24a148" : "#0f62fe"}
          strokeWidth="5"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dasharray 0.3s ease" }}
        />
        <text x={cx} y={cx + 5} textAnchor="middle" fontSize="13" fontWeight="600"
          fill={done ? "#24a148" : "#0f62fe"} fontFamily={SANS}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "#525252", fontFamily: SANS }}>{filled} / {total} answered</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────
function loadAnswers(type: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`discovery_answers_${type}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch { return {}; }
}
function saveAnswers(type: string, answers: Record<string, string>) {
  localStorage.setItem(`discovery_answers_${type}`, JSON.stringify(answers));
  window.dispatchEvent(new Event("storage"));
}
function loadSubmitted(type: string): boolean {
  return localStorage.getItem(`req_submitted_${type}`) === "true";
}
function setSubmitted(type: string, val: boolean) {
  if (val) localStorage.setItem(`req_submitted_${type}`, "true");
  else localStorage.removeItem(`req_submitted_${type}`);
}
function loadWizAnswers(type: string): WizAnswers | null {
  try { const r = localStorage.getItem(`wiz_answers_${type}`); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveWizAnswers(type: string, a: WizAnswers) {
  localStorage.setItem(`wiz_answers_${type}`, JSON.stringify(a));
}
function loadWizSubmitted(type: string): boolean {
  return localStorage.getItem(`wiz_submitted_${type}`) === "true";
}
function setWizSubmitted(type: string, val: boolean) {
  if (val) localStorage.setItem(`wiz_submitted_${type}`, "true");
  else localStorage.removeItem(`wiz_submitted_${type}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery (routing) wizard types + data
// ─────────────────────────────────────────────────────────────────────────────
type OptionId = string;
interface WizOption  { id: OptionId; label: string; sublabel?: string; icon: React.ElementType; }
interface WizStep    { id: string; question: string; hint?: string; options: WizOption[]; }
interface WizAnswers { procType?: string; valueRange?: string; method?: string; urgency?: string; legalReview?: string; }
export interface WizResult  { riskLevel: "Low"|"Medium"|"High"|"Critical"; approvers: string[]; sla: string; documents: string[]; notes: string[]; }

const STEPS: WizStep[] = [
  { id: "procType", question: "What type of procurement transaction are you initiating?", hint: "Select the transaction type that best matches your scenario.",
    options: [
      { id: "requisition",    label: "Requisition",                sublabel: "Internal purchase request routed through Oracle Fusion", icon: ShoppingCart  },
      { id: "purchase-order", label: "Purchase Order",             sublabel: "Direct PO to a vendor or supplier",                      icon: FileText      },
      { id: "contract",       label: "Contract / Agreement",       sublabel: "Formal contract requiring legal review",                  icon: FileSignature },
      { id: "ica",            label: "Interagency Agreement (ICA)", sublabel: "Agreement between government agencies or departments",   icon: Building2     },
    ],
  },
  { id: "valueRange", question: "What is the estimated transaction value?", hint: "Select the dollar range closest to your transaction amount.",
    options: [
      { id: "under-10k",  label: "Under $10,000",      sublabel: "Micro-purchase threshold",            icon: DollarSign },
      { id: "10k-50k",    label: "$10,000 – $50,000",  sublabel: "Simplified acquisition range",        icon: DollarSign },
      { id: "50k-250k",   label: "$50,001 – $250,000", sublabel: "Formal competitive bidding required", icon: DollarSign },
      { id: "over-250k",  label: "Over $250,000",      sublabel: "CPO / Executive approval required",   icon: DollarSign },
    ],
  },
  { id: "method", question: "What is the procurement method?", hint: "This determines which justification documents are required.",
    options: [
      { id: "competitive",  label: "Competitive Bidding",  sublabel: "Open or sealed bid process",              icon: Search        },
      { id: "sole-source",  label: "Sole Source",          sublabel: "Single vendor justification required",    icon: FileCheck     },
      { id: "cooperative",  label: "Cooperative Contract", sublabel: "Piggybacking on existing contract award", icon: Building2     },
      { id: "emergency",    label: "Emergency Purchase",   sublabel: "Immediate need declaration",              icon: AlertTriangle },
    ],
  },
  { id: "urgency", question: "What is the timeline urgency for this approval?", hint: "Emergency classifications require additional authorization.",
    options: [
      { id: "standard",  label: "Standard",  sublabel: "15 or more business days available", icon: Clock       },
      { id: "expedited", label: "Expedited", sublabel: "5 to 15 business days",              icon: Zap         },
      { id: "emergency", label: "Emergency", sublabel: "Under 5 business days",              icon: AlertCircle },
    ],
  },
  { id: "legalReview", question: "Does this transaction require Legal Counsel review?", hint: "Contracts, ICAs, and sole-source procurements typically require legal review.",
    options: [
      { id: "yes", label: "Yes — Legal review required",    sublabel: "Contract or sole-source justification involved", icon: Scale        },
      { id: "no",  label: "No — Legal review not required", sublabel: "Standard procurement transaction",               icon: CheckCircle2 },
    ],
  },
];

function computeResult(a: WizAnswers): WizResult {
  const { procType, valueRange, method, urgency, legalReview } = a;
  const isEmergency  = method === "emergency" || urgency === "emergency";
  const isSoleSource = method === "sole-source";
  const isContract   = procType === "contract" || procType === "ica";
  const isHighValue  = valueRange === "over-250k";
  const isMidValue   = valueRange === "50k-250k" || isHighValue;
  const needsLegal   = legalReview === "yes" || isSoleSource || isContract;

  const approvers = ["Requesting Manager / Supervisor"];
  if (valueRange !== "under-10k") approvers.push("Department Head");
  if (isMidValue)   approvers.push("Finance Controller");
  if (needsLegal)   approvers.push("Legal Counsel");
  if (isSoleSource) approvers.push("CPO / Procurement Director");
  else if (isContract) { approvers.push("Procurement Director"); if (isHighValue) approvers.push("Chief Financial Officer (CFO)"); }
  else if (isHighValue) approvers.push("CPO / Procurement Director");
  if (isEmergency) approvers.push("Emergency Authorization Officer");
  if (isContract && isHighValue) approvers.push("Board Ratification (post-award)");

  let slaDays = 2;
  if (valueRange === "10k-50k")   slaDays += 1;
  if (valueRange === "50k-250k")  slaDays += 2;
  if (valueRange === "over-250k") slaDays += 3;
  if (needsLegal)   slaDays += 2;
  if (isSoleSource) slaDays += 3;
  if (isContract)   slaDays += 2;

  const sla = urgency === "emergency" ? "24 – 48 hours (emergency track)"
    : urgency === "expedited" ? `${Math.max(3, Math.round(slaDays * 0.6))} – ${Math.round(slaDays * 0.8)} business days (expedited)`
    : `${slaDays} – ${slaDays + 2} business days`;

  const documents = ["Purchase Requisition Form", "Vendor Quote or Bid Documentation"];
  if (isMidValue)  documents.push("Budget Certification / Fund Availability Confirmation");
  if (isSoleSource) { documents.push("Sole-Source Justification Letter"); documents.push("Market Analysis & Evidence of Single Source"); }
  if (isContract || procType === "ica") { documents.push("Draft Contract or MOU"); documents.push("Scope of Work / Statement of Work"); }
  if (procType === "ica")  documents.push("Signed MOU on File with State Central Procurement");
  if (isHighValue) documents.push("Executive Summary for Board Package");
  if (isEmergency) { documents.push("Emergency Declaration Memo"); documents.push("Post-Award Ratification Plan"); }
  if (method === "cooperative") documents.push("Cooperative Contract Piggyback Authorization");

  let riskScore = 0;
  if (isHighValue)     riskScore += 3;
  else if (isMidValue) riskScore += 1;
  if (isSoleSource)    riskScore += 2;
  if (isEmergency)     riskScore += 2;
  if (isContract)      riskScore += 1;

  const riskLevel: WizResult["riskLevel"] = riskScore >= 6 ? "Critical" : riskScore >= 4 ? "High" : riskScore >= 2 ? "Medium" : "Low";

  const notes: string[] = [];
  if (isSoleSource) notes.push("Sole-source justification will be subject to legal scrutiny. Ensure written documentation is complete before submission.");
  if (isEmergency)  notes.push("Emergency procurement requires a post-award ratification memo within 10 business days of purchase.");
  if (procType === "ica") notes.push("ICA routing requires confirmation of a signed MOU on file with State Central Procurement before initiating.");
  if (isHighValue && !isSoleSource) notes.push("Transactions exceeding $250,000 trigger CPO-level review and may require board notification.");

  return { riskLevel, approvers, sla, documents, notes };
}

const RISK_CFG: Record<WizResult["riskLevel"], { color: string; bg: string }> = {
  Low:      { color: "#24a148", bg: "#24a14818" },
  Medium:   { color: "#c17f24", bg: "#f1c21b18" },
  High:     { color: "#ff832b", bg: "#ff832b18" },
  Critical: { color: "#da1e28", bg: "#da1e2818" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Single question input (renders yesno / select / text / textarea)
// ─────────────────────────────────────────────────────────────────────────────
function QuestionInput({
  q, value, onChange, color, readOnly,
}: { q: DiscoveryQuestion; value: string; onChange: (v: string) => void; color: string; readOnly: boolean }) {
  if (q.inputType === "yesno") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {["Yes", "No"].map((opt) => {
          const sel = value === opt;
          return (
            <button key={opt} type="button" disabled={readOnly} onClick={() => onChange(opt)}
              style={{
                padding: "6px 20px", fontSize: 12, fontFamily: SANS, cursor: readOnly ? "default" : "pointer",
                background: sel ? color : "#f4f4f4", color: sel ? "#ffffff" : "#525252",
                border: `1px solid ${sel ? color : "#e0e0e0"}`, opacity: readOnly && !sel ? 0.5 : 1,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.inputType === "select" && q.options) {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {q.options.map((opt) => {
          const sel = value === opt;
          return (
            <button key={opt} type="button" disabled={readOnly} onClick={() => onChange(opt)}
              style={{
                padding: "5px 14px", fontSize: 12, fontFamily: SANS, cursor: readOnly ? "default" : "pointer",
                background: sel ? color : "#f4f4f4", color: sel ? "#ffffff" : "#525252",
                border: `1px solid ${sel ? color : "#e0e0e0"}`, opacity: readOnly && !sel ? 0.5 : 1,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.inputType === "textarea") {
    return (
      <textarea
        value={value} readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{
          width: "100%", padding: "8px 12px", fontSize: 12, color: "#161616",
          background: readOnly ? "#f4f4f4" : "#fafafa",
          border: "1px solid #e0e0e0", borderBottom: `2px solid ${value ? color : "#c6c6c6"}`,
          outline: "none", resize: "vertical", fontFamily: SANS, lineHeight: 1.6,
        }}
        placeholder={readOnly ? "—" : "Type your response…"}
      />
    );
  }
  // text
  return (
    <input
      type="text" value={value} readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 12px", fontSize: 12, color: "#161616",
        background: readOnly ? "#f4f4f4" : "#fafafa",
        border: "1px solid #e0e0e0", borderBottom: `2px solid ${value ? color : "#c6c6c6"}`,
        outline: "none", fontFamily: SANS,
      }}
      placeholder={readOnly ? "—" : "Type your response…"}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Requirements Tab — sectioned KDD form
// ─────────────────────────────────────────────────────────────────────────────
function RequirementsTab({ typeSlug, typeColor }: { typeSlug: string; typeColor: string }) {
  const sections = getSectionsForType(typeSlug);
  const allQuestions = sections.flatMap((s) => s.questions);

  const [answers, setAnswers] = useState<Record<string, string>>(() => loadAnswers(typeSlug));
  const [submitted, setSubmittedState] = useState(() => loadSubmitted(typeSlug));
  const [othApprovers, setOthApprovers] = useState<OthApprover[]>(() => loadApprovers(typeSlug));

  // Persist approvers whenever they change
  useEffect(() => {
    saveApprovers(typeSlug, othApprovers);
  }, [othApprovers, typeSlug]);

  const handleChange = useCallback((id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      saveAnswers(typeSlug, next);
      return next;
    });
  }, [typeSlug]);

  const filledCount = allQuestions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const total = allQuestions.length;

  const handleSubmit = () => {
    setSubmittedState(true);
    setSubmitted(typeSlug, true);
    saveAnswers(typeSlug, answers);
  };

  const handleEdit = () => {
    setSubmittedState(false);
    setSubmitted(typeSlug, false);
  };

  const handleClear = () => {
    if (window.confirm("Clear all saved requirement answers?")) {
      setAnswers({});
      setOthApprovers([]);
      setSubmittedState(false);
      saveAnswers(typeSlug, {});
      setSubmitted(typeSlug, false);
    }
  };

  const handleDownload = () => {
    const rows = allQuestions.map((q) => ({
      "Section": q.section,
      "Question ID": q.id,
      "Question": q.question,
      "Answer": answers[q.id] || "",
    }));
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 12 }, { wch: 80 }, { wch: 60 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Requirements");
    writeFile(wb, `${typeSlug}-requirements-answers.xlsx`);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", scrollbarWidth: "none" }}>
      {/* Status banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
        gap: 12, padding: "10px 32px",
        background: submitted ? "#defbe6" : "#f4f4f4",
        borderBottom: "1px solid #e0e0e0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {submitted
            ? <><CheckCircle2 size={14} style={{ color: "#24a148" }} /><span style={{ fontSize: 12, color: "#198038", fontWeight: 600, fontFamily: SANS }}>Requirements submitted — {filledCount}/{total} answered</span></>
            : <><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#24a148" }} /><span style={{ fontSize: 12, color: "#525252", fontFamily: SANS }}>Auto-saved · {filledCount}/{total} answered</span></>
          }
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {submitted
            ? <button type="button" onClick={handleEdit}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                <Edit2 size={12} /> Edit Responses
              </button>
            : <>
                <button type="button" onClick={handleClear}
                  style={{ padding: "6px 14px", background: "transparent", color: "#da1e28", border: "1px solid #da1e28", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  Clear all
                </button>
                <button type="button" onClick={handleDownload}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#ffffff", color: "#0f62fe", border: "1px solid #0f62fe", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#d0e2ff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                  <Download size={12} /> .xlsx
                </button>
                <button type="button" onClick={handleSubmit}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 18px", background: typeColor, color: "#ffffff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: SANS }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                  <Send size={12} /> Submit Requirements
                </button>
              </>
          }
          {submitted && (
            <button type="button" onClick={handleDownload}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#ffffff", color: "#0f62fe", border: "1px solid #0f62fe", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d0e2ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <Download size={12} /> .xlsx
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>
        {sections.map((sec) => (
          <div key={sec.index}>
            {/* Section heading */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid #e0e0e0" }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: "#8d8d8d" }}>{String(sec.index + 1).padStart(2, "0")}</span>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#161616", margin: 0, fontFamily: SANS }}>{sec.name}</h3>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "#8d8d8d", fontFamily: SANS }}>
                {sec.questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length}/{sec.questions.length}
              </span>
            </div>

            {/* Questions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sec.questions.map((q, qi) => {
                const val = answers[q.id] ?? "";
                const answered = val.trim() !== "";
                return (
                  <div key={q.id}>
                    <div style={{
                      border: "1px solid #e0e0e0",
                      borderLeft: `3px solid ${answered ? typeColor : "#e0e0e0"}`,
                      padding: "14px 18px", background: "#ffffff",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontFamily: MONO, color: "#8d8d8d", flexShrink: 0, marginTop: 1 }}>
                          {q.id}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: q.isGate ? 700 : 500, color: "#161616", margin: "0 0 2px", lineHeight: 1.4 }}>
                            {qi + 1}. {q.question}
                          </p>
                          {q.hint && <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0, lineHeight: 1.4 }}>{q.hint}</p>}
                        </div>
                        <div style={{ flexShrink: 0, marginTop: 1 }}>
                          {answered ? <CheckCircle2 size={13} style={{ color: typeColor }} /> : <Circle size={13} style={{ color: "#c6c6c6" }} />}
                        </div>
                      </div>
                      <QuestionInput q={q} value={val} onChange={(v) => handleChange(q.id, v)} color={typeColor} readOnly={submitted} />
                    </div>

                    {/* Section 10 — show approver builder directly below GATE-OTH when Yes */}
                    {q.id === "GATE-OTH" && val === "Yes" && (
                      <div style={{ marginTop: 12 }}>
                        <OtherApproversPanel
                          color={typeColor}
                          approvers={othApprovers}
                          onApproversChange={setOthApprovers}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom submit */}
        {!submitted && (
          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={handleSubmit}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", background: typeColor, color: "#ffffff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
              <Send size={13} /> Submit Requirements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Discovery Tab — 5-step routing wizard with submit/edit
// ─────────────────────────────────────────────────────────────────────────────
function DiscoveryTab({ typeSlug, typeColor }: { typeSlug: string; typeColor: string }) {
  const navigate = useNavigate();

  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState<WizAnswers>(() => loadWizAnswers(typeSlug) ?? {});
  const [selected, setSelected] = useState<OptionId | null>(null);
  const [result, setResult]     = useState<WizResult | null>(null);
  const [submitted, setSubmittedState] = useState(() => {
    const saved = loadWizAnswers(typeSlug);
    return loadWizSubmitted(typeSlug) && saved !== null;
  });

  const current  = STEPS[step];
  const total    = STEPS.length;
  const progress = (step / total) * 100;

  const handleNext = () => {
    if (!selected) return;
    const next = { ...answers, [current.id]: selected };
    setAnswers(next);
    setSelected(null);
    if (step < total - 1) { setStep((s) => s + 1); }
    else { const r = computeResult(next); setResult(r); }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
    setSelected((answers as Record<string, string>)[STEPS[step - 1].id] ?? null);
  };

  const handleReset = () => {
    setStep(0); setAnswers({}); setSelected(null); setResult(null);
    setSubmittedState(false); setWizSubmitted(typeSlug, false);
    localStorage.removeItem(`wiz_answers_${typeSlug}`);
  };

  const handleSubmit = () => {
    if (!result) return;
    saveWizAnswers(typeSlug, answers);
    setWizSubmitted(typeSlug, true);
    setSubmittedState(true);
  };

  const handleEdit = () => {
    setSubmittedState(false);
    setWizSubmitted(typeSlug, false);
  };

  // Submitted summary view
  if (submitted && result) {
    const risk = RISK_CFG[result.riskLevel];
    return (
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Submitted banner */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "#defbe6", border: "1px solid #a7f0ba" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={14} style={{ color: "#24a148" }} />
            <span style={{ fontSize: 12, color: "#198038", fontWeight: 600, fontFamily: SANS }}>Discovery submitted</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleEdit}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <Edit2 size={11} /> Edit
            </button>
            <button onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#ffffff", color: "#da1e28", border: "1px solid #da1e28", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>
        {renderWizResult(result, typeColor, typeSlug, navigate)}
      </div>
    );
  }

  // Results view (before submit)
  if (result) {
    const risk = RISK_CFG[result.riskLevel];
    return (
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {renderWizResult(result, typeColor, typeSlug, navigate)}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: "1px solid #e0e0e0", paddingTop: 16 }}>
          <button onClick={handleReset}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#fff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 13, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
            <RotateCcw size={12} /> Start Over
          </button>
          <button onClick={handleSubmit}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: typeColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            <Send size={12} /> Submit Discovery
          </button>
          <button onClick={() => navigate(`/approval/${typeSlug}/workflow`, { state: { wizResult: result } })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#0f62fe", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            <GitBranch size={14} /> Build Workflow →
          </button>
        </div>
      </div>
    );
  }

  // Wizard steps view
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column" }}>
      <div style={{ height: 3, background: "#e0e0e0" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: typeColor, transition: "width 0.3s" }} />
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Step sidebar */}
        <div style={{ width: 180, flexShrink: 0, background: "#f4f4f4", borderRight: "1px solid #e0e0e0", padding: "20px 0" }}>
          <p style={{ padding: "0 16px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", textTransform: "uppercase" }}>Steps</p>
          {STEPS.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 16px", position: "relative" }}>
                {i < STEPS.length - 1 && <div style={{ position: "absolute", left: 24, top: 26, bottom: 0, width: 1, background: done ? typeColor : "#e0e0e0" }} />}
                <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, background: done ? typeColor : active ? "#fff" : "#e0e0e0", border: active ? `1px solid ${typeColor}` : done ? "none" : "1px solid #c6c6c6", fontSize: 9, fontWeight: 700, fontFamily: MONO, color: done ? "#fff" : active ? typeColor : "#8d8d8d", zIndex: 1 }}>
                  {done ? <CheckCircle2 size={9} /> : String(i + 1)}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? "#161616" : done ? "#525252" : "#8d8d8d", margin: 0, lineHeight: 1.3 }}>Step {i + 1}</p>
                  <p style={{ fontSize: 10, color: "#8d8d8d", margin: "1px 0 0", lineHeight: 1.2 }}>{s.question.split(" ").slice(0, 4).join(" ")}…</p>
                </div>
              </div>
            );
          })}
        </div>
        {/* Main area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", scrollbarWidth: "none" }}>
          <div style={{ maxWidth: 560 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: typeColor, marginBottom: 6, textTransform: "uppercase" }}>Step {step + 1} of {total}</p>
            <h2 style={{ fontSize: 20, fontWeight: 300, color: "#161616", margin: "0 0 4px", lineHeight: 1.3 }}>{current.question}</h2>
            {current.hint && <p style={{ fontSize: 12, color: "#525252", margin: "0 0 20px" }}>{current.hint}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#e0e0e0" }}>
              {current.options.map((opt) => {
                const Icon = opt.icon;
                const isSel = selected === opt.id;
                return (
                  <button key={opt.id} onClick={() => setSelected(opt.id)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", textAlign: "left", background: isSel ? "#edf5ff" : "#fff", borderLeft: isSel ? `3px solid ${typeColor}` : "3px solid transparent", border: "none", cursor: "pointer", fontFamily: SANS }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#f4f4f4"; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "#fff"; }}>
                    <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: isSel ? "#d0e2ff" : "#f4f4f4", flexShrink: 0 }}>
                      <Icon size={16} style={{ color: isSel ? typeColor : "#525252" }} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: isSel ? typeColor : "#161616", margin: 0 }}>{opt.label}</p>
                      {opt.sublabel && <p style={{ fontSize: 11, color: "#525252", margin: "1px 0 0" }}>{opt.sublabel}</p>}
                    </div>
                    <div style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", background: isSel ? typeColor : "#fff", border: isSel ? "none" : "1px solid #c6c6c6", flexShrink: 0 }}>
                      {isSel && <CheckCircle2 size={11} color="#fff" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={handleBack} disabled={step === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#fff", color: step === 0 ? "#c6c6c6" : "#161616", border: "1px solid #e0e0e0", cursor: step === 0 ? "default" : "pointer", fontSize: 12, fontFamily: SANS }}>
                <ArrowLeft size={12} /> Back
              </button>
              <button onClick={handleNext} disabled={!selected}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: selected ? typeColor : "#e0e0e0", color: selected ? "#fff" : "#8d8d8d", border: "none", cursor: selected ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 500, fontFamily: SANS }}
                onMouseEnter={(e) => { if (selected) e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                {step === total - 1 ? "Generate Results" : "Next"} <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared wizard result renderer
// ─────────────────────────────────────────────────────────────────────────────
function renderWizResult(result: WizResult, typeColor: string, typeSlug: string, navigate: ReturnType<typeof useNavigate>) {
  const risk = RISK_CFG[result.riskLevel];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#e0e0e0" }}>
        <div style={{ padding: "18px 20px", background: "#f4f4f4" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 10, textTransform: "uppercase" }}>Risk Classification</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ padding: "3px 10px", fontSize: 12, fontWeight: 600, background: risk.bg, color: risk.color, border: `1px solid ${risk.color}44` }}>{result.riskLevel}</span>
            <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>
              {result.riskLevel === "Low" && "Standard routing, no escalation."}
              {result.riskLevel === "Medium" && "Department-level sign-off required."}
              {result.riskLevel === "High" && "Executive review and documentation required."}
              {result.riskLevel === "Critical" && "Immediate escalation to CPO and legal."}
            </p>
          </div>
        </div>
        <div style={{ padding: "18px 20px", background: "#f4f4f4" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 10, textTransform: "uppercase" }}>Estimated SLA</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#161616", fontFamily: MONO, margin: "0 0 3px" }}>{result.sla}</p>
          <p style={{ fontSize: 11, color: "#525252", margin: 0 }}>From submission to final approval</p>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 10, textTransform: "uppercase" }}>Required Approval Chain</p>
        <div style={{ borderLeft: "2px solid #0f62fe", marginLeft: 12 }}>
          {result.approvers.map((ap, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 8px 20px", position: "relative" }}>
              <div style={{ position: "absolute", left: -8, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                <div style={{ width: 7, height: 7, background: i === 0 ? "#0f62fe" : "#c6c6c6" }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: MONO, color: "#8d8d8d", minWidth: 20 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 13, color: "#161616", flex: 1 }}>{ap}</span>
              {i < result.approvers.length - 1 && <ChevronRight size={11} style={{ color: "#c6c6c6" }} />}
              {i === 0 && <span style={{ fontSize: 10, padding: "2px 6px", background: "#d0e2ff", color: "#0f62fe", fontWeight: 600 }}>Initiator</span>}
              {i === result.approvers.length - 1 && <span style={{ fontSize: 10, padding: "2px 6px", background: "#a7f0ba", color: "#198038", fontWeight: 600 }}>Final</span>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 10, textTransform: "uppercase" }}>Required Documents</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1, background: "#e0e0e0" }}>
          {result.documents.map((doc, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: "#ffffff" }}>
              <CheckCircle2 size={13} style={{ color: "#24a148", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#161616" }}>{doc}</span>
            </div>
          ))}
        </div>
      </div>
      {result.notes.length > 0 && (
        <div style={{ border: "1px solid #e0e0e0" }}>
          {result.notes.map((note, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", borderBottom: i < result.notes.length - 1 ? "1px solid #e0e0e0" : "none", background: "#fdf6dd" }}>
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1, color: "#f1c21b" }} />
              <p style={{ fontSize: 12, color: "#161616", lineHeight: 1.6, margin: 0 }}>{note}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ paddingTop: 8 }}>
        <button onClick={() => navigate(`/approval/${typeSlug}/workflow`, { state: { wizResult: result } })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: typeColor, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: SANS }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
          <GitBranch size={14} /> Build Workflow →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Intake page
// ─────────────────────────────────────────────────────────────────────────────
export default function Intake() {
  const { type }    = useParams<{ type: string }>();
  const navigate    = useNavigate();
  const location    = useLocation();
  const initTab = (location.state as { activeTab?: "discovery" | "requirements" } | null)?.activeTab ?? "requirements";
  const [activeTab, setActiveTab] = useState<"discovery" | "requirements">(initTab);

  const approvalType = APPROVAL_TYPES.find((t) => t.slug === type);
  const questions    = getQuestionsForType(type ?? "");

  const [, forceRender] = useState(0);
  useEffect(() => {
    const h = () => forceRender((n) => n + 1);
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);
  const discAnswers  = loadAnswers(type ?? "");
  const filledCount  = questions.filter((q) => (discAnswers[q.id] ?? "").trim() !== "").length;

  if (!approvalType) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Approval type not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back to home</button>
      </div>
    );
  }

  const { color, colorLight, label } = approvalType;
  const TypeIcon = approvalType.icon;

  return (
    <div style={{ fontFamily: SANS, background: "#ffffff", minHeight: "100%", display: "flex", flexDirection: "column" }}>

      {/* ── Page header ── */}
      <div style={{ padding: "24px 32px 16px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <button onClick={() => navigate(`/approval/${type}`)}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "#525252", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}>
            <ArrowLeft size={13} /> Back to {label}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: colorLight, flexShrink: 0 }}>
              <TypeIcon size={20} style={{ color }} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color, marginBottom: 2, textTransform: "uppercase" }}>{label} · Intake</p>
              <h1 style={{ fontSize: 20, fontWeight: 300, color: "#161616", margin: 0 }}>Discovery & Requirements</h1>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, paddingTop: 24 }}>
          <ProgressRing filled={filledCount} total={questions.length} size={80} />
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", background: "#fafafa", flexShrink: 0 }}>
        {(["requirements", "discovery"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const tabLabel = tab === "requirements" ? "Requirements" : "Discovery";
          const reqSubmitted = tab === "requirements" && loadSubmitted(type ?? "");
          const wizSubmitted = tab === "discovery" && loadWizSubmitted(type ?? "");
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "11px 24px", fontSize: 13, fontFamily: SANS, cursor: "pointer",
                background: "transparent", border: "none",
                borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                color: isActive ? color : "#525252", fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "#161616"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "#525252"; }}>
              {tabLabel}
              {(reqSubmitted || wizSubmitted) && (
                <CheckCircle2 size={11} style={{ color: "#24a148", marginLeft: 6, verticalAlign: "middle" }} />
              )}
              {tab === "requirements" && filledCount > 0 && !reqSubmitted && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: "1px 5px", background: filledCount === questions.length ? "#a7f0ba" : "#d0e2ff", color: filledCount === questions.length ? "#198038" : "#0f62fe" }}>
                  {filledCount}/{questions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto" }}>
        {activeTab === "requirements"
          ? <RequirementsTab typeSlug={type!} typeColor={color} />
          : <DiscoveryTab   typeSlug={type!} typeColor={color} />
        }
      </div>
    </div>
  );
}
