import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Download, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { utils, writeFile } from "xlsx";
import { APPROVAL_TYPES } from "./Home";
import { getQuestionsForType, getVisibleQuestions, type DiscoveryQuestion } from "../data/discoveryQuestions";
import {
  OtherApproversPanel,
  loadApprovers,
  saveApprovers,
  type OthApprover,
} from "../components/OtherApproversPanel";

// ── Inline SVG progress ring ───────────────────────────────────────────────────
function ProgressRingLarge({ filled, total }: { filled: number; total: number }) {
  const pct  = total > 0 ? filled / total : 0;
  const R    = 30;
  const C    = 2 * Math.PI * R;
  const dash = C * pct;
  const done = pct >= 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="76" height="76" viewBox="0 0 76 76">
        {/* Track */}
        <circle cx="38" cy="38" r={R} fill="none" stroke="#e0e0e0" strokeWidth="5" />
        {/* Progress */}
        <circle
          cx="38" cy="38" r={R}
          fill="none"
          stroke={done ? "#24a148" : "#0f62fe"}
          strokeWidth="5"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeLinecap="butt"
          transform="rotate(-90 38 38)"
          style={{ transition: "stroke-dasharray 0.3s ease" }}
        />
        {/* Label */}
        <text x="38" y="42" textAnchor="middle" fontSize="13" fontWeight="600"
          fill={done ? "#24a148" : "#0f62fe"}
          fontFamily="'IBM Plex Sans', sans-serif">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span style={{ fontSize: 11, color: "#525252", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {filled} of {total} answered
      </span>
    </div>
  );
}

// ── Storage helpers ────────────────────────────────────────────────────────────
function loadAnswers(type: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`discovery_answers_${type}`);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveAnswers(type: string, answers: Record<string, string>) {
  localStorage.setItem(`discovery_answers_${type}`, JSON.stringify(answers));
  // Dispatch storage event so other tabs (e.g. sidebar ring) can react
  window.dispatchEvent(new Event("storage"));
}

// ── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({
  q,
  idx,
  answer,
  color,
  onAnswerChange,
}: {
  q: DiscoveryQuestion;
  idx: number;
  answer: string;
  color: string;
  onAnswerChange: (id: string, value: string) => void;
}) {
  const answered = answer.trim() !== "";
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e0e0e0",
      borderLeft: `3px solid ${answered ? color : "#e0e0e0"}`,
      padding: "20px 24px",
      transition: "border-left-color 0.2s",
    }}>
      {/* Question meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#8d8d8d", minWidth: 24 }}>
          {String(idx + 1).padStart(2, "0")}
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color, opacity: 0.8 }}>
          {q.id}
        </span>
        <div style={{ marginLeft: "auto" }}>
          {answered
            ? <CheckCircle2 size={15} style={{ color }} />
            : <Circle size={15} style={{ color: "#c6c6c6" }} />
          }
        </div>
      </div>

      {/* Question text */}
      <label style={{
        display: "block",
        fontSize: q.isGate ? 15 : 14,
        fontWeight: q.isGate ? 700 : 500,
        color: "#161616",
        lineHeight: 1.5,
        marginBottom: q.hint ? 4 : 10,
        cursor: "text",
      }}>
        {q.question}
      </label>
      {q.hint && (
        <p style={{ fontSize: 11, color: "#8d8d8d", margin: "0 0 10px", lineHeight: 1.4, fontStyle: "italic" }}>{q.hint}</p>
      )}

      {/* Input */}
      {q.inputType === "yesno" ? (
        <div style={{ display: "flex", gap: 8 }}>
          {["Yes", "No"].map((opt) => (
            <button key={opt} type="button" onClick={() => onAnswerChange(q.id, opt)}
              style={{
                padding: "7px 22px", fontSize: 13,
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: "pointer",
                border: `1px solid ${answer === opt ? color : "#e0e0e0"}`,
                background: answer === opt ? color : "#ffffff",
                color: answer === opt ? "#ffffff" : "#161616",
                transition: "background 0.1s",
              }}>
              {opt}
            </button>
          ))}
        </div>
      ) : q.inputType === "select" && q.options ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {q.options.map((opt) => (
            <button key={opt} type="button" onClick={() => onAnswerChange(q.id, opt)}
              style={{
                padding: "7px 16px", fontSize: 13,
                fontFamily: "'IBM Plex Sans', sans-serif",
                cursor: "pointer",
                border: `1px solid ${answer === opt ? color : "#e0e0e0"}`,
                background: answer === opt ? color : "#ffffff",
                color: answer === opt ? "#ffffff" : "#161616",
                transition: "background 0.1s",
              }}>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(q.id, e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: 13,
            color: "#161616",
            background: "#fafafa",
            border: "1px solid #e0e0e0",
            borderBottom: `2px solid ${answered ? color : "#8d8d8d"}`,
            outline: "none",
            resize: "vertical",
            fontFamily: "'IBM Plex Sans', sans-serif",
            lineHeight: 1.6,
            transition: "border-bottom-color 0.15s",
            boxSizing: "border-box",
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = color; e.currentTarget.style.background = "#ffffff"; }}
          onBlur={(e)  => { e.currentTarget.style.borderBottomColor = answered ? color : "#8d8d8d"; e.currentTarget.style.background = "#fafafa"; }}
          placeholder="Type your response…"
        />
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DiscoveryQuestions() {
  const { type } = useParams<{ type: string }>();
  const navigate  = useNavigate();

  const approvalType = APPROVAL_TYPES.find((t) => t.slug === type);
  const allQuestions = getQuestionsForType(type ?? "");

  // Initialise from localStorage on first render — sanitise GATE-OTH to only allow "Yes"/"No"
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const saved = loadAnswers(type ?? "");
    const gateOth = (saved["GATE-OTH"] ?? "").trim();
    if (gateOth !== "" && gateOth !== "Yes" && gateOth !== "No") {
      const { "GATE-OTH": _removed, ...rest } = saved;
      return rest;
    }
    return saved;
  });

  // Extra approvers for GATE-OTH section
  const [othApprovers, setOthApprovers] = useState<OthApprover[]>(() => loadApprovers(type ?? ""));

  // Persist whenever answers change
  useEffect(() => {
    if (type) saveAnswers(type, answers);
  }, [answers, type]);

  // Persist extra approvers
  useEffect(() => {
    if (type) saveApprovers(type, othApprovers);
  }, [othApprovers, type]);

  const handleAnswerChange = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  // ── Build sections (still needed for section-level rendering) ────────────────
  const sections: { title: string; sectionIndex: number; gate: DiscoveryQuestion | null; body: DiscoveryQuestion[] }[] = [];
  allQuestions.forEach((q) => {
    let sec = sections.find((s) => s.sectionIndex === q.sectionIndex);
    if (!sec) {
      sec = { title: q.section, sectionIndex: q.sectionIndex, gate: null, body: [] };
      sections.push(sec);
    }
    if (q.isGate) {
      sec.gate = q;
    } else {
      sec.body.push(q);
    }
  });

  // ── Visible questions — use shared helper so rings stay in sync ───────────
  const visibleQuestions = getVisibleQuestions(type ?? "", answers);

  const filledCount = visibleQuestions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = visibleQuestions.map((q) => ({
      "KDD ID":  q.id,
      Section:   q.section,
      Question:  q.question,
      Answer:    answers[q.id] || "",
    }));
    // Append extra approvers — one row per approver, one row per tab
    othApprovers.forEach((a, i) => {
      rows.push({
        "KDD ID":  `OTH-APPR-${String(i + 1).padStart(2, "0")}`,
        Section:   "10. Others — Agency-Specific Approvers",
        Question:  `Approver ${i + 1}: ${a.name || "(unnamed)"}`,
        Answer:    `Role/Dept: ${a.description || "—"}`,
      });
      a.tabs.forEach((tab, ti) => {
        rows.push({
          "KDD ID":  `OTH-APPR-${String(i + 1).padStart(2, "0")}-T${ti + 1}`,
          Section:   "10. Others — Agency-Specific Approvers",
          Question:  `  └─ ${tab.title}`,
          Answer:    tab.content || "—",
        });
      });
    });
    const worksheet = utils.json_to_sheet(rows);
    const workbook  = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, approvalType?.label ?? "Answers");
    worksheet["!cols"] = [{ wch: 14 }, { wch: 32 }, { wch: 80 }, { wch: 60 }];
    writeFile(workbook, `${type}-discovery-answers.xlsx`);
  };

  const handleClear = () => {
    if (window.confirm("Clear all saved answers for this form?")) {
      setAnswers({});
      setOthApprovers([]);
    }
  };

  if (!approvalType) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <p style={{ color: "#525252" }}>Approval type not found.</p>
        <button onClick={() => navigate("/")} style={{ color: "#0f62fe", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
          ← Back to home
        </button>
      </div>
    );
  }

  const { color, label } = approvalType;

  // Global question counter (across all visible questions)
  let globalIdx = 0;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#ffffff", minHeight: "100%" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "32px 40px 28px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
        <div style={{ flex: 1 }}>
          <button
            onClick={() => navigate(`/approval/${type}`)}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: "#525252", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#0f62fe"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#525252"; }}
          >
            <ArrowLeft size={13} /> Back to {label}
          </button>

          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color, marginBottom: 4, textTransform: "uppercase" }}>
            {label} · Discovery
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: "#161616", margin: "0 0 8px", lineHeight: 1.3 }}>
            Discovery Questions
          </h1>
          <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
            Answer the questions below to capture approval requirements for <strong style={{ fontWeight: 600, color: "#161616" }}>{label}</strong> workflows.
            For each approver type, first confirm whether it is required — answering <em>No</em> will hide all follow-up questions for that section.
            Progress is saved automatically.
          </p>

          {/* Save indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#24a148" }} />
            <span style={{ fontSize: 11, color: "#24a148", fontWeight: 500 }}>Auto-saved to browser</span>
          </div>
        </div>

        {/* Progress ring */}
        <div style={{ flexShrink: 0, paddingTop: 32 }}>
          <ProgressRingLarge filled={filledCount} total={visibleQuestions.length} />
        </div>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div style={{ padding: "32px 40px", maxWidth: 780, display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Sections 1-9 and Cross-Cutting — standard loop */}
          {sections.filter((sec) => sec.sectionIndex !== 9).map((sec) => {
            const gateAnswer = sec.gate ? (answers[sec.gate.id] ?? "").trim() : "";
            const sectionActive = !sec.gate || gateAnswer !== "No";
            const sectionAnsweredCount =
              (sec.gate && gateAnswer !== "" ? 1 : 0) +
              (sectionActive ? sec.body.filter((q) => (answers[q.id] ?? "").trim() !== "").length : 0);
            const sectionTotalCount =
              (sec.gate ? 1 : 0) + (sectionActive ? sec.body.length : 0);

            return (
              <div key={sec.title}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0 10px", marginBottom: 12, borderBottom: `2px solid ${color}22` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em" }}>{sec.title.toUpperCase()}</span>
                  {!sectionActive && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 8px", background: "#e0e0e0", color: "#525252" }}>SKIPPED</span>
                  )}
                  <span style={{ fontSize: 10, color: "#8d8d8d", marginLeft: "auto" }}>
                    {sectionAnsweredCount}/{sectionTotalCount} answered
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {sec.gate && (
                    <QuestionCard
                      key={sec.gate.id}
                      q={sec.gate}
                      idx={globalIdx++}
                      answer={answers[sec.gate.id] ?? ""}
                      color={color}
                      onAnswerChange={handleAnswerChange}
                    />
                  )}
                  {sectionActive && sec.body.map((q) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      idx={globalIdx++}
                      answer={answers[q.id] ?? ""}
                      color={color}
                      onAnswerChange={handleAnswerChange}
                    />
                  ))}
                  {!sectionActive && sec.body.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f4f4f4", border: "1px solid #e0e0e0", borderLeft: "3px solid #e0e0e0" }}>
                      <ChevronDown size={13} style={{ color: "#8d8d8d" }} />
                      <span style={{ fontSize: 12, color: "#8d8d8d" }}>
                        {sec.body.length} question{sec.body.length !== 1 ? "s" : ""} hidden — change your answer above to <em>Yes</em> to reveal them.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Section 10: Others — rendered standalone, no loop dependency ── */}
          {(() => {
            const othAnswer = (answers["GATE-OTH"] ?? "").trim();
            const sec10 = sections.find((s) => s.sectionIndex === 9);
            if (!sec10) return null;
            const sec10AnsweredCount = othAnswer !== "" ? 1 : 0;
            return (
              <div key="10. Others">
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0 10px", marginBottom: 12, borderBottom: `2px solid ${color}22` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: "0.08em" }}>10. OTHERS</span>
                  <span style={{ fontSize: 10, color: "#8d8d8d", marginLeft: "auto" }}>
                    {sec10AnsweredCount}/1 answered
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* The yes/no gate question */}
                  <QuestionCard
                    q={sec10.gate!}
                    idx={globalIdx++}
                    answer={othAnswer}
                    color={color}
                    onAnswerChange={handleAnswerChange}
                  />

                  {/* Yes → show approver builder immediately below */}
                  {othAnswer === "Yes" && (
                    <OtherApproversPanel
                      color={color}
                      approvers={othApprovers}
                      onApproversChange={setOthApprovers}
                    />
                  )}

                  {/* No → show collapsed message */}
                  {othAnswer === "No" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#f4f4f4", border: "1px solid #e0e0e0", borderLeft: "3px solid #e0e0e0" }}>
                      <ChevronDown size={13} style={{ color: "#8d8d8d" }} />
                      <span style={{ fontSize: 12, color: "#8d8d8d" }}>
                        No additional approvers — change your answer to <em>Yes</em> to add agency-specific approvers.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>

        {/* ── Footer actions ───────────────────────────────────────────────── */}
        <div style={{ padding: "20px 40px 40px", display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #e0e0e0" }}>
          <button
            type="submit"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 24px",
              background: "#0f62fe", color: "#ffffff",
              border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 500, fontFamily: "inherit",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#0353e9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#0f62fe"; }}
          >
            <Download size={15} />
            Download Responses (.xlsx)
          </button>

          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "10px 20px",
              background: "transparent", color: "#da1e28",
              border: "1px solid #da1e28", cursor: "pointer",
              fontSize: 13, fontWeight: 400, fontFamily: "inherit",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Clear all answers
          </button>

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#8d8d8d" }}>
            {filledCount} / {visibleQuestions.length} answered
          </span>
        </div>
      </form>
    </div>
  );
}
