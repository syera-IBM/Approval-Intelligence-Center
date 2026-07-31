/**
 * IndustrySelect.tsx
 *
 * Landing page — choose an industry vertical.
 * Replaces the old Home as the entry point (Home becomes the Requisitions hub).
 */

import { useNavigate } from "react-router";
import { INDUSTRIES } from "../data/taxonomy";

const SANS = "'IBM Plex Sans', sans-serif";

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
