import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText, TrendingUp, User, Building2, DollarSign,
  ShieldCheck, CheckCircle2, ChevronRight, Clock, ArrowLeft,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Requisition Created",  actor: "Requester",                status: "complete", icon: FileText,    desc: "User submits requisition in Oracle Fusion with line items, cost center, and justification." },
  { id: 2, label: "Budget Check",         actor: "System (Auto)",             status: "complete", icon: TrendingUp,  desc: "Oracle automatically validates budget availability. Fails here if funds are insufficient." },
  { id: 3, label: "Supervisor Review",    actor: "Direct Manager",            status: "active",   icon: User,        desc: "First human touchpoint. Manager approves routine spend or escalates for higher-value items." },
  { id: 4, label: "Department Head",      actor: "Dept. Head",                status: "pending",  icon: Building2,   desc: "Required when amount exceeds departmental threshold. Routed automatically by Oracle rules." },
  { id: 5, label: "Finance / Control",    actor: "Finance Controller",        status: "pending",  icon: DollarSign,  desc: "Fiscal validation for high-value or cross-departmental spend. May request modifications." },
  { id: 6, label: "CPO / Final Auth",     actor: "Chief Procurement Officer", status: "pending",  icon: ShieldCheck, desc: "Executive sign-off for spend above policy ceiling. Final approval gate." },
  { id: 7, label: "PO Issued",            actor: "Buyer / System",            status: "pending",  icon: CheckCircle2,desc: "Oracle auto-generates Purchase Order and notifies vendor upon all approvals complete." },
];

const MATRIX = [
  { range: "$0 – $10,000",          approvers: "Supervisor",                      sla: "1 day",      level: "Standard",  color: "#24a148" },
  { range: "$10,001 – $50,000",     approvers: "Supervisor + Dept. Head",         sla: "2 days",     level: "Standard",  color: "#24a148" },
  { range: "$50,001 – $250,000",    approvers: "Dept. Head + Finance Controller", sla: "3 days",     level: "Elevated",  color: "#f1c21b" },
  { range: "$250,001 – $500,000",   approvers: "Finance Controller + CPO",        sla: "5 days",     level: "Executive", color: "#ba4e00" },
  { range: "$500,001 – $1,000,000", approvers: "CPO + CFO + Legal",               sla: "7 days",     level: "Executive", color: "#da1e28" },
  { range: "> $1,000,000",          approvers: "CPO + CFO + Board",               sla: "10–14 days", level: "Board",     color: "#8a3ffc" },
];

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", fontSize: 11, fontWeight: 500, background: `${color}18`, color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

export default function Process() {
  const [active, setActive] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24, fontFamily: "'IBM Plex Sans', sans-serif", background: "#ffffff", minHeight: "100%" }}>
      <button onClick={() => navigate(-1)}
        style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start", color: "#525252", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}>
        <ArrowLeft size={13} /> Back
      </button>

      <div>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", marginBottom: 4, textTransform: "uppercase" }}>Workflow</p>
        <h2 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 6px" }}>Process Flow</h2>
        <p style={{ fontSize: 13, color: "#525252", margin: 0 }}>Oracle SCM end-to-end requisition-to-PO path. Click any step for details.</p>
      </div>

      {/* Step flow */}
      <div style={{ border: "1px solid #e0e0e0", background: "#ffffff" }}>
        {STEPS.map((step, idx) => {
          const Icon       = step.icon;
          const isComplete = step.status === "complete";
          const isActive   = step.status === "active";
          const isSelected = active === step.id;
          const isLast     = idx === STEPS.length - 1;
          const accentColor = isComplete ? "#24a148" : isActive ? "#0f62fe" : "#8d8d8d";

          return (
            <div key={step.id}>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "14px 20px", cursor: "pointer", background: isSelected ? "#f4f4f4" : "#ffffff", transition: "background 0.1s" }}
                onClick={() => setActive(isSelected ? null : step.id)}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
              >
                {/* Step circle */}
                <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: isComplete ? "#24a148" : isActive ? "#0f62fe" : "#f4f4f4", border: `1px solid ${isComplete ? "#24a148" : isActive ? "#0f62fe" : "#e0e0e0"}`, flexShrink: 0 }}>
                  {isComplete
                    ? <CheckCircle2 size={16} color="#fff" strokeWidth={2} />
                    : <Icon size={16} style={{ color: isActive ? "#fff" : "#525252" }} strokeWidth={1.5} />
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#161616" }}>{step.label}</span>
                    {isActive   && <Badge color="#0f62fe">In Progress</Badge>}
                    {isComplete && <Badge color="#24a148">Complete</Badge>}
                  </div>
                  <p style={{ fontSize: 12, color: "#525252", margin: "2px 0 0" }}>{step.actor}</p>
                  {isSelected && <p style={{ fontSize: 13, color: "#161616", margin: "10px 0 0", lineHeight: 1.6 }}>{step.desc}</p>}
                </div>

                <ChevronRight size={14} style={{ color: "#8d8d8d", flexShrink: 0, marginTop: 10, transform: isSelected ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
              </div>

              {!isLast && (
                <div style={{ width: 1, height: 16, background: isComplete ? "#24a14855" : "#e0e0e0", marginLeft: 37 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Threshold matrix */}
      <div style={{ border: "1px solid #e0e0e0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e0e0e0", background: "#f4f4f4" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#161616", margin: "0 0 2px" }}>Approval Threshold Matrix</h3>
          <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>Dollar amount → required approvers → SLA</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                {["Amount Range", "Required Approvers", "SLA", "Level"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", textTransform: "uppercase", background: "#fafafa" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < MATRIX.length - 1 ? "1px solid #e0e0e0" : "none" }}>
                  <td style={{ padding: "12px 16px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#161616", fontWeight: 500 }}>{row.range}</td>
                  <td style={{ padding: "12px 16px", color: "#161616", fontSize: 13 }}>{row.approvers}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#525252", fontSize: 12 }}>
                      <Clock size={11} /> {row.sla}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}><Badge color={row.color}>{row.level}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
