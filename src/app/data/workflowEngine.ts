// ─── Workflow Engine ──────────────────────────────────────────────────────────
// Generates a structured approval process flow from:
//   - reqAnswers: Record<string, string>  (KDD requirements questionnaire)
//
// The engine reads the GATE-* gate answers for each of the 10 approver sections.
// If a gate is explicitly answered "No", that entire approver section is excluded
// from the process flow.  Only sections gated "Yes" (or left unanswered with
// body answers present) produce workflow steps.
//
// wizAnswers is kept in the interface for backwards compatibility but is no longer
// used to drive step generation.

export interface WorkflowStep {
  id: string;
  order: number;
  title: string;
  actor: string;
  role: string;
  sla: string;
  system: string;
  action: string;
  conditions: string;
  description: string;
  category: "initiation" | "validation" | "approval" | "legal" | "executive" | "system" | "completion";
  required: boolean;
}

export interface GeneratedWorkflow {
  slug: string;
  label: string;
  generatedAt: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  estimatedSLA: string;
  totalApprovers: number;
  steps: WorkflowStep[];
  summaryNotes: string[];
  reqAnswers: Record<string, string>;
  wizAnswers: WizAnswers;
}

// Kept for backwards-compat — no longer drives logic
export interface WizAnswers {
  procType?: string;
  valueRange?: string;
  method?: string;
  urgency?: string;
  legalReview?: string;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const KEY = (slug: string) => `workflow_v2_${slug}`;

export function saveWorkflow(wf: GeneratedWorkflow): void {
  localStorage.setItem(KEY(wf.slug), JSON.stringify(wf));
  window.dispatchEvent(new Event("storage"));
}

export function loadWorkflow(slug: string): GeneratedWorkflow | null {
  try {
    const raw = localStorage.getItem(KEY(slug));
    return raw ? (JSON.parse(raw) as GeneratedWorkflow) : null;
  } catch { return null; }
}

export function deleteWorkflow(slug: string): void {
  localStorage.removeItem(KEY(slug));
  window.dispatchEvent(new Event("storage"));
}

export function loadAllWorkflows(): GeneratedWorkflow[] {
  const slugs = ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"];
  return slugs.map(loadWorkflow).filter(Boolean) as GeneratedWorkflow[];
}

// ─── Step ID generator ────────────────────────────────────────────────────────

let _seq = 1;
function makeId() { return `step-${Date.now()}-${_seq++}`; }

// ─── Gate helpers ─────────────────────────────────────────────────────────────
//
// A section is ACTIVE only when the gate question was explicitly answered "Yes".
// Unanswered gates and "No" answers both exclude the section.

function sectionActive(gateId: string, reqAnswers: Record<string, string>): boolean {
  const v = (reqAnswers[gateId] ?? "").trim().toLowerCase();
  return v === "yes";          // only explicit "Yes" includes the section
}

// ─── Core generation logic ────────────────────────────────────────────────────

export function generateWorkflow(
  slug: string,
  label: string,
  reqAnswers: Record<string, string>,
  wizAnswers: WizAnswers = {},   // kept for backwards compat, no longer drives logic
): GeneratedWorkflow {
  _seq = 1;
  const steps: WorkflowStep[] = [];
  const notes: string[] = [];

  const get = (id: string) => (reqAnswers[id] ?? "").trim();
  const yes = (id: string) => get(id).toLowerCase() === "yes";

  // ── Derive section flags from gate answers ────────────────────────────────
  const useGK  = sectionActive("GATE-GK",  reqAnswers);   // 1. Gatekeeper
  const useCCM = sectionActive("GATE-CCM", reqAnswers);   // 2. Cost Center Manager
  const useSUP = sectionActive("GATE-SUP", reqAnswers);   // 3. Supervisor
  const usePM  = sectionActive("GATE-PM",  reqAnswers);   // 4. Project Manager
  const useGR  = sectionActive("GATE-GR",  reqAnswers);   // 5. Grant
  const useCAT = sectionActive("GATE-CAT", reqAnswers);   // 6. Category
  const usePT  = sectionActive("GATE-PT",  reqAnswers);   // 7. Procurement Type
  const useBUY = sectionActive("GATE-BUY", reqAnswers);   // 8. Buyer
  const useDOA = sectionActive("GATE-DOA", reqAnswers);   // 9. DOA
  const useOTH = sectionActive("GATE-OTH", reqAnswers);   // 10. Others

  // ── Emergency / urgency signals from req answers (not from wizard) ────────
  const isEmergency  = slug === "emergency";
  const isSoleSource = slug === "sole-source";
  const isContract   = slug === "contract" || slug === "ica";

  // DOA threshold text from answers
  const doaThreshold = get("DOA-001");
  const isHighValue  = doaThreshold.includes("250") || doaThreshold.includes("500") || doaThreshold.includes("1M") || doaThreshold.includes("1,000");
  const boardRequired = yes("DOA-007") || get("DOA-007").trim() !== "";

  // ── Step 1: Gatekeeper ────────────────────────────────────────────────────
  if (useGK) {
    const gkScope = get("GK-001") === "Specific"
      ? `Specific types: ${get("GK-002") || "as defined"}`
      : (get("GK-001") === "All" ? "All requisitions" : "As configured");
    const gkCapability = get("GK-011") || "Approve/Reject only";
    const bypassNotes = [
      yes("GK-013") ? "Catalog purchases bypass." : "",
      yes("GK-014") ? "Contract-backed purchases bypass." : "",
      yes("GK-015") ? "Emergency purchases exempt." : "",
    ].filter(Boolean).join(" ");

    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Gatekeeper Review",
      actor: get("GK-006")
        ? `Gatekeeper — ${get("GK-006").substring(0, 60)}`
        : "Designated Gatekeeper",
      role: "Gatekeeper",
      sla: "1 business day",
      system: "Oracle Fusion — Approval Worklist",
      action: `Review and ${gkCapability.toLowerCase()}`,
      conditions: [`Scope: ${gkScope}`, bypassNotes].filter(Boolean).join(". ").trim(),
      description: get("GK-010")
        ? `Gatekeeper validates: ${get("GK-010")}. ${yes("GK-012") ? "Can return for correction." : ""}`
        : "Gatekeeper performs initial review before the transaction advances to the approval chain.",
      category: "validation",
      required: true,
    });
    if (get("GK-009")) notes.push(`Gatekeeper assignments: ${get("GK-009").substring(0, 120)}`);
  }

  // ── Step 4: Cost Center Manager ───────────────────────────────────────────
  if (useCCM) {
    const ccmIdent = get("CCM-001") || "HR hierarchy / financial system owner";
    const splitNote = yes("CCM-006")
      ? `Split cost centers: ${get("CCM-007") === "Sequential" ? "sequential approval" : get("CCM-007") === "Parallel" ? "parallel approval" : "per configuration"}.`
      : "";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Cost Center Manager Approval",
      actor: `Cost Center Manager — ${ccmIdent.substring(0, 50)}`,
      role: "Cost Center Manager",
      sla: get("CCM-008") ? `Per DOA: ${get("CCM-008").substring(0, 40)}` : "1–2 business days",
      system: "Oracle Fusion — Approval Worklist",
      action: "Review cost center charges and approve or reject transaction",
      conditions: [get("CCM-004") ? `Additional: ${get("CCM-004").substring(0, 100)}` : "Required for all cost center charges.", splitNote].filter(Boolean).join(" ").trim(),
      description: `Cost Center Manager reviews the charge against departmental budgets. ${yes("CCM-002") ? "Multiple approvers may be required for this cost center." : ""} ${yes("CCM-010") ? "Manager may reassign charge accounts." : ""}`.trim(),
      category: "approval",
      required: true,
    });
  }

  // ── Step 5: Supervisor / Department Head ──────────────────────────────────
  if (useSUP) {
    const supHierarchy = get("SUP-001") === "Yes" ? "Oracle HCM supervisor hierarchy" : get("SUP-002") || "direct supervisor";
    const escalationNote = get("SUP-009") ? `Escalation after ${get("SUP-009")} days.` : "";
    const basisNote = get("SUP-006") ? `Approval basis: ${get("SUP-006")}.` : "";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Supervisor / Department Head Approval",
      actor: `Supervisor — via ${supHierarchy.substring(0, 50)}`,
      role: "Supervisor",
      sla: get("SUP-009") ? `Up to ${get("SUP-009")} days before escalation` : "2 business days",
      system: "Oracle Fusion — Approval Worklist",
      action: "Review and approve transaction; escalate if threshold exceeded",
      conditions: [basisNote, escalationNote, get("SUP-005") ? `Bypass types: ${get("SUP-005").substring(0, 80)}` : ""].filter(Boolean).join(" ").trim() || "Required for all transactions.",
      description: `Supervisor reviews business justification, vendor selection, and budget impact. ${yes("SUP-003") ? "Acting/interim managers recognized for routing." : ""} ${yes("SUP-008") ? "Delegation rules configured." : ""}`.trim(),
      category: "approval",
      required: true,
    });
  }

  // ── Step 6: Project Manager ───────────────────────────────────────────────
  if (usePM) {
    const pmIdent = get("PM-002") || "Oracle Projects ownership";
    const multiNote = yes("PM-004") ? `Multiple projects: ${get("PM-005") === "Sequential" ? "sequential" : get("PM-005") === "Parallel" ? "parallel" : "per configuration"}.` : "";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Project Manager Approval",
      actor: `Project Manager — ${pmIdent.substring(0, 50)}`,
      role: "Project Manager",
      sla: "1–2 business days",
      system: "Oracle Fusion — Approval Worklist",
      action: "Verify project coding, milestone alignment, and project budget availability",
      conditions: [get("PM-003") || "Required when transaction is charged to a project or grant account.", multiNote].filter(Boolean).join(" ").trim(),
      description: `Project Manager confirms the purchase aligns with project scope and approved budget. ${yes("PM-006") ? "Must verify remaining project budget before approving." : ""} ${get("PM-008") ? `Capital vs operating note: ${get("PM-008").substring(0, 80)}` : ""}`.trim(),
      category: "approval",
      required: false,
    });
  }

  // ── Step 7: Grant / Federal Compliance ───────────────────────────────────
  if (useGR) {
    const grIdent = get("GR-002") || "Grant Compliance Officer";
    const grValidations = get("GR-004") || "Funding availability, allowable expenses, grant period validity.";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Grant / Federal Compliance Review",
      actor: `${yes("GR-003") ? "Grant Principal Investigator (PI)" : "Grant Manager"} — ${grIdent.substring(0, 40)}`,
      role: "Grant Compliance",
      sla: get("GR-008") ? `Threshold: ${get("GR-008").substring(0, 30)}` : "2–3 business days",
      system: "Oracle Fusion — Approval Worklist",
      action: "Verify grant eligibility, allowability, and federal/state compliance requirements",
      conditions: `${get("GR-001") ? get("GR-001").substring(0, 100) : "Required for all grant-funded purchases."}`,
      description: `Grant review validates: ${grValidations}. ${yes("GR-005") ? "Additional documentation required." : ""} ${yes("GR-006") ? "All grant owners must approve when multiple grants are charged." : ""}`.trim(),
      category: "approval",
      required: false,
    });
    notes.push("Grant-funded purchases require compliance documentation per applicable grant terms and 2 CFR 200 Uniform Guidance.");
  }

  // ── Step 8: Category Manager / Procurement ────────────────────────────────
  if (useCAT) {
    const catIdent = get("CAT-002") || "Category hierarchy";
    const mandatoryCategories = get("CAT-006") || get("CAT-001") || "Managed spend categories";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Category Manager / Procurement Review",
      actor: `Category Manager — ${catIdent.substring(0, 50)}`,
      role: "Category Manager",
      sla: get("CAT-003") ? `Above: ${get("CAT-003").substring(0, 30)}` : "1–2 business days",
      system: "Oracle Fusion — Approval Worklist",
      action: "Review sourcing strategy, vendor selection, and procurement compliance",
      conditions: [
        `Categories: ${mandatoryCategories.substring(0, 80)}`,
        yes("CAT-008") ? "Existing contract purchases bypass." : "",
        yes("CAT-009") ? "Punchout/catalog purchases bypass." : "",
        yes("CAT-004") ? "Preferred supplier validation required." : "",
      ].filter(Boolean).join(" ").trim(),
      description: `Category Manager reviews vendor selection, pricing, and contract compliance. ${yes("CAT-005") ? "Must verify contract utilization." : ""}`.trim(),
      category: "approval",
      required: true,
    });
  }

  // ── Step 9: Procurement Type Review ──────────────────────────────────────
  if (usePT) {
    const ptTypes = get("PT-001") || "As defined by organization";
    const ptApprovers = get("PT-003") || "Varies by type";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Procurement Type Review",
      actor: `Procurement Type Reviewer — ${ptApprovers.substring(0, 50)}`,
      role: "Procurement Type Approver",
      sla: "1–2 business days",
      system: "Oracle Fusion — Approval Worklist",
      action: "Validate procurement type classification and apply type-specific approval rules",
      conditions: [
        `Types covered: ${ptTypes.substring(0, 80)}`,
        get("PT-005") ? `Additional type-specific approvals: ${get("PT-005").substring(0, 80)}` : "",
        get("PT-006") ? `Bypass types: ${get("PT-006").substring(0, 60)}` : "",
      ].filter(Boolean).join(". ").trim(),
      description: `${get("PT-002") ? `Type identification in Oracle: ${get("PT-002").substring(0, 80)}.` : ""} ${get("PT-004") ? `Dollar thresholds vary by type: ${get("PT-004").substring(0, 80)}.` : ""}`.trim() || "Applies procurement-type-specific approval routing rules.",
      category: "approval",
      required: false,
    });
  }

  // ── Step 10: Buyer Assignment & Review ────────────────────────────────────
  if (useBUY) {
    const buyerAssignment = get("BUY-001") || "Category / Business Unit / Supplier-based";
    const buyerList = get("BUY-002") || "Per buyer assignment matrix";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Buyer Assignment & Procurement Processing",
      actor: `Assigned Buyer — ${buyerList.substring(0, 50)}`,
      role: "Buyer",
      sla: yes("BUY-007") && isEmergency ? "Same day (emergency bypass)" : "1–2 business days",
      system: "Oracle Fusion — Purchasing",
      action: "Assign buyer, verify supplier, source document, and process for PO conversion",
      conditions: [
        `Assignment basis: ${buyerAssignment.substring(0, 80)}`,
        yes("BUY-003") ? "Buyer approval required before PO creation." : "",
        yes("BUY-008") ? "Public bidding thresholds applicable (SLED)." : "",
        yes("BUY-009") ? "Minority/diversity supplier requirements apply." : "",
        yes("BUY-010") ? "Cooperative purchasing contracts in use." : "",
        yes("BUY-007") && isEmergency ? "Emergency purchases bypass Buyer review." : "",
      ].filter(Boolean).join(" ").trim(),
      description: `${get("BUY-004") ? `Buyer validates: ${get("BUY-004").substring(0, 120)}` : "Buyer verifies supplier, applicable contracts, pricing, and terms."} ${yes("BUY-005") ? "Buyers may modify requisitions." : ""} ${yes("BUY-006") ? "Buyers may reject requisitions." : ""}`.trim(),
      category: "approval",
      required: true,
    });
  }

  // ── Step 11: DOA — Dollar-Based Approval ─────────────────────────────────
  if (useDOA) {
    const doaMatrix = get("DOA-001") || "Per organization DOA policy";
    const doaBasis = get("DOA-006") || "requestor hierarchy";
    const doaSeq = get("DOA-005") || "Sequential";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Delegation of Authority (DOA) Approval",
      actor: `DOA Approver — ${doaBasis.substring(0, 50)}`,
      role: "Authorized Approver per DOA",
      sla: get("DOA-004") === "Highest applicable level only" ? "2–3 business days (highest level only)" : "Per level — cumulative",
      system: "Oracle Fusion — Approval Worklist",
      action: "Apply Delegation of Authority thresholds and route to appropriate approval level",
      conditions: [
        `DOA matrix: ${doaMatrix.substring(0, 100)}`,
        `Basis: ${get("DOA-002") || "total requisition amount"}`,
        `Routing: ${doaSeq}`,
        yes("DOA-003") ? "Thresholds differ by Business Unit." : "",
        yes("DOA-008") ? "State regulatory thresholds apply." : "",
        yes("DOA-009") ? "Competitive bidding thresholds differ from approval thresholds." : "",
        get("DOA-010") ? `Federal grant threshold note: ${get("DOA-010").substring(0, 80)}` : "",
      ].filter(Boolean).join(" ").trim(),
      description: `Dollar-based approval routing per the organization's Delegation of Authority. ${get("DOA-013") ? `Change order limits: ${get("DOA-013").substring(0, 80)}.` : ""} ${yes("DOA-011") ? "Contract purchases follow same DOA thresholds." : ""} ${yes("DOA-012") ? "Emergency purchases follow separate DOA thresholds." : ""}`.trim(),
      category: "approval",
      required: true,
    });
    if (doaThreshold) notes.push(`DOA thresholds: ${doaThreshold.substring(0, 150)}`);
  }

  // ── Step 12: Board Approval (if DOA indicates it) ─────────────────────────
  if (useDOA && boardRequired) {
    const boardThreshold = get("DOA-007") || "per policy";
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Board / Executive Authorization",
      actor: "Governing Board / Executive Leadership",
      role: "Board Approver",
      sla: "5–10 business days",
      system: "Board Meeting / Oracle Fusion — Approval Worklist",
      action: "Board review and ratification of high-value procurement",
      conditions: `Required above threshold: ${boardThreshold}`,
      description: "Governing Board or executive body reviews and ratifies high-value procurement decisions. Requires submission of an executive summary package.",
      category: "executive",
      required: true,
    });
    notes.push(`Board approval required for transactions above: ${boardThreshold}`);
  }

  // ── Step 13: Legal / Sole-Source ─────────────────────────────────────────
  if (isSoleSource || isContract) {
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: isSoleSource ? "Sole-Source Justification & Legal Review" : "Legal Counsel Review",
      actor: "Legal Counsel / Office of General Counsel",
      role: "Legal",
      sla: isSoleSource ? "3–5 business days" : "2–3 business days",
      system: "Oracle Fusion — Approval Worklist / Legal Review System",
      action: isSoleSource
        ? "Review sole-source justification, legal sufficiency, and procurement policy compliance"
        : "Review contract terms, legal risk, and compliance",
      conditions: isSoleSource
        ? "Required for all sole-source procurements. Written justification must be attached."
        : "Required for all contract / ICA agreements.",
      description: isSoleSource
        ? "Legal Counsel reviews the sole-source justification for legal sufficiency. The written justification must document why competition is not practicable and must be signed by an authorized official."
        : "Legal Counsel reviews contract terms for legal risk, indemnification, liability, and compliance with applicable laws.",
      category: "legal",
      required: true,
    });
    if (isSoleSource) notes.push("Sole-source justification letter with market analysis must be attached before Legal review begins.");
  }

  // ── Step 14: Emergency Authorization ──────────────────────────────────────
  if (isEmergency) {
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Emergency Authorization & Declaration",
      actor: "Department Head / CPO (verbal then written)",
      role: "Emergency Authorizer",
      sla: "Same day / within 4 hours",
      system: "Oracle Fusion — Emergency Procurement Flag",
      action: "Declare emergency, obtain verbal authorization, and flag in Oracle for expedited routing",
      conditions: "Emergency declaration must be on file. Post-award ratification required within 10 business days.",
      description: "Emergency purchases follow an expedited path. Verbal authorization is acceptable initially, but written authorization must follow within 24 hours. Post-award ratification memo required.",
      category: "executive",
      required: true,
    });
    notes.push("Emergency procurement: post-award ratification memo required within 10 business days of purchase.");
  }

  // ── Step 15: Others / Custom ──────────────────────────────────────────────
  if (useOTH && get("OTH-001")) {
    steps.push({
      id: makeId(), order: steps.length + 1,
      title: "Additional Approval Step",
      actor: "As defined in requirements",
      role: "Custom Approver",
      sla: "Per policy",
      system: "Oracle Fusion — Approval Worklist",
      action: "Execute additional approval scenario as described in requirements",
      conditions: "Per custom requirements defined for this approval type.",
      description: get("OTH-001").substring(0, 300),
      category: "approval",
      required: false,
    });
  }

  // ── Re-number ──────────────────────────────────────────────────────────────
  steps.forEach((s, i) => { s.order = i + 1; });

  // ── Notes from cross-cutting answers ──────────────────────────────────────
  const ccNotes = [
    get("CC-001") ? `Approval sequence: ${get("CC-001").substring(0, 120)}` : "",
    get("CC-002") ? `Parallel blocks: ${get("CC-002").substring(0, 80)}` : "",
    get("CC-006") ? `Delegation rules: ${get("CC-006").substring(0, 80)}` : "",
    get("CC-008") ? `Escalation rules: ${get("CC-008").substring(0, 80)}` : "",
    get("CC-012") ? `Regulatory requirements: ${get("CC-012").substring(0, 100)}` : "",
  ].filter(Boolean);
  notes.push(...ccNotes);

  // ── Risk calculation — based on active sections and slug ──────────────────
  let riskScore = 0;
  const approverSections = [useCCM, useSUP, usePM, useGR, useCAT, usePT, useBUY, useDOA].filter(Boolean).length;
  if (approverSections >= 6)       riskScore += 3;
  else if (approverSections >= 4)  riskScore += 2;
  else if (approverSections >= 2)  riskScore += 1;
  if (boardRequired && useDOA)     riskScore += 2;
  if (isSoleSource)                riskScore += 2;
  if (isEmergency)                 riskScore += 2;
  if (isContract)                  riskScore += 1;
  if (useGK)                       riskScore += 1;

  const riskLevel: GeneratedWorkflow["riskLevel"] =
    riskScore >= 7 ? "Critical" : riskScore >= 5 ? "High" : riskScore >= 3 ? "Medium" : "Low";

  // ── SLA calculation ────────────────────────────────────────────────────────
  let slaDays = 2; // base
  if (useSUP)  slaDays += 2;
  if (useCCM)  slaDays += 1;
  if (usePM)   slaDays += 2;
  if (useGR)   slaDays += 3;
  if (useCAT)  slaDays += 2;
  if (useBUY)  slaDays += 2;
  if (useDOA)  slaDays += 2;
  if (boardRequired && useDOA) slaDays += 5;
  if (isSoleSource)  slaDays += 4;
  if (isContract)    slaDays += 3;
  if (useGK)         slaDays += 1;

  const estimatedSLA = isEmergency
    ? "24–48 hours (emergency track)"
    : `${slaDays}–${slaDays + 3} business days`;

  const approverCount = steps.filter(
    (s) => s.category === "approval" || s.category === "legal" || s.category === "executive"
  ).length;

  // ── "No approvers configured" safety note ────────────────────────────────
  if (approverCount === 0) {
    notes.push("No approver sections were configured. Return to Requirements and answer Yes for each approver type required.");
  }

  return {
    slug, label,
    generatedAt: Date.now(),
    riskLevel,
    estimatedSLA,
    totalApprovers: approverCount,
    steps,
    summaryNotes: notes,
    reqAnswers,
    wizAnswers,
  };
}
