/**
 * FunctionalAreaPage.tsx
 *
 * Second level — choose a Functional Area (SCM, Finance, HCM) within an industry.
 */

import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getIndustry } from "../data/taxonomy";

const SANS = "'IBM Plex Sans', sans-serif";

export default function FunctionalAreaPage() {
  const { industrySlug } = useParams<{ industrySlug: string }>();
  const navigate = useNavigate();

  const industry = getIndustry(industrySlug ?? "");
  if (!industry) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Industry not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>
    );
  }

  const IndustryIcon = industry.icon;

  return (
    <div style={{ fontFamily: SANS, background: "#f4f4f4", minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ padding: "24px 32px 22px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 12, color: "#525252", background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
        >
          <ArrowLeft size={13} /> All Industries
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 52, height: 52,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${industry.color}14`,
            border: `1px solid ${industry.color}30`,
            flexShrink: 0,
          }}>
            <IndustryIcon size={22} style={{ color: industry.color }} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: industry.color, letterSpacing: "0.09em", margin: "0 0 3px", textTransform: "uppercase" }}>
              Industry Vertical
            </p>
            <h1 style={{ fontSize: 21, fontWeight: 400, color: "#161616", margin: "0 0 5px" }}>
              {industry.label}
            </h1>
            <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 540 }}>
              {industry.description}
            </p>
          </div>
        </div>
      </div>

      {/* Functional Areas */}
      <div style={{ padding: "28px 32px" }}>

        {/* City Government reference document */}
        {industrySlug === "city" && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Reference Document
            </p>
            <a
              href="/decks/Requisition_Approvals_City_Government.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#ffffff", border: "1px solid #e0e0e0", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            >
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", flexShrink: 0 }}>01</span>
              <span style={{ flex: 1, fontSize: 13, color: "#161616", lineHeight: 1.4 }}>Requisition Approvals — City Government</span>
              <ExternalLink size={12} style={{ color: "#0f62fe", flexShrink: 0 }} />
            </a>
          </div>
        )}

        {/* County Government reference document */}
        {industrySlug === "county" && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Reference Document
            </p>
            <a
              href="/decks/Requisition_Approvals_County_Government.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#ffffff", border: "1px solid #e0e0e0", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            >
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", flexShrink: 0 }}>01</span>
              <span style={{ flex: 1, fontSize: 13, color: "#161616", lineHeight: 1.4 }}>Requisition Approvals — County Government</span>
              <ExternalLink size={12} style={{ color: "#0f62fe", flexShrink: 0 }} />
            </a>
          </div>
        )}

        {/* K-12 Education reference document */}
        {industrySlug === "k12" && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Reference Document
            </p>
            <a
              href="/decks/Requisition_Approvals_K12_Schools.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#ffffff", border: "1px solid #e0e0e0", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            >
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", flexShrink: 0 }}>01</span>
              <span style={{ flex: 1, fontSize: 13, color: "#161616", lineHeight: 1.4 }}>Requisition Approvals — K-12 Schools</span>
              <ExternalLink size={12} style={{ color: "#0f62fe", flexShrink: 0 }} />
            </a>
          </div>
        )}

        {/* Transit Agency reference document */}
        {industrySlug === "transit" && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Reference Document
            </p>
            <a
              href="/decks/Requisition_Approvals_Transit_Agency.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#ffffff", border: "1px solid #e0e0e0", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            >
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", flexShrink: 0 }}>01</span>
              <span style={{ flex: 1, fontSize: 13, color: "#161616", lineHeight: 1.4 }}>Requisition Approvals — Transit Agency</span>
              <ExternalLink size={12} style={{ color: "#0f62fe", flexShrink: 0 }} />
            </a>
          </div>
        )}

        {/* Utilities reference document */}
        {industrySlug === "utilities" && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Reference Document
            </p>
            <a
              href="/decks/Requisition_Approvals_Utilities.pdf"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: "#ffffff", border: "1px solid #e0e0e0", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f4f4f4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ffffff"; }}
            >
              <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", flexShrink: 0 }}>01</span>
              <span style={{ flex: 1, fontSize: 13, color: "#161616", lineHeight: 1.4 }}>Requisition Approvals — Utilities</span>
              <ExternalLink size={12} style={{ color: "#0f62fe", flexShrink: 0 }} />
            </a>
          </div>
        )}

        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
          Functional Areas
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
          {industry.functionalAreas.map((fa) => {
            const FAIcon = fa.icon;
            const availableModules = fa.modules.filter((m) => m.activities.some((a) => a.available));
            return (
              <button
                key={fa.slug}
                onClick={() => navigate(`/industry/${industrySlug}/${fa.slug}`)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  padding: "22px 22px",
                  background: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  borderTop: "3px solid transparent",
                  transition: "background 0.15s, border-top-color 0.15s",
                  fontFamily: SANS,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f4f4f4";
                  e.currentTarget.style.borderTopColor = fa.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderTopColor = "transparent";
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${fa.color}12`,
                    border: `1px solid ${fa.color}28`,
                  }}>
                    <FAIcon size={20} style={{ color: fa.color }} strokeWidth={1.5} />
                  </div>
                  <ChevronRight size={15} style={{ color: "#c6c6c6", marginTop: 4 }} />
                </div>

                {/* Label */}
                <h2 style={{ fontSize: 15, fontWeight: 600, color: "#161616", margin: "0 0 6px", lineHeight: 1.3 }}>
                  {fa.label}
                </h2>

                {/* Description */}
                <p style={{ fontSize: 12, color: "#525252", lineHeight: 1.6, margin: "0 0 16px", flex: 1 }}>
                  {fa.description}
                </p>

                {/* Module list */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {fa.modules.map((mod) => (
                    <span key={mod.slug} style={{
                      fontSize: 10, padding: "2px 8px",
                      background: "#f4f4f4",
                      color: "#525252",
                      border: "1px solid #e0e0e0",
                    }}>
                      {mod.label}
                    </span>
                  ))}
                </div>

                {/* Available count */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: fa.color }}>
                    {availableModules.length} module{availableModules.length !== 1 ? "s" : ""} available
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
