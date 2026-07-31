/**
 * xlsxFormatter.ts
 *
 * Shared IBM-styled Excel workbook helpers built on ExcelJS.
 *
 * IBM Design Language palette used:
 *   Blue 70  (#0043ce) — primary header background
 *   Blue 10  (#edf5ff) — section header background / alternate rows
 *   Gray 100 (#161616) — primary body text
 *   Gray 70  (#525252) — secondary text
 *   Gray 10  (#f4f4f4) — alternate row fill
 *   White    (#ffffff) — default row fill
 *   Green 50 (#24a148) — "Yes" / complete badge
 *   Red 60   (#da1e28) — "No" / risk badge
 *   Orange 50 (#ff832b) — warning / high badge
 *   Yellow 30 (#f1c21b) — medium badge
 *
 * Category colours for process-flow rows:
 *   initiation  #0f62fe  (Blue 60)
 *   validation  #8a3ffc  (Purple 60)
 *   approval    #009d9a  (Teal 50)
 *   legal       #ba4e00  (Orange 60)
 *   executive   #da1e28  (Red 60)
 *   system      #8d8d8d  (Gray 50)
 *   completion  #24a148  (Green 50)
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { GeneratedWorkflow } from "./workflowEngine";
import type { RosterRow } from "../components/RosterPanel";

// ── Palette ───────────────────────────────────────────────────────────────────

const P = {
  headerBg:     "FF0043CE", // IBM Blue 70
  headerFg:     "FFFFFFFF", // White
  sectionBg:    "FFEDF5FF", // IBM Blue 10
  sectionFg:    "FF0043CE", // IBM Blue 70
  rowAlt:       "FFF4F4F4", // IBM Gray 10
  rowBase:      "FFFFFFFF", // White
  bodyFg:       "FF161616", // IBM Gray 100
  mutedFg:      "FF525252", // IBM Gray 70
  borderColor:  "FFE0E0E0", // IBM Gray 20
  accentGreen:  "FF24A148", // IBM Green 50
  accentRed:    "FFDA1E28", // IBM Red 60
  accentOrange: "FFFF832B", // IBM Orange 50
  accentYellow: "FFF1C21B", // IBM Yellow 30
  accentBlue:   "FF0F62FE", // IBM Blue 60
  accentPurple: "FF8A3FFC", // IBM Purple 60
  accentTeal:   "FF009D9A", // IBM Teal 50
  accentBrown:  "FFBA4E00", // IBM Orange 60
} as const;

// ── Category → colour map ─────────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  initiation:  P.accentBlue,
  validation:  P.accentPurple,
  approval:    P.accentTeal,
  legal:       P.accentBrown,
  executive:   P.accentRed,
  system:      "FF8D8D8D",
  completion:  P.accentGreen,
};

// ── Risk → colour map ─────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  Low:      P.accentGreen,
  Medium:   P.accentYellow,
  High:     P.accentOrange,
  Critical: P.accentRed,
};

// ── Border helper ─────────────────────────────────────────────────────────────

function thinBorder(color = P.borderColor): Partial<ExcelJS.Borders> {
  const side: ExcelJS.BorderStyle = "thin";
  const s = { style: side, color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
}

// ── Font helpers ──────────────────────────────────────────────────────────────

function headerFont(size = 11): Partial<ExcelJS.Font> {
  return { name: "Calibri", size, bold: true, color: { argb: P.headerFg } };
}
function bodyFont(size = 10, bold = false, color = P.bodyFg): Partial<ExcelJS.Font> {
  return { name: "Calibri", size, bold, color: { argb: color } };
}

// ── Apply header row style ────────────────────────────────────────────────────

function styleHeaderRow(row: ExcelJS.Row, bgArgb = P.headerBg, fgArgb = P.headerFg, sz = 11) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: "Calibri", size: sz, bold: true, color: { argb: fgArgb } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cell.border = thinBorder("FFB0C8F0");
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
  });
}

// ── Apply body row style ──────────────────────────────────────────────────────

function styleBodyRow(row: ExcelJS.Row, alt: boolean, rowHeight = 15) {
  row.height = rowHeight;
  const bg = alt ? P.rowAlt : P.rowBase;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.border = thinBorder();
    cell.font = bodyFont();
    cell.alignment = { vertical: "top", wrapText: true };
  });
}

// ── Apply section-label row style ─────────────────────────────────────────────

function styleSectionRow(row: ExcelJS.Row, label: string, colCount: number) {
  row.height = 20;
  // Merge across all columns
  const ws = row.worksheet;
  const r = row.number;
  ws.mergeCells(r, 1, r, colCount);
  const cell = row.getCell(1);
  cell.value = label;
  cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: P.sectionFg }, italic: false };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: P.sectionBg } };
  cell.border = thinBorder("FFB0C8F0");
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

// ── Freeze top row ─────────────────────────────────────────────────────────────

function freezeTopRow(ws: ExcelJS.Worksheet) {
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 1, activeCell: "A2" }];
}

// ── Auto-filter on header row ──────────────────────────────────────────────────

function addAutoFilter(ws: ExcelJS.Worksheet, cols: number) {
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols } };
}

// ── Save workbook to file ─────────────────────────────────────────────────────

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Downloads the KDD Requirements workbook.
 * Sheets: Cover | Requirements (grouped by section) | Gatekeeper Roster | CC Manager Roster
 */
export async function downloadRequirementsXlsx(
  typeSlug: string,
  typeLabel: string,
  visibleQuestions: { id: string; section: string; question: string; inputType: string; rosterKey?: string; rosterColumns?: string[] }[],
  answers: Record<string, string>,
  rosters: { gatekeeper: RosterRow[]; ccManager: RosterRow[] },
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Oracle Fusion SCM — Approval Workflow Intelligence Center";
  wb.created = new Date();

  // ── Cover sheet ────────────────────────────────────────────────────────────
  const cover = wb.addWorksheet("Cover");
  cover.views = [{ showGridLines: false }];
  cover.getColumn(1).width = 60;
  cover.getColumn(2).width = 40;

  const addCoverRow = (label: string, value: string, isBig = false) => {
    const r = cover.addRow([label, value]);
    r.getCell(1).font = isBig
      ? { name: "Calibri", size: 14, bold: true, color: { argb: P.bodyFg } }
      : bodyFont(10, true);
    r.getCell(2).font = isBig
      ? { name: "Calibri", size: 14, color: { argb: P.mutedFg } }
      : bodyFont(10, false, P.mutedFg);
    r.height = isBig ? 28 : 18;
  };

  // Title block
  const titleRow = cover.addRow(["Oracle Fusion SCM — KDD Requirements"]);
  cover.mergeCells(titleRow.number, 1, titleRow.number, 2);
  titleRow.getCell(1).font = { name: "Calibri", size: 18, bold: true, color: { argb: P.headerBg } };
  titleRow.height = 36;

  cover.addRow([]);

  addCoverRow("Approval Type", typeLabel, true);
  addCoverRow("Export Date", new Date().toLocaleString());
  addCoverRow("Questions Answered",
    String(visibleQuestions.filter((q) => q.inputType !== "roster" && (answers[q.id] ?? "").trim()).length) +
    " of " + String(visibleQuestions.filter((q) => q.inputType !== "roster").length));

  cover.addRow([]);

  const noteRow = cover.addRow(["This document contains the KDD requirements questionnaire responses for the above approval type."]);
  cover.mergeCells(noteRow.number, 1, noteRow.number, 2);
  noteRow.getCell(1).font = bodyFont(9, false, P.mutedFg);
  noteRow.getCell(1).alignment = { wrapText: true };

  // ── Requirements sheet ────────────────────────────────────────────────────
  const reqWs = wb.addWorksheet("Requirements");
  freezeTopRow(reqWs);

  const reqCols = [
    { header: "KDD ID",   key: "id",       width: 14 },
    { header: "Section",  key: "section",  width: 32 },
    { header: "Question", key: "question", width: 72 },
    { header: "Answer",   key: "answer",   width: 62 },
  ];
  reqWs.columns = reqCols.map((c) => ({ key: c.key, width: c.width }));
  reqWs.getColumn("answer").alignment = { wrapText: true, vertical: "top" };
  reqWs.getColumn("question").alignment = { wrapText: true, vertical: "top" };

  // Header row
  const reqHeader = reqWs.addRow(reqCols.map((c) => c.header));
  styleHeaderRow(reqHeader);
  addAutoFilter(reqWs, reqCols.length);

  // Body — group by section, emit section label rows
  const nonRosterQs = visibleQuestions.filter((q) => q.inputType !== "roster");
  let lastSection = "";
  let altRow = false;
  for (const q of nonRosterQs) {
    if (q.section !== lastSection) {
      lastSection = q.section;
      const sRow = reqWs.addRow([]);
      styleSectionRow(sRow, q.section, reqCols.length);
      altRow = false;
    }
    const answer = (answers[q.id] ?? "").trim();
    const dataRow = reqWs.addRow([q.id, q.section, q.question, answer]);
    styleBodyRow(dataRow, altRow, answer.length > 80 ? 40 : answer.length > 40 ? 25 : 18);
    // Bold the ID cell
    dataRow.getCell(1).font = { ...bodyFont(), bold: true, color: { argb: P.accentBlue } };
    // Colour answered vs unanswered
    if (!answer) {
      dataRow.getCell(4).font = { ...bodyFont(), color: { argb: "FFAAAAAA" }, italic: true };
      dataRow.getCell(4).value = "(not answered)";
    } else {
      dataRow.getCell(4).font = { ...bodyFont(), color: { argb: P.bodyFg } };
    }
    altRow = !altRow;
  }

  // ── Gatekeeper Roster sheet ───────────────────────────────────────────────
  if (rosters.gatekeeper.length > 0) {
    const gkCols = ["Department", "Division", "Gatekeeper", "Backup Gatekeeper"];
    buildRosterSheet(wb, "Gatekeeper Roster", gkCols, rosters.gatekeeper, P.accentTeal);
  }

  // ── CC Manager Roster sheet ───────────────────────────────────────────────
  if (rosters.ccManager.length > 0) {
    const ccCols = ["Department", "Division", "Cost Center", "CC Manager", "Backup Mgr"];
    buildRosterSheet(wb, "CC Manager Roster", ccCols, rosters.ccManager, P.accentBlue);
  }

  await saveWorkbook(wb, `${typeSlug}-requirements.xlsx`);
}


/**
 * Downloads the Process Flow workbook.
 * Sheets: Cover | Summary | Process Flow | Requirements | Gatekeeper Roster | CC Manager Roster | Discovery
 */
export async function downloadProcessFlowXlsx(
  wf: GeneratedWorkflow,
  steps: GeneratedWorkflow["steps"],
  rosters: { gatekeeper: RosterRow[]; ccManager: RosterRow[] },
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Oracle Fusion SCM — Approval Workflow Intelligence Center";
  wb.created = new Date();

  // ── Cover ──────────────────────────────────────────────────────────────────
  const cover = wb.addWorksheet("Cover");
  cover.views = [{ showGridLines: false }];
  cover.getColumn(1).width = 36;
  cover.getColumn(2).width = 54;

  const titleRow = cover.addRow(["Oracle Fusion SCM — Approval Process Flow"]);
  cover.mergeCells(titleRow.number, 1, titleRow.number, 2);
  titleRow.getCell(1).font = { name: "Calibri", size: 18, bold: true, color: { argb: P.headerBg } };
  titleRow.height = 36;
  cover.addRow([]);

  const metaRows: [string, string][] = [
    ["Approval Type",   wf.label],
    ["Risk Level",      wf.riskLevel],
    ["Estimated SLA",   wf.estimatedSLA],
    ["Total Approvers", String(wf.totalApprovers)],
    ["Total Steps",     String(steps.length)],
    ["Generated",       new Date(wf.generatedAt).toLocaleString()],
    ["Export Date",     new Date().toLocaleString()],
  ];
  for (const [label, value] of metaRows) {
    const r = cover.addRow([label, value]);
    r.getCell(1).font = bodyFont(10, true);
    r.getCell(2).font = bodyFont(10, false, P.mutedFg);
    r.height = 18;
    // Risk level — colour the value cell
    if (label === "Risk Level") {
      const rc = RISK_COLOR[value] ?? P.mutedFg;
      r.getCell(2).font = { name: "Calibri", size: 10, bold: true, color: { argb: rc } };
    }
  }

  if (wf.summaryNotes.length > 0) {
    cover.addRow([]);
    const notesHeader = cover.addRow(["Notes"]);
    notesHeader.getCell(1).font = bodyFont(10, true, P.accentBlue);
    for (const note of wf.summaryNotes) {
      const nr = cover.addRow(["", note]);
      cover.mergeCells(nr.number, 2, nr.number, 2);
      nr.getCell(2).font = bodyFont(9, false, P.mutedFg);
      nr.getCell(2).alignment = { wrapText: true };
      nr.height = 22;
    }
  }

  // ── Summary sheet ──────────────────────────────────────────────────────────
  const sumWs = wb.addWorksheet("Summary");
  sumWs.views = [{ showGridLines: false }];
  sumWs.getColumn(1).width = 26;
  sumWs.getColumn(2).width = 80;

  const sumHeader = sumWs.addRow(["Field", "Value"]);
  styleHeaderRow(sumHeader);

  const sumData: [string, string | number][] = [
    ["Approval Type",   wf.label],
    ["Risk Level",      wf.riskLevel],
    ["Estimated SLA",   wf.estimatedSLA],
    ["Total Approvers", wf.totalApprovers],
    ["Total Steps",     steps.length],
    ["Generated",       new Date(wf.generatedAt).toLocaleString()],
    ["Notes",           wf.summaryNotes.join(" | ")],
  ];
  sumData.forEach(([f, v], i) => {
    const r = sumWs.addRow([f, String(v)]);
    r.height = 18;
    r.getCell(1).font = bodyFont(10, true);
    r.getCell(2).font = bodyFont(10);
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? P.rowBase : P.rowAlt } };
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? P.rowBase : P.rowAlt } };
    r.getCell(1).border = thinBorder();
    r.getCell(2).border = thinBorder();
    if (f === "Risk Level") {
      const rc = RISK_COLOR[String(v)] ?? P.mutedFg;
      r.getCell(2).font = { name: "Calibri", size: 10, bold: true, color: { argb: rc } };
    }
  });

  // ── Process Flow sheet ─────────────────────────────────────────────────────
  const flowWs = wb.addWorksheet("Process Flow");
  freezeTopRow(flowWs);

  const flowCols = [
    { header: "Step",        key: "step",        width: 7  },
    { header: "Category",    key: "category",    width: 14 },
    { header: "Title",       key: "title",       width: 36 },
    { header: "Actor",       key: "actor",       width: 30 },
    { header: "Role",        key: "role",        width: 22 },
    { header: "SLA",         key: "sla",         width: 18 },
    { header: "System",      key: "system",      width: 22 },
    { header: "Action",      key: "action",      width: 56 },
    { header: "Conditions",  key: "conditions",  width: 50 },
    { header: "Description", key: "description", width: 72 },
    { header: "Required",    key: "required",    width: 10 },
  ];
  flowWs.columns = flowCols.map((c) => ({ key: c.key, width: c.width }));

  const flowHeader = flowWs.addRow(flowCols.map((c) => c.header));
  styleHeaderRow(flowHeader);
  addAutoFilter(flowWs, flowCols.length);

  const approverSteps = steps.filter(
    (s) => s.category === "approval" || s.category === "legal" || s.category === "executive",
  );

  approverSteps.forEach((s, i) => {
    const isAlt = i % 2 !== 0;
    const r = flowWs.addRow([
      i + 1, s.category.toUpperCase(), s.title, s.actor, s.role,
      s.sla, s.system, s.action, s.conditions, s.description,
      s.required ? "Yes" : "No",
    ]);
    styleBodyRow(r, isAlt, s.description.length > 120 ? 52 : s.description.length > 60 ? 36 : 22);

    // Step # — bold + blue
    r.getCell(1).font = bodyFont(10, true, P.accentBlue);
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    // Category — coloured badge text
    const catColor = CAT_COLOR[s.category.toLowerCase()] ?? P.mutedFg;
    r.getCell(2).font = { name: "Calibri", size: 9, bold: true, color: { argb: catColor } };
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: catColor + "1A" } };

    // Title — bold
    r.getCell(3).font = bodyFont(10, true);

    // Required — colour
    const reqColor = s.required ? P.accentGreen : P.mutedFg;
    r.getCell(11).font = { name: "Calibri", size: 10, bold: true, color: { argb: reqColor } };
    r.getCell(11).alignment = { horizontal: "center", vertical: "middle" };
  });

  // All steps sheet (initiation → completion)
  const allWs = wb.addWorksheet("All Steps");
  freezeTopRow(allWs);
  allWs.columns = flowCols.map((c) => ({ key: c.key, width: c.width }));
  const allHeader = allWs.addRow(flowCols.map((c) => c.header));
  styleHeaderRow(allHeader);
  addAutoFilter(allWs, flowCols.length);

  steps.forEach((s, i) => {
    const isAlt = i % 2 !== 0;
    const r = allWs.addRow([
      s.order, s.category.toUpperCase(), s.title, s.actor, s.role,
      s.sla, s.system, s.action, s.conditions, s.description,
      s.required ? "Yes" : "No",
    ]);
    styleBodyRow(r, isAlt, 20);
    r.getCell(1).font = bodyFont(10, true, P.accentBlue);
    r.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    const catColor = CAT_COLOR[s.category.toLowerCase()] ?? P.mutedFg;
    r.getCell(2).font = { name: "Calibri", size: 9, bold: true, color: { argb: catColor } };
    r.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: catColor + "1A" } };
    r.getCell(3).font = bodyFont(10, true);
    const reqColor = s.required ? P.accentGreen : P.mutedFg;
    r.getCell(11).font = { name: "Calibri", size: 10, bold: true, color: { argb: reqColor } };
    r.getCell(11).alignment = { horizontal: "center", vertical: "middle" };
  });

  // ── Requirements sheet ─────────────────────────────────────────────────────
  const reqEntries = Object.entries(wf.reqAnswers).filter(([, v]) => v.trim());
  if (reqEntries.length > 0) {
    const rqWs = wb.addWorksheet("Requirements");
    freezeTopRow(rqWs);
    rqWs.columns = [
      { key: "id",     width: 16 },
      { key: "answer", width: 86 },
    ];
    const rqH = rqWs.addRow(["Question ID", "Answer"]);
    styleHeaderRow(rqH);
    reqEntries.forEach(([k, v], i) => {
      const r = rqWs.addRow([k, v]);
      styleBodyRow(r, i % 2 !== 0, v.length > 80 ? 40 : 20);
      r.getCell(1).font = bodyFont(10, true, P.accentBlue);
      r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    });
  }

  // ── Roster sheets ──────────────────────────────────────────────────────────
  if (rosters.gatekeeper.length > 0) {
    buildRosterSheet(wb, "Gatekeeper Roster", ["Department", "Division", "Gatekeeper", "Backup Gatekeeper"], rosters.gatekeeper, P.accentTeal);
  }
  if (rosters.ccManager.length > 0) {
    buildRosterSheet(wb, "CC Manager Roster", ["Department", "Division", "Cost Center", "CC Manager", "Backup Mgr"], rosters.ccManager, P.accentBlue);
  }

  // ── Discovery sheet ────────────────────────────────────────────────────────
  const wizEntries = Object.entries(wf.wizAnswers);
  if (wizEntries.length > 0) {
    const discWs = wb.addWorksheet("Discovery");
    discWs.getColumn(1).width = 20;
    discWs.getColumn(2).width = 46;
    const discH = discWs.addRow(["Field", "Value"]);
    styleHeaderRow(discH);
    wizEntries.forEach(([k, v], i) => {
      const r = discWs.addRow([k, String(v)]);
      styleBodyRow(r, i % 2 !== 0);
      r.getCell(1).font = bodyFont(10, true);
    });
  }

  await saveWorkbook(wb, `${wf.slug}-process-flow.xlsx`);
}


/**
 * Builds and downloads a styled Excel roster template (headers only, no data).
 * Used by RosterPanel "Download Template" button.
 */
export async function downloadRosterTemplate(
  slug: string,
  rosterKey: string,
  columns: string[],
  label: string,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Oracle Fusion SCM — Approval Workflow Intelligence Center";
  const ws = buildRosterSheet(wb, label, columns, [], P.accentBlue);
  // Add instruction row below header
  const instrRow = ws.addRow(columns.map((_, i) => i === 0 ? "← Fill in rows starting here. Do not edit column headers." : ""));
  instrRow.getCell(1).font = { name: "Calibri", size: 9, italic: true, color: { argb: P.mutedFg } };
  instrRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFDE7" } };
  instrRow.height = 18;
  await saveWorkbook(wb, `${slug}-${rosterKey}-template.xlsx`);
}


// ── Internal: build a roster worksheet ────────────────────────────────────────

function buildRosterSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  columns: string[],
  rows: RosterRow[],
  accentArgb: string,
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(sheetName);
  freezeTopRow(ws);
  ws.columns = columns.map((c) => ({ key: c, width: 28 }));
  addAutoFilter(ws, columns.length);

  // Header
  const hRow = ws.addRow(columns);
  hRow.height = 22;
  hRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = headerFont(11);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: accentArgb } };
    cell.border = thinBorder("FFB0C8F0");
    cell.alignment = { vertical: "middle", horizontal: "left" };
  });

  // Data rows
  rows.forEach((row, i) => {
    const r = ws.addRow(columns.map((c) => row[c] ?? ""));
    styleBodyRow(r, i % 2 !== 0, 18);
    r.getCell(1).font = bodyFont(10, true);
  });

  return ws;
}
