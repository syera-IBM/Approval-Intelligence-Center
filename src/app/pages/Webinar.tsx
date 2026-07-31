import { useNavigate } from "react-router";
import { Video, PlayCircle, Bell, ArrowLeft } from "lucide-react";

const SESSIONS = [
  {
    title: "Oracle SCM Approval Configuration — Foundations",
    date: "June 12, 2025", duration: "52 min", presenter: "Implementation Team",
    topics: ["Approval rule setup", "Hierarchy configuration", "Testing approval paths"],
    color: "#0f62fe", status: "Recorded",
  },
  {
    title: "Requisition Approval Workflow Deep Dive",
    date: "June 26, 2025", duration: "45 min", presenter: "Oracle SCM Lead",
    topics: ["Requisition routing rules", "Budget check integration", "Escalation paths"],
    color: "#ba4e00", status: "Recorded",
  },
  {
    title: "Contract & ICA Approval Configuration",
    date: "July 10, 2025", duration: "60 min", presenter: "Procurement Workstream",
    topics: ["Contract approval matrix", "ICA routing for SLED", "Multi-org approvals"],
    color: "#8a3ffc", status: "Recorded",
  },
  {
    title: "Client-Specific KDD Walkthrough: COD & SLED",
    date: "July 24, 2025", duration: "55 min", presenter: "Client Delivery Team",
    topics: ["COD contract approvals", "SLED ICA framework", "Common design deviations"],
    color: "#24a148", status: "Upcoming",
  },
  {
    title: "Q&A: Approval Configuration Best Practices",
    date: "August 7, 2025", duration: "40 min", presenter: "Full Delivery Team",
    topics: ["Live Q&A", "Edge case scenarios", "Go-live readiness checklist"],
    color: "#da1e28", status: "Upcoming",
  },
];

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", fontSize: 11, fontWeight: 500, background: `${color}18`, color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

export default function Webinar() {
  const featured = SESSIONS[2];
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
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", marginBottom: 4, textTransform: "uppercase" }}>Training</p>
        <h2 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 6px" }}>Webinar Series</h2>
        <p style={{ fontSize: 13, color: "#525252", margin: 0 }}>
          Oracle SCM Approval Process training — {SESSIONS.filter((s) => s.status === "Recorded").length} recorded,{" "}
          {SESSIONS.filter((s) => s.status === "Upcoming").length} upcoming.
        </p>
      </div>

      {/* Featured banner */}
      <div style={{ background: "#f4f4f4", border: "1px solid #e0e0e0", borderLeft: `4px solid ${featured.color}`, padding: "24px 28px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: featured.color, flexShrink: 0 }}>
          <Video size={26} color="#fff" strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Badge color={featured.color}>Latest Recording</Badge>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#161616", margin: "8px 0 4px" }}>{featured.title}</h3>
          <p style={{ fontSize: 12, color: "#525252", margin: "0 0 8px" }}>{featured.date} · {featured.duration} · {featured.presenter}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {featured.topics.map((t) => (
              <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#ffffff", color: "#525252", border: "1px solid #e0e0e0" }}>{t}</span>
            ))}
          </div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: featured.color, color: "#ffffff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit", flexShrink: 0, transition: "opacity 0.1s" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
          <PlayCircle size={15} /> Watch Recording
        </button>
      </div>

      {/* Session list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#e0e0e0" }}>
        {SESSIONS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "#ffffff", flexWrap: "wrap" }}>
            <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}18`, flexShrink: 0 }}>
              <Video size={20} style={{ color: s.color }} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#161616", margin: 0 }}>{s.title}</h3>
                <Badge color={s.status === "Recorded" ? "#24a148" : "#ba4e00"}>{s.status}</Badge>
              </div>
              <p style={{ fontSize: 12, color: "#525252", margin: "4px 0 6px" }}>{s.date} · {s.duration} · {s.presenter}</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {s.topics.map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#f4f4f4", color: "#525252", border: "1px solid #e0e0e0" }}>{t}</span>
                ))}
              </div>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", flexShrink: 0, transition: "background 0.1s",
              background: s.status === "Recorded" ? `${s.color}0d` : "#f4f4f4",
              color:      s.status === "Recorded" ? s.color : "#525252",
              border:     `1px solid ${s.status === "Recorded" ? `${s.color}44` : "#e0e0e0"}`,
            }}>
              {s.status === "Recorded" ? <><PlayCircle size={13} /> Watch</> : <><Bell size={13} /> Remind Me</>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
