/**
 * OtherApproversPanel.tsx
 * Shared approver-builder for Section 10 (Others).
 * Used by both Intake.tsx (RequirementsTab) and DiscoveryQuestions.tsx.
 */

import { useState } from "react";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OthApproverTab {
  id: string;
  title: string;
  content: string;
}

export interface OthApprover {
  id: string;
  name: string;
  description: string;
  tabs: OthApproverTab[];
  saved: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function makeDefaultApprover(): OthApprover {
  return {
    id: `oth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    description: "",
    tabs: [
      { id: "tab-trigger",  title: "Trigger Condition",   content: "" },
      { id: "tab-sequence", title: "Sequence / Position", content: "" },
      { id: "tab-notes",    title: "Notes",               content: "" },
    ],
    saved: false,
  };
}

const OTH_APPROVERS_KEY = (type: string) => `discovery_oth_approvers_${type}`;

export function loadApprovers(type: string): OthApprover[] {
  try {
    const raw = localStorage.getItem(OTH_APPROVERS_KEY(type));
    return raw ? (JSON.parse(raw) as OthApprover[]) : [];
  } catch {
    return [];
  }
}

export function saveApprovers(type: string, approvers: OthApprover[]) {
  localStorage.setItem(OTH_APPROVERS_KEY(type), JSON.stringify(approvers));
  window.dispatchEvent(new Event("storage"));
}

// ── Single approver card with tabs ────────────────────────────────────────────

function ApproverCard({
  approver,
  index,
  color,
  onChange,
  onRemove,
}: {
  approver: OthApprover;
  index: number;
  color: string;
  onChange: (updated: OthApprover) => void;
  onRemove: () => void;
}) {
  const [activeTab, setActiveTab]       = useState(approver.tabs[0]?.id ?? "");
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  const update = (patch: Partial<OthApprover>) =>
    onChange({ ...approver, ...patch, saved: false });

  const updateTab = (tabId: string, patch: Partial<OthApproverTab>) =>
    update({ tabs: approver.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)) });

  const addTab = () => {
    const newTab: OthApproverTab = { id: `tab-${Date.now()}`, title: "New Tab", content: "" };
    onChange({ ...approver, tabs: [...approver.tabs, newTab], saved: false });
    setActiveTab(newTab.id);
    setEditingTabId(newTab.id);
  };

  const removeTab = (tabId: string) => {
    const remaining = approver.tabs.filter((t) => t.id !== tabId);
    update({ tabs: remaining });
    if (activeTab === tabId) setActiveTab(remaining[0]?.id ?? "");
  };

  const currentTab = approver.tabs.find((t) => t.id === activeTab) ?? approver.tabs[0];

  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    color: "#161616",
    background: "#fafafa",
    border: "1px solid #e0e0e0",
    borderBottom: `2px solid ${filled ? color : "#c6c6c6"}`,
    outline: "none",
    fontFamily: "'IBM Plex Sans', sans-serif",
    boxSizing: "border-box",
    transition: "border-bottom-color 0.15s",
  });

  return (
    <div style={{
      background: "#ffffff",
      border: `1px solid ${approver.saved ? color + "66" : "#e0e0e0"}`,
      borderLeft: `4px solid ${approver.saved ? color : "#c6c6c6"}`,
      boxShadow: approver.saved ? `0 0 0 1px ${color}22` : "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}>
      {/* Card header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px",
        background: approver.saved ? color + "0c" : "#f4f4f4",
        borderBottom: "1px solid #e0e0e0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            color: approver.saved ? color : "#8d8d8d",
            textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace",
          }}>
            Approver {String(index + 1).padStart(2, "0")}
          </span>
          {approver.saved && (
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 600, color,
              padding: "1px 7px", background: color + "18", border: `1px solid ${color}44`,
            }}>
              <CheckCircle2 size={9} /> Saved
            </span>
          )}
          {approver.name && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>— {approver.name}</span>
          )}
        </div>
        <button type="button" onClick={onRemove} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 10px", fontSize: 11,
          background: "transparent", color: "#da1e28",
          border: "1px solid #da1e2844", cursor: "pointer",
          fontFamily: "'IBM Plex Sans', sans-serif", transition: "background 0.1s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Trash2 size={11} /> Remove
        </button>
      </div>

      {/* Name + description */}
      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#525252", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Approver Name / Title <span style={{ color: "#da1e28" }}>*</span>
            </label>
            <input type="text" value={approver.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="e.g., Chief Financial Officer"
              style={inputStyle(!!approver.name)}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = color; e.currentTarget.style.background = "#fff"; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = approver.name ? color : "#c6c6c6"; e.currentTarget.style.background = "#fafafa"; }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#525252", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Role / Department
            </label>
            <input type="text" value={approver.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="e.g., Finance — executive sign-off"
              style={inputStyle(!!approver.description)}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = color; e.currentTarget.style.background = "#fff"; }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = approver.description ? color : "#c6c6c6"; e.currentTarget.style.background = "#fafafa"; }}
            />
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div style={{
        display: "flex", alignItems: "flex-end",
        padding: "14px 20px 0", borderBottom: "2px solid #e0e0e0", overflowX: "auto",
      }}>
        {approver.tabs.map((tab) => {
          const isActive = tab.id === (currentTab?.id ?? "");
          return (
            <div key={tab.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <button type="button" onClick={() => { setActiveTab(tab.id); setEditingTabId(null); }} style={{
                padding: "7px 14px", fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? color : "#525252",
                background: isActive ? "#ffffff" : "transparent",
                border: "none",
                borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                marginBottom: -2, cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif", whiteSpace: "nowrap",
              }}>
                {editingTabId === tab.id ? (
                  <input autoFocus type="text" value={tab.title}
                    onChange={(e) => updateTab(tab.id, { title: e.target.value })}
                    onBlur={() => setEditingTabId(null)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingTabId(null); }}
                    style={{
                      fontSize: 12, fontWeight: 600, color,
                      background: "transparent", border: "none", outline: "none",
                      fontFamily: "inherit", width: Math.max(60, tab.title.length * 8),
                    }}
                  />
                ) : tab.title}
              </button>
              {isActive && (
                <div style={{ display: "flex", gap: 2, paddingRight: 6, marginBottom: -2 }}>
                  <button type="button" title="Rename tab" onClick={() => setEditingTabId(tab.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", color: "#8d8d8d", lineHeight: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                    </svg>
                  </button>
                  {approver.tabs.length > 1 && (
                    <button type="button" title="Remove tab" onClick={() => removeTab(tab.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", color: "#da1e28", lineHeight: 1 }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <button type="button" onClick={addTab} style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "7px 10px", fontSize: 11, color: "#525252",
          background: "transparent", border: "none", cursor: "pointer",
          marginBottom: -2, fontFamily: "'IBM Plex Sans', sans-serif",
          whiteSpace: "nowrap", flexShrink: 0,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = color; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
        >
          <Plus size={11} strokeWidth={2.5} /> Add Tab
        </button>
      </div>

      {/* Tab content */}
      <div style={{ padding: "14px 20px 16px" }}>
        {currentTab ? (
          <textarea value={currentTab.content}
            onChange={(e) => updateTab(currentTab.id, { content: e.target.value })}
            rows={4} placeholder={`Enter details for "${currentTab.title}"…`}
            style={{
              width: "100%", padding: "10px 12px", fontSize: 13, color: "#161616",
              background: "#fafafa", border: "1px solid #e0e0e0",
              borderBottom: `2px solid ${currentTab.content ? color : "#c6c6c6"}`,
              outline: "none", resize: "vertical",
              fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.6,
              boxSizing: "border-box", transition: "border-bottom-color 0.15s",
            }}
            onFocus={(e) => { e.currentTarget.style.borderBottomColor = color; e.currentTarget.style.background = "#fff"; }}
            onBlur={(e) => { e.currentTarget.style.borderBottomColor = currentTab.content ? color : "#c6c6c6"; e.currentTarget.style.background = "#fafafa"; }}
          />
        ) : (
          <p style={{ fontSize: 12, color: "#8d8d8d", margin: 0 }}>No tabs — click "+ Add Tab" to add one.</p>
        )}
      </div>

      {/* Save button */}
      <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" onClick={() => onChange({ ...approver, saved: true })}
          disabled={!approver.name.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 18px",
            background: approver.name.trim() ? color : "#e0e0e0",
            color: approver.name.trim() ? "#ffffff" : "#8d8d8d",
            border: "none", cursor: approver.name.trim() ? "pointer" : "not-allowed",
            fontSize: 13, fontWeight: 600,
            fontFamily: "'IBM Plex Sans', sans-serif", transition: "opacity 0.1s",
          }}
          onMouseEnter={(e) => { if (approver.name.trim()) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <CheckCircle2 size={13} />
          {approver.saved ? "Saved" : "Save Approver"}
        </button>
        {!approver.name.trim() && (
          <span style={{ fontSize: 11, color: "#8d8d8d", fontStyle: "italic" }}>Enter a name to save</span>
        )}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function OtherApproversPanel({
  color,
  approvers,
  onApproversChange,
}: {
  color: string;
  approvers: OthApprover[];
  onApproversChange: (updated: OthApprover[]) => void;
}) {
  const add    = () => onApproversChange([...approvers, makeDefaultApprover()]);
  const update = (id: string, a: OthApprover) => onApproversChange(approvers.map((x) => (x.id === id ? a : x)));
  const remove = (id: string) => onApproversChange(approvers.filter((x) => x.id !== id));
  const savedCount = approvers.filter((a) => a.saved).length;

  return (
    <div style={{
      border: `2px solid ${color}33`, borderLeft: `4px solid ${color}`,
      background: "#f4f4f4", padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* Heading */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Plus size={14} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#161616" }}>Agency-Specific Approvers</p>
            <p style={{ margin: 0, fontSize: 11, color: "#525252", marginTop: 1 }}>
              Add, configure, and save each custom approver below.
              {approvers.length > 0 && (
                <span style={{ marginLeft: 6, fontWeight: 600, color: savedCount === approvers.length ? "#24a148" : color }}>
                  {savedCount}/{approvers.length} saved.
                </span>
              )}
            </p>
          </div>
        </div>
        <button type="button" onClick={add} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
          background: color, color: "#ffffff", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif",
          letterSpacing: "0.02em", transition: "opacity 0.1s", flexShrink: 0,
        }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add Approver
        </button>
      </div>

      {/* Empty state */}
      {approvers.length === 0 && (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#8d8d8d", margin: "0 0 4px" }}>No approvers added yet.</p>
          <p style={{ fontSize: 11, color: "#a8a8a8", margin: 0 }}>Click "Add Approver" to document an agency-specific approval step.</p>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {approvers.map((a, i) => (
          <ApproverCard key={a.id} approver={a} index={i} color={color}
            onChange={(updated) => update(a.id, updated)}
            onRemove={() => remove(a.id)}
          />
        ))}
      </div>

      {/* Bottom add */}
      {approvers.length > 0 && (
        <button type="button" onClick={add} style={{
          display: "flex", alignItems: "center", gap: 7,
          alignSelf: "flex-start", padding: "9px 18px",
          background: "transparent", color, border: `1px solid ${color}`,
          cursor: "pointer", fontSize: 13, fontWeight: 600,
          fontFamily: "'IBM Plex Sans', sans-serif", transition: "background 0.1s",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = color + "10"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add Another Approver
        </button>
      )}
    </div>
  );
}
