import { useState } from "react";
import { useNavigate } from "react-router";
import {
  FileText, DollarSign, ShieldCheck, Users, AlertCircle,
  TrendingUp, ChevronDown, Clock, Info, ArrowLeft,
} from "lucide-react";

const APPROVAL_TYPES = [
  {
    id: "requisition", icon: FileText, color: "#0f62fe",
    title: "Requisition Approval", threshold: "Any requisition > $0",
    approvers: ["Supervisor / Manager", "Department Head (> $10K)", "Finance Controller (> $50K)", "CPO (> $250K)"],
    trigger: "Auto-routed on requisition save", sla: "2 business days",
    notes: "Amount, category, and vendor type all affect routing hierarchy.",
  },
  {
    id: "po", icon: DollarSign, color: "#24a148",
    title: "Purchase Order Approval", threshold: "POs converted from approved requisitions",
    approvers: ["Buyer Supervisor", "Category Manager", "VP Procurement (> $100K)"],
    trigger: "On PO creation or modification", sla: "1 business day",
    notes: "Change orders to approved POs trigger re-approval above tolerance threshold.",
  },
  {
    id: "contract", icon: ShieldCheck, color: "#8a3ffc",
    title: "Contract Approval", threshold: "All contract awards",
    approvers: ["Legal Counsel", "Procurement Director", "CFO (> $500K)", "Board (> $1M)"],
    trigger: "On contract creation or renewal", sla: "5–10 business days",
    notes: "Multi-round — legal review precedes financial sign-off.",
  },
  {
    id: "ica", icon: Users, color: "#009d9a",
    title: "ICA / Interagency Approval", threshold: "Cross-agency transactions",
    approvers: ["Agency Procurement Lead", "Receiving Agency Head", "State Central Procurement"],
    trigger: "When requisition source type is interagency", sla: "3–7 business days",
    notes: "SLED-specific path. Signed MOU must be on file before routing.",
  },
  {
    id: "sole-source", icon: AlertCircle, color: "#da1e28",
    title: "Sole Source / Non-Competitive", threshold: "Any sole-source justification",
    approvers: ["Requesting Manager", "Legal", "CPO / Procurement Director"],
    trigger: "Justification flag set on requisition", sla: "5 business days",
    notes: "Written justification document must be attached before approval can begin.",
  },
  {
    id: "emergency", icon: TrendingUp, color: "#ba4e00",
    title: "Emergency Procurement", threshold: "Declared emergency events",
    approvers: ["Department Head", "CPO (verbal then written)"],
    trigger: "Emergency declaration on file", sla: "Same day / 24 hours",
    notes: "Expedited routing — post-award ratification required within 30 days.",
  },
];

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", fontSize: 11, fontWeight: 500, background: `${color}18`, color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

function ApprovalCard({ ap }: { ap: typeof APPROVAL_TYPES[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = ap.icon;
  return (
    <div style={{ border: `1px solid ${open ? `${ap.color}55` : "#e0e0e0"}`, background: "#ffffff", cursor: "pointer", transition: "border-color 0.15s" }}
      onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 20 }}>
        <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: ap.color, flexShrink: 0 }}>
          <Icon size={20} color="#fff" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#161616", margin: 0 }}>{ap.title}</h3>
            <ChevronDown size={14} style={{ color: "#525252", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </div>
          <p style={{ fontSize: 12, color: "#525252", margin: "4px 0 8px" }}>{ap.threshold}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Badge color={ap.color}>{ap.approvers.length} approvers</Badge>
            <span style={{ fontSize: 12, color: "#525252", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> {ap.sla}
            </span>
          </div>
        </div>
      </div>
      {open && (
        <div style={{ padding: "16px 20px 20px", borderTop: `1px solid ${ap.color}22` }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: ap.color, textTransform: "uppercase", marginBottom: 8 }}>Approval Chain</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {ap.approvers.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: `${ap.color}18`, color: ap.color, flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "#161616" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#8d8d8d", textTransform: "uppercase", marginBottom: 4 }}>Trigger</p>
              <p style={{ fontSize: 13, color: "#161616", margin: 0 }}>{ap.trigger}</p>
            </div>
            <div style={{ padding: "10px 14px", background: `${ap.color}0d`, border: `1px solid ${ap.color}22` }}>
              <p style={{ fontSize: 12, display: "flex", alignItems: "flex-start", gap: 8, color: ap.color, margin: 0 }}>
                <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                {ap.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Approvals() {
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
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", marginBottom: 4, textTransform: "uppercase" }}>Oracle SCM</p>
        <h2 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 6px" }}>Approval Types</h2>
        <p style={{ fontSize: 13, color: "#525252", margin: 0 }}>Click any card to expand the approval chain, routing trigger, and key notes.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 1, background: "#e0e0e0" }}>
        {APPROVAL_TYPES.map((ap) => <ApprovalCard key={ap.id} ap={ap} />)}
      </div>
    </div>
  );
}
