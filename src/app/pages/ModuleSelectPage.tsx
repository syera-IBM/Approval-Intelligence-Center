/**
 * ModuleSelectPage.tsx
 *
 * Third level — choose a Module within a Functional Area
 * (e.g., Requisitions, Purchase Orders, AP Invoices, etc.)
 */

import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Lock } from "lucide-react";
import { getIndustry, getFunctionalArea, FA_SHORT } from "../data/taxonomy";

const SANS = "'IBM Plex Sans', sans-serif";

export default function ModuleSelectPage() {
  const { industrySlug, faSlug } = useParams<{ industrySlug: string; faSlug: string }>();
  const navigate = useNavigate();

  const industry = getIndustry(industrySlug ?? "");
  const fa = industry ? getFunctionalArea(industry, faSlug ?? "") : undefined;

  if (!industry || !fa) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Page not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>
    );
  }

  const IndustryIcon = industry.icon;
  const FAIcon = fa.icon;

  return (
    <div style={{ fontFamily: SANS, background: "#f4f4f4", minHeight: "100%" }}>

      {/* Page header */}
      <div style={{ padding: "24px 32px 22px", background: "#ffffff", borderBottom: "1px solid #e0e0e0" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/")}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#525252", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
          >
            <IndustryIcon size={12} /> {industry.label}
          </button>
          <ChevronRight size={11} style={{ color: "#c6c6c6" }} />
          <button
            onClick={() => navigate(`/industry/${industrySlug}`)}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#525252", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
          >
            <FAIcon size={12} /> {FA_SHORT[fa.slug] ?? fa.label}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 52, height: 52,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${fa.color}14`,
            border: `1px solid ${fa.color}30`,
            flexShrink: 0,
          }}>
            <FAIcon size={22} style={{ color: fa.color }} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: fa.color, letterSpacing: "0.09em", margin: "0 0 3px", textTransform: "uppercase" }}>
              {industry.label} · {FA_SHORT[fa.slug] ?? fa.label}
            </p>
            <h1 style={{ fontSize: 21, fontWeight: 400, color: "#161616", margin: "0 0 5px" }}>
              {fa.label}
            </h1>
            <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 540 }}>
              {fa.description}
            </p>
          </div>
        </div>
      </div>

      {/* Modules grid */}
      <div style={{ padding: "28px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
          Modules · {fa.modules.length} in {FA_SHORT[fa.slug] ?? fa.label}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
          {fa.modules.map((mod) => {
            const ModIcon = mod.icon;
            const availableCount = mod.activities.filter((a) => a.available).length;
            const isAvailable = availableCount > 0;

            return (
              <button
                key={mod.slug}
                onClick={() => isAvailable && navigate(`/industry/${industrySlug}/${faSlug}/${mod.slug}`)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  padding: "20px 20px",
                  background: "#ffffff",
                  border: "none",
                  cursor: isAvailable ? "pointer" : "default",
                  opacity: isAvailable ? 1 : 0.55,
                  borderTop: "3px solid transparent",
                  transition: "background 0.15s, border-top-color 0.15s",
                  fontFamily: SANS,
                }}
                onMouseEnter={(e) => {
                  if (!isAvailable) return;
                  e.currentTarget.style.background = "#f4f4f4";
                  e.currentTarget.style.borderTopColor = mod.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderTopColor = "transparent";
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${mod.color}12`,
                    border: `1px solid ${mod.color}28`,
                  }}>
                    <ModIcon size={18} style={{ color: mod.color }} strokeWidth={1.5} />
                  </div>
                  {!isAvailable
                    ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#8d8d8d", padding: "2px 6px", background: "#f4f4f4", border: "1px solid #e0e0e0", letterSpacing: "0.06em" }}>
                        <Lock size={8} /> COMING SOON
                      </span>
                    : <ChevronRight size={14} style={{ color: "#c6c6c6" }} />
                  }
                </div>

                {/* Label */}
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#161616", margin: "0 0 5px", lineHeight: 1.3 }}>
                  {mod.label}
                </h2>

                {/* Description */}
                <p style={{ fontSize: 12, color: "#525252", lineHeight: 1.6, margin: "0 0 14px", flex: 1 }}>
                  {mod.description}
                </p>

                {/* Activity pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {mod.activities.map((act) => (
                    <span key={act.slug} style={{
                      fontSize: 10, padding: "1px 7px",
                      background: act.available ? `${mod.color}12` : "#f4f4f4",
                      color: act.available ? mod.color : "#8d8d8d",
                      border: `1px solid ${act.available ? mod.color + "30" : "#e0e0e0"}`,
                    }}>
                      {act.label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
