/**
 * IndustrySelect.tsx
 *
 * Landing page — choose an industry vertical.
 * Replaces the old Home as the entry point (Home becomes the Requisitions hub).
 */

import { useNavigate } from "react-router";
import { INDUSTRIES } from "../data/taxonomy";
import { ExternalLink } from "lucide-react";

const SANS = "'IBM Plex Sans', sans-serif";

const OVERVIEW_DOCS = [
  { title: "Oracle Fusion Cloud — Approvals Overview",            file: "Oracle_Fusion_Cloud_Approvals_Overview.pdf"            },
  { title: "Oracle Fusion Cloud — Financials Approvals Overview", file: "Oracle_Fusion_Cloud_Financials_Approvals_Overview.pdf"  },
  { title: "Oracle Fusion Cloud — HCM Approvals Overview",        file: "Oracle_Fusion_Cloud_HCM_Approvals_Overview.pdf"         },
];

export default function IndustrySelect() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: SANS, background: "#f4f4f4", minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ padding: "32px 32px 28px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#0f62fe", letterSpacing: "0.1em", margin: "0 0 6px", textTransform: "uppercase" }}>
          Oracle Fusion Cloud · Approval Intelligence Center
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 300, color: "#161616", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
          Select Your Industry
        </h1>
        <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 580 }}>
          Choose the industry vertical that matches your organization. Each industry provides tailored approval workflow configuration, KDD questionnaires, and process-flow resources across SCM, Finance, and HCM.
        </p>
      </div>

      {/* Oracle Fusion Approvals overview banner */}
      <div style={{ padding: "24px 32px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#525252", letterSpacing: "0.09em", margin: "0 0 14px", textTransform: "uppercase" }}>
          What is Oracle Fusion Approvals?
        </p>
        <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 760 }}>
          Oracle Fusion Cloud Approvals is a configurable workflow engine embedded across SCM, Finance, and HCM modules. It enables organizations to define, enforce, and audit multi-stage approval processes for transactions such as requisitions, purchase orders, invoices, contracts, and journal entries — routing each transaction to the right approver at the right time based on business rules.
        </p>

        {/* Overview documents */}
        <p style={{ fontSize: 10, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", margin: "0 0 8px", textTransform: "uppercase" }}>
          Reference Documents
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid #e0e0e0" }}>
          {OVERVIEW_DOCS.map((doc, i) => (
            <a
              key={doc.file}
              href={`/decks/${doc.file}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#ffffff", textDecoration: "none", borderBottom: i < OVERVIEW_DOCS.length - 1 ? "1px solid #e0e0e0" : "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            >
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ flex: 1, fontSize: 13, color: "#161616", lineHeight: 1.4 }}>{doc.title}</span>
              <ExternalLink size={12} style={{ color: "#0f62fe", flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>

      {/* Industry grid */}
      <div style={{ padding: "28px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
          Industry Verticals · {INDUSTRIES.length} available
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
          {INDUSTRIES.map((industry) => {
            const Icon = industry.icon;
            return (
              <button
                key={industry.slug}
                onClick={() => navigate(`/industry/${industry.slug}`)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  padding: "24px 22px",
                  background: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  borderTop: "3px solid transparent",
                  transition: "background 0.15s, border-top-color 0.15s",
                  fontFamily: SANS,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = industry.colorLight;
                  e.currentTarget.style.borderTopColor = industry.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderTopColor = "transparent";
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 48, height: 48,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${industry.color}14`,
                  border: `1px solid ${industry.color}30`,
                  marginBottom: 14, flexShrink: 0,
                }}>
                  <Icon size={22} style={{ color: industry.color }} strokeWidth={1.5} />
                </div>

                {/* Label */}
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#161616", margin: "0 0 6px", lineHeight: 1.3 }}>
                  {industry.label}
                </h2>

                {/* Description */}
                <p style={{ fontSize: 12, color: "#525252", lineHeight: 1.6, margin: "0 0 16px", flex: 1 }}>
                  {industry.description}
                </p>

              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
