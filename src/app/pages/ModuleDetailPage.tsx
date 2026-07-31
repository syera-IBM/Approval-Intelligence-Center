/**
 * ModuleDetailPage.tsx
 *
 * Fourth level — the activity hub for a specific module
 * (e.g., Requisitions → Approval Workflow, KDD Requirements, Process Flows, Decks).
 *
 * For Requisitions this mirrors the existing Home/ApprovalType experience
 * but is now contextualised under Industry > FA > Module.
 */

import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, ArrowRight, Lock, ExternalLink } from "lucide-react";
import { getIndustry, getFunctionalArea, getModule, FA_SHORT } from "../data/taxonomy";

const SANS = "'IBM Plex Sans', sans-serif";

export default function ModuleDetailPage() {
  const { industrySlug, faSlug, moduleSlug } = useParams<{
    industrySlug: string;
    faSlug: string;
    moduleSlug: string;
  }>();
  const navigate = useNavigate();

  const industry  = getIndustry(industrySlug ?? "");
  const fa        = industry ? getFunctionalArea(industry, faSlug ?? "") : undefined;
  const mod       = fa ? getModule(fa, moduleSlug ?? "") : undefined;

  if (!industry || !fa || !mod) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: SANS }}>
        <p style={{ color: "#525252" }}>Module not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Back</button>
      </div>
    );
  }

  const ModIcon       = mod.icon;
  const IndustryIcon  = industry.icon;
  const FAIcon        = fa.icon;

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
          <ChevronRight size={11} style={{ color: "#c6c6c6" }} />
          <button
            onClick={() => navigate(`/industry/${industrySlug}/${faSlug}`)}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#525252", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
          >
            {mod.label}
          </button>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 52, height: 52,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${mod.color}14`,
            border: `1px solid ${mod.color}30`,
            flexShrink: 0,
          }}>
            <ModIcon size={22} style={{ color: mod.color }} strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: mod.color, letterSpacing: "0.09em", margin: "0 0 3px", textTransform: "uppercase" }}>
              {industry.label} · {FA_SHORT[fa.slug] ?? fa.label} · MODULE
            </p>
            <h1 style={{ fontSize: 21, fontWeight: 400, color: "#161616", margin: "0 0 5px" }}>
              {mod.label}
            </h1>
            <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, margin: 0, maxWidth: 540 }}>
              {mod.description}
            </p>
          </div>
        </div>
      </div>

      {/* Activity tiles */}
      <div style={{ padding: "28px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 14, textTransform: "uppercase" }}>
          Activities
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 1, background: "#e0e0e0", border: "1px solid #e0e0e0" }}>
          {mod.activities.map((act) => {
            return (
              <button
                key={act.slug}
                onClick={() => act.available && navigate(act.route)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  padding: "20px 18px",
                  background: "#ffffff",
                  border: "none",
                  cursor: act.available ? "pointer" : "default",
                  opacity: act.available ? 1 : 0.55,
                  borderTop: "3px solid transparent",
                  transition: "background 0.15s, border-top-color 0.15s",
                  fontFamily: SANS,
                }}
                onMouseEnter={(e) => {
                  if (!act.available) return;
                  e.currentTarget.style.background = "#f4f4f4";
                  e.currentTarget.style.borderTopColor = mod.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderTopColor = "transparent";
                }}
              >
                {/* Status badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", letterSpacing: "0.07em",
                    background: act.available ? `${mod.color}12` : "#f4f4f4",
                    color: act.available ? mod.color : "#8d8d8d",
                    border: `1px solid ${act.available ? mod.color + "30" : "#e0e0e0"}`,
                    textTransform: "uppercase",
                  }}>
                    {act.available ? "Available" : "Coming Soon"}
                  </span>
                  {act.available
                    ? <ArrowRight size={13} style={{ color: mod.color }} />
                    : <Lock size={12} style={{ color: "#c6c6c6" }} />
                  }
                </div>

                {/* Activity name */}
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#161616", margin: "0 0 6px", lineHeight: 1.3 }}>
                  {act.label}
                </h3>

                {/* Description */}
                <p style={{ fontSize: 12, color: "#525252", lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {act.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Context note */}
        <div style={{ marginTop: 20, padding: "12px 16px", background: "#edf5ff", border: "1px solid #d0e2ff", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <ExternalLink size={13} style={{ color: "#0f62fe", marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#0043ce", margin: 0, lineHeight: 1.6 }}>
            Activities open the full approval workflow configuration for <strong>{mod.label}</strong> in the context of <strong>{industry.label}</strong>.
            All KDD questionnaire responses and generated process flows are specific to this industry and module combination.
          </p>
        </div>
      </div>

      {/* Other modules in this FA */}
      <div style={{ padding: "0 32px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8d8d8d", letterSpacing: "0.08em", marginBottom: 12, textTransform: "uppercase" }}>
          Other {FA_SHORT[fa.slug] ?? fa.label} Modules
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {fa.modules.filter((m) => m.slug !== moduleSlug).map((m) => {
            const MIcon = m.icon;
            const avail = m.activities.some((a) => a.available);
            return (
              <button
                key={m.slug}
                onClick={() => avail && navigate(`/industry/${industrySlug}/${faSlug}/${m.slug}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 14px", fontSize: 12,
                  background: "#ffffff", color: avail ? "#161616" : "#8d8d8d",
                  border: "1px solid #e0e0e0",
                  cursor: avail ? "pointer" : "default",
                  fontFamily: SANS, opacity: avail ? 1 : 0.6,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (avail) e.currentTarget.style.background = "#f4f4f4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
              >
                <MIcon size={13} style={{ color: avail ? m.color : "#c6c6c6" }} strokeWidth={1.5} />
                {m.label}
                {!avail && <Lock size={10} style={{ color: "#c6c6c6" }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
