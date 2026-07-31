import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingCart, FileText, FileSignature, Building2, Search, AlertTriangle,
  DollarSign, Clock, Scale, Zap, CheckCircle2, ArrowRight, ArrowLeft,
  FileCheck, AlertCircle, ChevronRight, RotateCcw, Download,
} from "lucide-react";

type OptionId = string;

interface Option {
  id: OptionId;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
}

interface Step {
  id: string;
  question: string;
  hint?: string;
  options: Option[];
}

interface Answers {
  procType?: string;
  valueRange?: string;
  method?: string;
  urgency?: string;
  legalReview?: string;
}

interface Result {
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  approvers: string[];
  sla: string;
  documents: string[];
  notes: string[];
}

const STEPS: Step[] = [
  {
    id: "procType",
    question: "What type of procurement transaction are you initiating?",
    hint: "Select the transaction type that best matches your scenario.",
    options: [
      { id: "requisition",    label: "Requisition",                sublabel: "Internal purchase request routed through Oracle Fusion", icon: ShoppingCart  },
      { id: "purchase-order", label: "Purchase Order",             sublabel: "Direct PO to a vendor or supplier",                      icon: FileText      },
      { id: "contract",       label: "Contract / Agreement",       sublabel: "Formal contract requiring legal review",                  icon: FileSignature },
      { id: "ica",            label: "Interagency Agreement (ICA)", sublabel: "Agreement between government agencies or departments",   icon: Building2     },
    ],
  },
  {
    id: "valueRange",
    question: "What is the estimated transaction value?",
    hint: "Select the dollar range closest to your transaction amount.",
    options: [
      { id: "under-10k",  label: "Under $10,000",         sublabel: "Micro-purchase threshold",              icon: DollarSign },
      { id: "10k-50k",    label: "$10,000 – $50,000",     sublabel: "Simplified acquisition range",          icon: DollarSign },
      { id: "50k-250k",   label: "$50,001 – $250,000",    sublabel: "Formal competitive bidding required",   icon: DollarSign },
      { id: "over-250k",  label: "Over $250,000",         sublabel: "CPO / Executive approval required",     icon: DollarSign },
    ],
  },
  {
    id: "method",
    question: "What is the procurement method?",
    hint: "This determines which justification documents are required.",
    options: [
      { id: "competitive",  label: "Competitive Bidding",   sublabel: "Open or sealed bid process",              icon: Search        },
      { id: "sole-source",  label: "Sole Source",           sublabel: "Single vendor justification required",    icon: FileCheck     },
      { id: "cooperative",  label: "Cooperative Contract",  sublabel: "Piggybacking on existing contract award", icon: Building2     },
      { id: "emergency",    label: "Emergency Purchase",    sublabel: "Immediate need declaration",              icon: AlertTriangle },
    ],
  },
  {
    id: "urgency",
    question: "What is the timeline urgency for this approval?",
    hint: "Emergency classifications require additional authorization.",
    options: [
      { id: "standard",   label: "Standard",   sublabel: "15 or more business days available", icon: Clock       },
      { id: "expedited",  label: "Expedited",  sublabel: "5 to 15 business days",              icon: Zap         },
      { id: "emergency",  label: "Emergency",  sublabel: "Under 5 business days",              icon: AlertCircle },
    ],
  },
  {
    id: "legalReview",
    question: "Does this transaction require Legal Counsel review?",
    hint: "Contracts, ICAs, and sole-source procurements typically require legal review.",
    options: [
      { id: "yes", label: "Yes — Legal review required",    sublabel: "Contract or sole-source justification involved", icon: Scale        },
      { id: "no",  label: "No — Legal review not required", sublabel: "Standard procurement transaction",               icon: CheckCircle2 },
    ],
  },
];

function computeResult(answers: Answers): Result {
  const { procType, valueRange, method, urgency, legalReview } = answers;
  const isEmergency  = method === "emergency" || urgency === "emergency";
  const isSoleSource = method === "sole-source";
  const isContract   = procType === "contract" || procType === "ica";
  const isHighValue  = valueRange === "over-250k";
  const isMidValue   = valueRange === "50k-250k" || isHighValue;
  const needsLegal   = legalReview === "yes" || isSoleSource || isContract;

  const approvers: string[] = ["Requesting Manager / Supervisor"];
  if (valueRange !== "under-10k") approvers.push("Department Head");
  if (isMidValue)   approvers.push("Finance Controller");
  if (needsLegal)   approvers.push("Legal Counsel");
  if (isSoleSource) approvers.push("CPO / Procurement Director");
  else if (isContract) {
    approvers.push("Procurement Director");
    if (isHighValue) approvers.push("Chief Financial Officer (CFO)");
  } else if (isHighValue) {
    approvers.push("CPO / Procurement Director");
  }
  if (isEmergency) approvers.push("Emergency Authorization Officer");
  if (isContract && isHighValue) approvers.push("Board Ratification (post-award)");

  let slaDays = 2;
  if (valueRange === "10k-50k")   slaDays += 1;
  if (valueRange === "50k-250k")  slaDays += 2;
  if (valueRange === "over-250k") slaDays += 3;
  if (needsLegal)   slaDays += 2;
  if (isSoleSource) slaDays += 3;
  if (isContract)   slaDays += 2;

  let sla: string;
  if (urgency === "emergency") {
    sla = "24 – 48 hours (emergency track)";
  } else if (urgency === "expedited") {
    sla = `${Math.max(3, Math.round(slaDays * 0.6))} – ${Math.round(slaDays * 0.8)} business days (expedited)`;
  } else {
    sla = `${slaDays} – ${slaDays + 2} business days`;
  }

  const documents: string[] = ["Purchase Requisition Form", "Vendor Quote or Bid Documentation"];
  if (isMidValue)  documents.push("Budget Certification / Fund Availability Confirmation");
  if (isSoleSource) { documents.push("Sole-Source Justification Letter"); documents.push("Market Analysis & Evidence of Single Source"); }
  if (isContract || procType === "ica") { documents.push("Draft Contract or Memorandum of Understanding (MOU)"); documents.push("Scope of Work / Statement of Work"); }
  if (procType === "ica")  documents.push("Signed MOU on File with State Central Procurement");
  if (isHighValue) documents.push("Executive Summary for Board Package");
  if (isEmergency) { documents.push("Emergency Declaration Memo"); documents.push("Post-Award Ratification Plan"); }
  if (method === "cooperative") documents.push("Cooperative Contract Piggyback Authorization");

  let riskScore = 0;
  if (isHighValue)    riskScore += 3;
  else if (isMidValue) riskScore += 1;
  if (isSoleSource)   riskScore += 2;
  if (isEmergency)    riskScore += 2;
  if (isContract)     riskScore += 1;

  const riskLevel: Result["riskLevel"] =
    riskScore >= 6 ? "Critical" :
    riskScore >= 4 ? "High" :
    riskScore >= 2 ? "Medium" : "Low";

  const notes: string[] = [];
  if (isSoleSource) notes.push("Sole-source justification will be subject to legal scrutiny. Ensure written documentation is complete before submission.");
  if (isEmergency)  notes.push("Emergency procurement requires a post-award ratification memo within 10 business days of purchase.");
  if (procType === "ica") notes.push("ICA routing requires confirmation of a signed MOU on file with State Central Procurement before initiating.");
  if (isHighValue && !isSoleSource) notes.push("Transactions exceeding $250,000 trigger CPO-level review and may require board notification depending on agency policy.");

  return { riskLevel, approvers, sla, documents, notes };
}

const RISK_CONFIG: Record<Result["riskLevel"], { color: string; bg: string }> = {
  Low:      { color: "#24a148", bg: "#24a14818" },
  Medium:   { color: "#f1c21b", bg: "#f1c21b18" },
  High:     { color: "#ff832b", bg: "#ff832b18" },
  Critical: { color: "#da1e28", bg: "#da1e2818" },
};

const MONO = "'IBM Plex Mono', monospace";
const SANS = "'IBM Plex Sans', sans-serif";

export default function Questionnaire() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers]         = useState<Answers>({});
  const [selected, setSelected]       = useState<OptionId | null>(null);
  const [complete, setComplete]       = useState(false);
  const [result, setResult]           = useState<Result | null>(null);

  const step       = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress   = (currentStep / totalSteps) * 100;

  const handleSelect = (id: OptionId) => setSelected(id);

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [step.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setResult(computeResult(newAnswers));
      setComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) { navigate(-1); return; }
    setCurrentStep((s) => s - 1);
    const prevStepId = STEPS[currentStep - 1].id;
    setSelected((answers as Record<string, string>)[prevStepId] ?? null);
  };

  const handleReset = () => {
    setCurrentStep(0); setAnswers({}); setSelected(null); setComplete(false); setResult(null);
  };

  // ── Results view ─────────────────────────────────────────────────────────────
  if (complete && result) {
    const risk = RISK_CONFIG[result.riskLevel];
    return (
      <div style={{ fontFamily: SANS, background: "#ffffff", minHeight: "100%" }}>
        <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #e0e0e0" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#0f62fe", marginBottom: 4, textTransform: "uppercase" }}>
            Requirements Questionnaire · Results
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 6px" }}>Approval Routing Summary</h1>
          <p style={{ fontSize: 13, color: "#525252", margin: 0 }}>Based on your responses, here is the recommended approval configuration.</p>
        </div>

        <div style={{ padding: "28px 40px", display: "flex", flexDirection: "column", gap: 28, maxWidth: 820 }}>
          {/* Risk + SLA */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#e0e0e0" }}>
            <div style={{ padding: "20px 24px", background: "#f4f4f4" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 12, textTransform: "uppercase" }}>Risk Classification</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ padding: "4px 12px", fontSize: 13, fontWeight: 600, background: risk.bg, color: risk.color, border: `1px solid ${risk.color}44` }}>
                  {result.riskLevel}
                </span>
                <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>
                  {result.riskLevel === "Low"      && "Standard routing, no escalation expected."}
                  {result.riskLevel === "Medium"   && "Requires department-level sign-off."}
                  {result.riskLevel === "High"     && "Executive review and documentation required."}
                  {result.riskLevel === "Critical" && "Immediate escalation to CPO and legal."}
                </p>
              </div>
            </div>
            <div style={{ padding: "20px 24px", background: "#f4f4f4" }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 12, textTransform: "uppercase" }}>Estimated SLA</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#161616", fontFamily: MONO, margin: "0 0 4px" }}>{result.sla}</p>
              <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>From submission to final approval</p>
            </div>
          </div>

          {/* Approval chain */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 12, textTransform: "uppercase" }}>Required Approval Chain</p>
            <div style={{ borderLeft: "2px solid #0f62fe", marginLeft: 12 }}>
              {result.approvers.map((approver, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 0 10px 24px", position: "relative" }}>
                  <div style={{ position: "absolute", left: -9, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
                    <div style={{ width: 8, height: 8, background: i === 0 ? "#0f62fe" : "#c6c6c6" }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: MONO, color: "#8d8d8d", minWidth: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontSize: 13, color: "#161616", flex: 1 }}>{approver}</span>
                  {i < result.approvers.length - 1 && <ChevronRight size={12} style={{ color: "#c6c6c6" }} />}
                  {i === 0 && (
                    <span style={{ fontSize: 10, padding: "2px 7px", background: "#d0e2ff", color: "#0f62fe", fontWeight: 600 }}>Initiator</span>
                  )}
                  {i === result.approvers.length - 1 && (
                    <span style={{ fontSize: 10, padding: "2px 7px", background: "#a7f0ba", color: "#198038", fontWeight: 600 }}>Final</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Required documents */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 12, textTransform: "uppercase" }}>Required Documents</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "#e0e0e0" }}>
              {result.documents.map((doc, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "#ffffff" }}>
                  <CheckCircle2 size={14} style={{ color: "#24a148", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: "#161616" }}>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {result.notes.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", marginBottom: 12, textTransform: "uppercase" }}>Important Notes</p>
              <div style={{ border: "1px solid #e0e0e0" }}>
                {result.notes.map((note, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderBottom: i < result.notes.length - 1 ? "1px solid #e0e0e0" : "none", background: "#fdf6dd" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1, color: "#f1c21b" }} />
                    <p style={{ fontSize: 13, color: "#161616", lineHeight: 1.6, margin: 0 }}>{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
            <button onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <RotateCcw size={13} /> Start Over
            </button>
            <button onClick={() => navigate("/")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#0f62fe", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
              Back to Home <ArrowRight size={13} />
            </button>
            <button onClick={() => window.print()}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "transparent", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginLeft: "auto" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <Download size={13} /> Print Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Questionnaire view ───────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: SANS, background: "#ffffff", minHeight: "100%", display: "flex", flexDirection: "column" }}>

      {/* IBM-style thin progress bar at top */}
      <div style={{ height: 3, background: "#e0e0e0" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#0f62fe", transition: "width 0.3s ease" }} />
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* Left step list */}
        <div style={{ width: 220, flexShrink: 0, background: "#f4f4f4", borderRight: "1px solid #e0e0e0", padding: "24px 0" }}>
          <p style={{ padding: "0 20px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", textTransform: "uppercase" }}>
            Steps
          </p>
          {STEPS.map((s, i) => {
            const done   = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 20px", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", left: 28, top: 28, bottom: 0, width: 1, background: done ? "#0f62fe" : "#e0e0e0" }} />
                )}
                <div style={{
                  width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                  background: done ? "#0f62fe" : active ? "#ffffff" : "#e0e0e0",
                  border: active ? "1px solid #0f62fe" : done ? "none" : "1px solid #c6c6c6",
                  fontSize: 9, fontWeight: 700, fontFamily: MONO, color: done ? "#fff" : active ? "#0f62fe" : "#8d8d8d",
                  zIndex: 1,
                }}>
                  {done ? <CheckCircle2 size={10} /> : String(i + 1)}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#161616" : done ? "#525252" : "#8d8d8d", margin: 0, lineHeight: 1.4 }}>
                    Step {i + 1}
                  </p>
                  <p style={{ fontSize: 11, color: "#8d8d8d", margin: "2px 0 0", lineHeight: 1.3 }}>
                    {s.question.split(" ").slice(0, 5).join(" ")}…
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px", scrollbarWidth: "none" }}>
          <div style={{ maxWidth: 600 }}>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#0f62fe", marginBottom: 8, textTransform: "uppercase" }}>
              Step {currentStep + 1} of {totalSteps}
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 300, color: "#161616", margin: "0 0 6px", lineHeight: 1.3 }}>{step.question}</h2>
            {step.hint && <p style={{ fontSize: 13, color: "#525252", margin: "0 0 24px" }}>{step.hint}</p>}

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#e0e0e0" }}>
              {step.options.map((opt) => {
                const Icon       = opt.icon;
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", textAlign: "left",
                      background: isSelected ? "#edf5ff" : "#ffffff",
                      borderLeft: isSelected ? "3px solid #0f62fe" : "3px solid transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f4f4f4"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#ffffff"; }}
                  >
                    <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "#d0e2ff" : "#f4f4f4", flexShrink: 0 }}>
                      <Icon size={18} style={{ color: isSelected ? "#0f62fe" : "#525252" }} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: isSelected ? "#0f62fe" : "#161616", margin: 0 }}>{opt.label}</p>
                      {opt.sublabel && <p style={{ fontSize: 12, color: "#525252", margin: "2px 0 0" }}>{opt.sublabel}</p>}
                    </div>
                    <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", background: isSelected ? "#0f62fe" : "#ffffff", border: isSelected ? "none" : "1px solid #c6c6c6", flexShrink: 0 }}>
                      {isSelected && <CheckCircle2 size={12} color="#fff" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
              <button onClick={handleBack}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#ffffff", color: "#161616", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                <ArrowLeft size={13} />
                {currentStep === 0 ? "Cancel" : "Back"}
              </button>

              <button onClick={handleNext} disabled={!selected}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 24px",
                  background: selected ? "#0f62fe" : "#e0e0e0",
                  color:      selected ? "#ffffff" : "#8d8d8d",
                  border: "none", cursor: selected ? "pointer" : "not-allowed",
                  fontSize: 13, fontFamily: "inherit", fontWeight: 500,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (selected) e.currentTarget.style.background = "#0353e9"; }}
                onMouseLeave={(e) => { if (selected) e.currentTarget.style.background = "#0f62fe"; }}
              >
                {currentStep === totalSteps - 1 ? "Generate Results" : "Next"}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
