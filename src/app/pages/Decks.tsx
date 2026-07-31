import { useState } from "react";
import { useNavigate } from "react-router";
import { FileText, ExternalLink, ArrowLeft } from "lucide-react";

const DECKS = [
  { id: 1, title: "Requisition Approval Workflow",                    category: "Workflow",  file: "Requisition_Approval_Workflow-1.pdf",                       color: "#0f62fe", desc: "End-to-end requisition approval routing and escalation paths within Oracle SCM.",               tags: ["Requisition", "Routing", "SCM"]        },
  { id: 2, title: "Oracle SLED Req Approval — ICA Training Framework", category: "Training",  file: "Oracle_SLED_Req_Approval_ICA_Training_Framework-1.pdf",      color: "#24a148", desc: "ICA training framework for State, Local, and Education (SLED) requisition approvals.",         tags: ["SLED", "ICA", "Training"]              },
  { id: 3, title: "EDM.335 SWBNO — SCM Approvals KDD",               category: "KDD",       file: "EDM.335_SWBNO_Key_Design_Decision_SCM_Approvals-1.pdf",      color: "#8a3ffc", desc: "Key design decisions for SCM approvals at Sewerage & Water Board of New Orleans.",           tags: ["SWBNO", "EDM.335", "KDD"]              },
  { id: 4, title: "EDM.335 APS — SCM Approvals KDD v7",              category: "KDD",       file: "EDM.335_APS_Key_Design_Decision_SCM_Approvals_v7-1.pdf",     color: "#009d9a", desc: "Version 7 key design decisions for APS SCM approval configuration.",                         tags: ["APS", "EDM.335", "v7"]                 },
  { id: 5, title: "EDM 320 MCPS — Workflow KDD",                     category: "KDD",       file: "EDM_320_MCPS_Workflow_KDD_SUBMITTED-1.pdf",                  color: "#da1e28", desc: "Submitted workflow key design decisions for Montgomery County Public Schools.",               tags: ["MCPS", "EDM 320", "Workflow"]           },
  { id: 6, title: "EDM 320 BCPSS — Workflow KDD V2",                 category: "KDD",       file: "EDM_320_BCPSS_Workflow_KDD_V2-1.pdf",                        color: "#ba4e00", desc: "Version 2 workflow KDD for Baltimore City Public School System.",                            tags: ["BCPSS", "EDM 320", "KDD"]              },
  { id: 7, title: "COD Contract Approvals v1",                       category: "Contract",  file: "COD_Contract_Approvals_v1-1.pdf",                            color: "#0f62fe", desc: "Contract approval requirements and routing rules for the City of Detroit.",                    tags: ["COD", "Contract", "Approvals"]         },
  { id: 8, title: "Common Design — Approvals Overview (CD.05b)",     category: "Overview",  file: "CD.05b_Common_Design_-_Approvals_Overview-1.pdf",            color: "#8a3ffc", desc: "Cross-client common design baseline for Oracle SCM approval configuration.",                  tags: ["Common Design", "Overview", "CD.05b"]  },
  { id: 9, title: "COD Contract Approval Requirements",              category: "Contract",  file: "COD_Contract_Approval_Requirements-1.pdf",                   color: "#009d9a", desc: "Detailed approval requirements matrix for City of Detroit contract scenarios.",               tags: ["COD", "Requirements", "Contract"]       },
  { id: 10, title: "EDM.220 — Business Process Flows — PO V2",      category: "Examples",  file: "EDM.220 - Business Process Flows - PO V2 (1).pdf",           color: "#ba4e00", desc: "EDM.220 Purchase Order V2 business process flows — customer example implementation.",       tags: ["EDM.220", "PO", "Process Flows"]        },
];

export default function Decks() {
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();
  const categories = ["All", ...Array.from(new Set(DECKS.map((d) => d.category)))];
  const filtered   = filter === "All" ? DECKS : DECKS.filter((d) => d.category === filter);

  return (
    <div style={{ padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24, fontFamily: "'IBM Plex Sans', sans-serif", background: "#ffffff", minHeight: "100%" }}>
      <button onClick={() => navigate(-1)}
        style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start", color: "#525252", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}>
        <ArrowLeft size={13} /> Back
      </button>

      <div>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#8d8d8d", marginBottom: 4, textTransform: "uppercase" }}>Documents</p>
        <h2 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 6px" }}>Resource Decks</h2>
        <p style={{ fontSize: 13, color: "#525252", margin: 0 }}>{DECKS.length} documents · Click any card to open the PDF in a new tab</p>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            style={{
              padding: "5px 14px", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
              background: filter === c ? "#0f62fe" : "#ffffff",
              color:      filter === c ? "#ffffff" : "#525252",
              border:     `1px solid ${filter === c ? "#0f62fe" : "#e0e0e0"}`,
              transition: "background 0.1s, color 0.1s, border-color 0.1s",
            }}
            onMouseEnter={(e) => { if (filter !== c) { e.currentTarget.style.borderColor = "#0f62fe"; e.currentTarget.style.color = "#0f62fe"; } }}
            onMouseLeave={(e) => { if (filter !== c) { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#525252"; } }}>
            {c}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: "#e0e0e0" }}>
        {filtered.map((deck) => (
          <a key={deck.id}
            href={`/decks/${deck.file}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px", background: "#ffffff", textDecoration: "none", borderTop: "2px solid transparent", transition: "background 0.1s, border-top-color 0.1s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; (e.currentTarget as HTMLElement).style.borderTopColor = deck.color; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; (e.currentTarget as HTMLElement).style.borderTopColor = "transparent"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: `${deck.color}18`, flexShrink: 0 }}>
                <FileText size={20} style={{ color: deck.color }} strokeWidth={1.5} />
              </div>
              <ExternalLink size={13} style={{ color: "#8d8d8d", marginTop: 2 }} />
            </div>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", background: `${deck.color}18`, color: deck.color, border: `1px solid ${deck.color}33`, textTransform: "uppercase", marginBottom: 8 }}>{deck.category}</span>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#161616", margin: "0 0 6px", lineHeight: 1.4 }}>{deck.title}</h3>
              <p style={{ fontSize: 12, color: "#525252", margin: 0, lineHeight: 1.6 }}>{deck.desc}</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {deck.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, padding: "2px 8px", background: "#f4f4f4", color: "#525252", border: "1px solid #e0e0e0" }}>{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
