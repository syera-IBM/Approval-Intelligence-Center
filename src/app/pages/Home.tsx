import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ShoppingCart, FileText, FileSignature, Building2, Search, AlertTriangle,
  LayoutGrid, GitBranch, Download, Trash2, RefreshCw,
} from "lucide-react";
import { loadAllWorkflows, deleteWorkflow, type GeneratedWorkflow } from "../data/workflowEngine";
import { loadRoster } from "../components/RosterPanel";
import { downloadProcessFlowXlsx } from "../data/xlsxFormatter";
import { loadProgressForSlug } from "../data/discoveryQuestions";

export const APPROVAL_TYPES = [
  { slug: "requisition",    label: "Requisition",      description: "Purchase requisition approvals, routing rules, and threshold-based escalation paths within Oracle Fusion.", icon: ShoppingCart,  color: "#0f62fe", colorLight: "#d0e2ff", category: "Procurement" },
  { slug: "purchase-order", label: "Purchase Order",   description: "PO approval workflows, change order routing, and supplier acknowledgment requirements.",                   icon: FileText,      color: "#009d9a", colorLight: "#9ef0f0", category: "Procurement" },
  { slug: "contract",       label: "Contract",         description: "Contract approval thresholds, legal review gates, and executive sign-off requirements by value tier.",      icon: FileSignature, color: "#8a3ffc", colorLight: "#e8daff", category: "Legal"       },
  { slug: "ica",            label: "Suppliers",        description: "Interagency and intercompany agreement approvals with MOU requirements and state procurement routing.",     icon: Building2,     color: "#24a148", colorLight: "#a7f0ba", category: "Interagency" },
  { slug: "sole-source",    label: "Payable Invoices", description: "Sole-source justification approvals, legal counsel review, and CPO authorization requirements.",            icon: Search,        color: "#ba4e00", colorLight: "#ffd9be", category: "Procurement" },
  { slug: "emergency",      label: "Journals",         description: "Emergency procurement declarations, expedited approval chains, and post-award ratification processes.",     icon: AlertTriangle, color: "#da1e28", colorLight: "#ffd7d9", category: "Procurement" },
];

const RISK_COLOR: Record<string, string> = {
  Low: "#24a148", Medium: "#f1c21b", High: "#ff832b", Critical: "#da1e28",
};

const SANS = "'IBM Plex Sans', sans-serif";

function downloadWorkflowXlsx(wf: GeneratedWorkflow) {
  const gkRoster  = loadRoster(wf.slug, "gatekeeper_roster");
  const ccmRoster = loadRoster(wf.slug, "cc_manager_roster");
  downloadProcessFlowXlsx(wf, wf.steps, { gatekeeper: gkRoster, ccManager: ccmRoster });
}

// ── Small progress ring for home page ─────────────────────────────────────────
function ProgressRing({ slug, size = 48 }: { slug: string; size?: number }) {
  const [pct, setPct] = useState(0);
  const [submittedAt, setSubmittedAt] = useState<string | null>(() => localStorage.getItem(`req_submitted_at_${slug}`));

  useEffect(() => {
    const calc = () => {
      const { total, filled } = loadProgressForSlug(slug);
      setPct(total > 0 ? filled / total : 0);
      setSubmittedAt(localStorage.getItem(`req_submitted_at_${slug}`));
    };
    calc();
    window.addEventListener("storage", calc);
    return () => window.removeEventListener("storage", calc);
  }, [slug]);

  const R = size / 2 - 4;
  const C = 2 * Math.PI * R;
  const dash = C * pct;
  const rc = pct >= 1 ? "#24a148" : pct > 0 ? "#0f62fe" : "#c6c6c6";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#e0e0e0" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={rc} strokeWidth="3"
          strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.4s" }} />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          fontSize={9} fontWeight="700"
          fill={pct === 0 ? "#8d8d8d" : rc} fontFamily={SANS}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {submittedAt && (
        <span style={{ fontSize: 9, color: "#24a148", fontWeight: 600, whiteSpace: "nowrap" }}>✓ submitted</span>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<GeneratedWorkflow[]>([]);

  useEffect(() => {
    const load = () => setWorkflows(loadAllWorkflows());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const handleDelete = (slug: string) => {
    if (!window.confirm("Delete this workflow report? You can regenerate it from the approval type page.")) return;
    deleteWorkflow(slug);
    setWorkflows(loadAllWorkflows());
  };

  return (
    <div style={{ fontFamily: SANS, background: "#f4f4f4", minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ padding: "32px 32px 28px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <LayoutGrid size={18} style={{ color: "#0f62fe" }} strokeWidth={1.5} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#0f62fe", letterSpacing: "0.08em" }}>ORACLE FUSION SCM</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          Approval Workflow Intelligence Center
        </h1>
        <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
          Select an approval type from the sidebar to access resource decks, process flows, webinar recordings, requirements questionnaire, and customer examples.
        </p>
      </div>

      {/* Requirements progress rings */}
      <div style={{ padding: "28px 32px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 16 }}>
          REQUIREMENTS QUESTIONNAIRE PROGRESS
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
          {APPROVAL_TYPES.map((type) => (
            <button key={type.slug} onClick={() => navigate(`/approval/${type.slug}`)}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "#ffffff", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
              <ProgressRing slug={type.slug} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.07em", display: "block", marginBottom: 2 }}>{type.category}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#161616", display: "block", lineHeight: 1.3 }}>{type.label}</span>
                <span style={{ fontSize: 12, color: "#525252", display: "block", marginTop: 2, lineHeight: 1.4 }}>{type.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Workflow Reports section */}
      {workflows.length > 0 && (
        <div style={{ padding: "28px 32px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <GitBranch size={15} style={{ color: "#0f62fe" }} strokeWidth={1.5} />
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", margin: 0 }}>
              GENERATED PROCESS FLOWS
            </p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", background: "#d0e2ff", color: "#0f62fe" }}>
              {workflows.length}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
            {workflows.map((wf) => {
              const typeInfo = APPROVAL_TYPES.find((t) => t.slug === wf.slug);
              if (!typeInfo) return null;
              const rc = RISK_COLOR[wf.riskLevel] ?? "#8d8d8d";
              return (
                <div key={wf.slug} style={{ display: "flex", flexDirection: "column", padding: "18px 20px", background: "#ffffff", gap: 12 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <ProgressRing slug={wf.slug} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: typeInfo.color, letterSpacing: "0.05em" }}>{typeInfo.label}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", background: `${rc}18`, color: rc, border: `1px solid ${rc}44` }}>{wf.riskLevel}</span>
                      </div>
                      <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>
                        {wf.steps.length} steps · {wf.totalApprovers} approvers · Generated {new Date(wf.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* SLA */}
                  <div style={{ padding: "8px 12px", background: "#f4f4f4", border: "1px solid #e0e0e0" }}>
                    <span style={{ fontSize: 10, color: "#8d8d8d", letterSpacing: "0.06em", fontWeight: 600 }}>SLA: </span>
                    <span style={{ fontSize: 12, color: "#161616", fontWeight: 600 }}>{wf.estimatedSLA}</span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate(`/approval/${wf.slug}`)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "#0f62fe", color: "#ffffff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: SANS }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}>
                      <GitBranch size={12} /> View Flow
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); downloadWorkflowXlsx(wf); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#ffffff", color: "#0f62fe", border: "1px solid #0f62fe", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#d0e2ff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                      <Download size={12} /> .xlsx
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/approval/${wf.slug}`); }}
                      title="Regenerate from approval type page"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#ffffff", color: "#525252", border: "1px solid #e0e0e0", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f4f4f4"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                      <RefreshCw size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(wf.slug); }}
                      title="Delete workflow report"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#ffffff", color: "#da1e28", border: "1px solid #da1e28", cursor: "pointer", fontSize: 12, fontFamily: SANS }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
