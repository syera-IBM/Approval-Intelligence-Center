/**
 * RosterPanel.tsx
 *
 * Generic roster table widget used for Gatekeeper and Cost Center Manager
 * roster questions in the KDD questionnaire.
 *
 * Features:
 *  - Download an Excel template pre-populated with column headers
 *  - Upload a filled-in Excel file — rows are parsed and stored in localStorage
 *  - Manual inline add / edit / delete rows
 *  - All roster data is keyed by `rosterKey` in localStorage so it persists
 *    and can be included in the final process-flow Excel export
 */

import { useState, useRef } from "react";
import { Download, Upload, Plus, Trash2 } from "lucide-react";
import { read, utils } from "xlsx";
import { downloadRosterTemplate } from "../data/xlsxFormatter";

const SANS = "'IBM Plex Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RosterRow = Record<string, string>;

// ── localStorage helpers ──────────────────────────────────────────────────────

const rosterStorageKey = (slug: string, key: string) => `roster_${slug}_${key}`;

export function loadRoster(slug: string, rosterKey: string): RosterRow[] {
  try {
    const raw = localStorage.getItem(rosterStorageKey(slug, rosterKey));
    return raw ? (JSON.parse(raw) as RosterRow[]) : [];
  } catch {
    return [];
  }
}

export function saveRoster(slug: string, rosterKey: string, rows: RosterRow[]): void {
  localStorage.setItem(rosterStorageKey(slug, rosterKey), JSON.stringify(rows));
  window.dispatchEvent(new Event("storage"));
}

// ── RosterPanel ───────────────────────────────────────────────────────────────

export function RosterPanel({
  slug,
  rosterKey,
  columns,
  color,
  label,
}: {
  slug: string;
  rosterKey: string;
  columns: string[];
  color: string;
  label: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRowsState] = useState<RosterRow[]>(() => loadRoster(slug, rosterKey));

  const setRows = (updated: RosterRow[]) => {
    saveRoster(slug, rosterKey, updated);
    setRowsState(updated);
  };

  // ── Download template ──
  const downloadTemplate = () => {
    downloadRosterTemplate(slug, rosterKey, columns, label);
  };

  // ── Upload filled template ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        // Normalise: match uploaded column headers case-insensitively
        const normalised: RosterRow[] = rawRows.map((raw) => {
          const out: RosterRow = {};
          for (const col of columns) {
            const match = Object.keys(raw).find(
              (k) => k.trim().toLowerCase() === col.toLowerCase(),
            );
            out[col] = match ? String(raw[match] ?? "") : "";
          }
          return out;
        });
        // Drop blank rows
        const filtered = normalised.filter((r) => columns.some((c) => r[c]?.trim()));
        setRows(filtered);
      } catch {
        alert("Could not parse the uploaded file. Please use the downloaded template.");
      }
      // Reset so the same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Manual row operations ──
  const addRow = () => {
    const blank: RosterRow = Object.fromEntries(columns.map((c) => [c, ""]));
    setRows([...rows, blank]);
  };

  const updateCell = (rowIdx: number, col: string, val: string) => {
    setRows(rows.map((r, i) => (i === rowIdx ? { ...r, [col]: val } : r)));
  };

  const deleteRow = (rowIdx: number) => {
    setRows(rows.filter((_, i) => i !== rowIdx));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "5px 8px",
    fontSize: 12,
    border: "none",
    borderBottom: "1px solid #e0e0e0",
    outline: "none",
    fontFamily: SANS,
    background: "transparent",
    boxSizing: "border-box",
  };

  return (
    <div style={{ border: `1px solid ${color}44`, borderLeft: `3px solid ${color}`, background: "#fafafa", marginTop: 8 }}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, padding: "10px 16px", borderBottom: "1px solid #e0e0e0", background: "#f4f4f4" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color, margin: 0, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</p>
          <p style={{ fontSize: 11, color: "#8d8d8d", margin: 0 }}>
            {rows.length} row{rows.length !== 1 ? "s" : ""} · Columns: {columns.join(", ")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* Download template */}
          <button type="button" onClick={downloadTemplate}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, fontFamily: SANS, background: "#ffffff", color, border: `1px solid ${color}`, cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = color + "10"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}>
            <Download size={11} /> Download Template
          </button>
          {/* Upload */}
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, fontFamily: SANS, background: color, color: "#ffffff", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
            <Upload size={11} /> Upload Filled Template
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
      </div>

      {/* Table */}
      {rows.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: SANS }}>
            <thead>
              <tr style={{ background: "#f4f4f4", borderBottom: "1px solid #e0e0e0" }}>
                <th style={{ width: 32, padding: "6px 8px", textAlign: "center", fontSize: 10, fontFamily: MONO, color: "#8d8d8d", fontWeight: 400, borderRight: "1px solid #e0e0e0" }}>#</th>
                {columns.map((col) => (
                  <th key={col} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color, letterSpacing: "0.07em", textTransform: "uppercase", borderRight: "1px solid #e0e0e0", whiteSpace: "nowrap" }}>{col}</th>
                ))}
                <th style={{ width: 36, padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid #e0e0e0", background: ri % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                  <td style={{ padding: "4px 8px", textAlign: "center", fontSize: 10, fontFamily: MONO, color: "#8d8d8d", borderRight: "1px solid #e0e0e0" }}>{ri + 1}</td>
                  {columns.map((col) => (
                    <td key={col} style={{ padding: "2px 4px", borderRight: "1px solid #e0e0e0" }}>
                      <input
                        type="text"
                        value={row[col] ?? ""}
                        onChange={(e) => updateCell(ri, col, e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderBottomColor = color; }}
                        onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#e0e0e0"; }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: "4px 6px", textAlign: "center" }}>
                    <button type="button" onClick={() => deleteRow(ri)} title="Remove row"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#da1e28", display: "flex", alignItems: "center" }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: "16px 20px", color: "#8d8d8d", fontSize: 12, textAlign: "center" }}>
          No rows yet — download the template, fill it in, and upload, or add rows manually below.
        </div>
      )}

      {/* Add row */}
      <div style={{ padding: "8px 16px", borderTop: rows.length > 0 ? "1px solid #e0e0e0" : "none" }}>
        <button type="button" onClick={addRow}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, fontFamily: SANS, background: "transparent", color, border: `1px solid ${color}`, cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = color + "10"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          <Plus size={11} /> Add Row Manually
        </button>
      </div>
    </div>
  );
}
