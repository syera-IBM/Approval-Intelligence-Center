// ─────────────────────────────────────────────────────────────────────────────
// Procurement Approvals Knowledge Base
// Derived from all documents in src/imports/:
//   • Requisition_Approval_Workflow.pdf (LCPS)
//   • Oracle_SLED_Req_Approval_ICA_Training_Framework.pdf
//   • CD.05b_Common_Design_-_Approvals_Overview-1.pdf
//   • COD_Contract_Approvals_v1.pdf
//   • COD_Contract_Approval_Requirements.pdf
//   • EDM.335_SWBNO_Key_Design_Decision_SCM_Approvals.pdf
//   • EDM_320_MCPS_Workflow_KDD_SUBMITTED.pdf
//   • EDM_320_BCPSS_Workflow_KDD_V2.pdf
// ─────────────────────────────────────────────────────────────────────────────

export interface KBEntry {
  /** keywords used for matching (all lowercase) */
  keywords: string[];
  /** Human-readable answer with simple markdown: **bold**, numbered lists using \n1. */
  answer: string;
}

export const KNOWLEDGE_BASE: KBEntry[] = [

  // ── GENERAL OVERVIEW ────────────────────────────────────────────────────────
  {
    keywords: ["what can you", "help me", "what do you know", "overview", "about", "capabilities"],
    answer:
      "I can answer questions about Oracle Fusion SCM procurement approval workflows based on the following source documents:\n\n" +
      "1. **Requisition Approval Workflow** (LCPS)\n" +
      "2. **Oracle SLED ICA Training Framework** (KDD REQ-APP-001 to 030)\n" +
      "3. **Common Design Approvals Overview** (CD.05b)\n" +
      "4. **COD Contract Approvals** (City of Detroit)\n" +
      "5. **COD Contract Approval Requirements** (City of Detroit thresholds)\n" +
      "6. **SWBNO SCM Approvals KDD** (Sewerage & Water Board of New Orleans)\n" +
      "7. **MCPS Workflow KDD** (Montgomery County Public Schools)\n" +
      "8. **BCPSS Workflow KDD V2** (Baltimore City Public School System)\n\n" +
      "Ask me about approval thresholds, routing logic, specific clients, emergency procurement, contracts, ICA, sole source, BPM, delegation, or any KDD topic.",
  },

  // ── LCPS REQUISITION APPROVAL WORKFLOW ──────────────────────────────────────
  {
    keywords: ["lcps", "loudoun", "program manager", "f/a mgr", "fixed asset manager", "budget dir", "cabinet", "buyers group", "buyer group"],
    answer:
      "**LCPS Requisition Approval Workflow** (5 levels):\n\n" +
      "1. **Level 1 – Program Manager** (Cost Center Manager): Required for all amounts\n" +
      "2. **Level 2 – F/A Manager** (Fixed Asset Manager): Conditional — only for all 7xxxx accounts\n" +
      "3. **Level 3 – Budget Director**: Conditional — only for Fixed Assets > $5,000\n" +
      "4. **Level 4 – Cabinet**: Conditional — only for amounts > $100,000\n" +
      "5. **Level 5 – Buyers Group**: Required for all requisitions as final review & approval\n\n" +
      "When a conditional level is not triggered, the requisition advances to the next applicable level.",
  },

  // ── GENERAL APPROVAL THRESHOLDS (STANDARD) ──────────────────────────────────
  {
    keywords: ["threshold", "dollar", "amount", "how much", "how many", "limit", "value", "tier", "range", "sla", "how long", "days"],
    answer:
      "**Standard Oracle SCM Approval Threshold Matrix:**\n\n" +
      "1. **$0 – $10,000**: Supervisor only — SLA: 1 day\n" +
      "2. **$10,001 – $50,000**: Supervisor + Department Head — SLA: 2 days\n" +
      "3. **$50,001 – $250,000**: Department Head + Finance Controller — SLA: 3 days\n" +
      "4. **$250,001 – $500,000**: Finance Controller + CPO — SLA: 5 days\n" +
      "5. **$500,001 – $1,000,000**: CPO + CFO + Legal — SLA: 7 days\n" +
      "6. **> $1,000,000**: CPO + CFO + Board — SLA: 10–14 days\n\n" +
      "Thresholds may vary by department or client. See COD and SWBNO entries for client-specific rules.",
  },

  // ── WHO APPROVES / ROUTING ──────────────────────────────────────────────────
  {
    keywords: ["who approve", "who needs to", "who sign", "approver", "approval chain", "routing", "route", "level"],
    answer:
      "Approval routing depends on the transaction type and amount:\n\n" +
      "**Requisition**: Supervisor → Dept Head (> $10K) → Finance Controller (> $50K) → CPO (> $250K)\n" +
      "**Purchase Order**: Buyer Supervisor → Category Manager → VP Procurement (> $100K)\n" +
      "**Contract**: Legal Counsel → Procurement Director → CFO (> $500K) → Board (> $1M)\n" +
      "**ICA / Interagency**: Agency Procurement Lead → Receiving Agency Head → State Central Procurement\n" +
      "**Sole Source**: Requesting Manager → Legal → CPO / Procurement Director\n" +
      "**Emergency**: Department Head → CPO (verbal then written); post-award ratification within 30 days\n\n" +
      "Ask about a specific client (COD, SWBNO, MCPS, BCPSS) for their exact routing.",
  },

  // ── CPO ──────────────────────────────────────────────────────────────────────
  {
    keywords: ["cpo", "chief procurement", "procurement officer", "when cpo", "require cpo"],
    answer:
      "The **CPO (Chief Procurement Officer)** is required when:\n\n" +
      "1. Requisition or PO **exceeds $250,000**\n" +
      "2. Any **sole-source justification** is filed\n" +
      "3. **Emergency procurement** is declared\n" +
      "4. **Contract value exceeds $500,000**\n\n" +
      "In SWBNO, the Procurement Director (Cash Moses) serves as the final approver equivalent.",
  },

  // ── REQUISITION PROCESS STEPS ───────────────────────────────────────────────
  {
    keywords: ["process", "step", "flow", "end-to-end", "requisition to po", "req to po", "lifecycle", "how does"],
    answer:
      "**Oracle Fusion Requisition-to-PO Process:**\n\n" +
      "1. **Requisition Created** — Requester submits with line items, cost center, and justification\n" +
      "2. **Budget Check** — Oracle auto-validates budget availability; fails here if funds are insufficient\n" +
      "3. **Supervisor Review** — First human touchpoint; manager approves or escalates\n" +
      "4. **Department Head** — Required when amount exceeds departmental threshold\n" +
      "5. **Finance / Controller** — Fiscal validation for high-value or cross-departmental spend\n" +
      "6. **CPO / Final Auth** — Executive sign-off for spend above policy ceiling\n" +
      "7. **PO Issued** — Oracle auto-generates PO and notifies vendor upon all approvals complete",
  },

  // ── SOLE SOURCE ──────────────────────────────────────────────────────────────
  {
    keywords: ["sole source", "sole-source", "non-competitive", "no bid", "single source", "justification"],
    answer:
      "**Sole-Source / Non-Competitive Approval** requires:\n\n" +
      "1. **Written justification** document must be attached before approval can begin\n" +
      "2. **Requesting Manager** sign-off\n" +
      "3. **Legal Counsel** review\n" +
      "4. **CPO / Procurement Director** final approval\n\n" +
      "**SLA**: 5 business days\n\n" +
      "The justification flag must be set on the requisition in Oracle Fusion to trigger this path. " +
      "Self-approval is prohibited — the requester cannot approve their own sole-source requisition.",
  },

  // ── EMERGENCY ────────────────────────────────────────────────────────────────
  {
    keywords: ["emergency", "urgent", "expedited", "declared emergency", "ratif"],
    answer:
      "**Emergency Procurement Approval:**\n\n" +
      "1. **Emergency declaration** must be on file before the expedited path is triggered\n" +
      "2. **Department Head** approves\n" +
      "3. **CPO** approves (verbal authorization first, written follow-up required)\n" +
      "4. **Post-award ratification** is required within 30 days\n\n" +
      "**SLA**: Same day / 24 hours\n\n" +
      "Emergency paths may be abused without justification controls. A justification and audit trail are required for every emergency purchase. " +
      "The SLED framework (KDD REQ-APP-010) notes: who can mark a transaction as emergency and what approvals are bypassed must be explicitly designed.",
  },

  // ── CONTRACT ─────────────────────────────────────────────────────────────────
  {
    keywords: ["contract", "contract approval", "legal review", "contract time", "contract sla", "how long contract"],
    answer:
      "**Contract Approval** is multi-round with legal review preceding financial sign-off:\n\n" +
      "1. **Legal Counsel** — First gate, all contracts\n" +
      "2. **Procurement Director** — Required for all contract awards\n" +
      "3. **CFO** — Required for contracts > $500,000\n" +
      "4. **Board** — Required for contracts > $1,000,000\n\n" +
      "**SLA by value:**\n" +
      "Under $500K: 5–7 days | $500K–$1M: 7–10 days | Above $1M: 10+ days (Board ratification)\n\n" +
      "Triggered on contract creation or renewal.",
  },

  // ── ICA / INTERAGENCY ────────────────────────────────────────────────────────
  {
    keywords: ["ica", "interagency", "inter-agency", "intercompany", "mou", "sled", "cross-agency", "state", "local"],
    answer:
      "**ICA / Interagency Agreement Approval** (SLED-specific path):\n\n" +
      "1. **Agency Procurement Lead** — First approver\n" +
      "2. **Receiving Agency Head** — Second approver\n" +
      "3. **State Central Procurement** — Final authority\n\n" +
      "**Trigger**: When requisition source type is set to 'interagency' in Oracle Fusion\n" +
      "**Prerequisite**: A signed MOU must be on file before routing begins\n" +
      "**SLA**: 3–7 business days\n\n" +
      "The Oracle SLED ICA Training Framework (KDD REQ-APP-008/009) notes that funding source, fund type, and grant details all affect this routing. " +
      "Cross-agency transactions require decentralized department-specific approval rules.",
  },

  // ── PURCHASE ORDER ───────────────────────────────────────────────────────────
  {
    keywords: ["purchase order", "po approval", "po change", "change order", "po routing"],
    answer:
      "**Purchase Order Approval:**\n\n" +
      "1. **Buyer Supervisor** — First approver\n" +
      "2. **Category Manager** — Required for category-specific purchases\n" +
      "3. **VP Procurement** — Required for POs > $100,000\n\n" +
      "**Trigger**: On PO creation or modification\n" +
      "**SLA**: 1 business day\n\n" +
      "Change orders to approved POs trigger **re-approval** above the tolerance threshold. " +
      "Catalog-based orders may be set up with auto-approval. " +
      "In MCPS: POs < $15K can be approved by an Assistant Buyer or Buyer; POs ≥ $15K require the MCPS Buyer. " +
      "In SWBNO: Procurement Director reviews and approves all POs.",
  },

  // ── COD – CITY OF DETROIT ────────────────────────────────────────────────────
  {
    keywords: ["cod", "city of detroit", "detroit", "lauren davis", "sheilah", "diana schreiber", "marissa benitez", "angela andrews"],
    answer:
      "**City of Detroit (COD) Contract Approval Requirements:**\n\n" +
      "**Department thresholds by procurement type (Services / Construction / Goods):**\n" +
      "1. City Manager, Environmental & Street Services, General Services, Transportation, Water Management: **$250,000 max**\n" +
      "2. Economic & Workforce Development, Fleet Services, Housing, Parks, Technology Solutions: **$100,000 max**\n" +
      "3. All others (Audit, Budget, City Attorney, City Clerk, Finance, Fire, HR, Police, etc.): **$50,000 max**\n" +
      "4. Electric Utility: **$500,000 max**\n\n" +
      "**Approvers (multi-level):**\n" +
      "- 1st Approver: **Marissa Benitez / Angela Andrews** (Procurement Analyst Sidney Anderson)\n" +
      "- 2nd Approvers (Parallel Consensus): **UBC Business Services Administrator**, **Elizabeth Obrien** (Risk), **Carlos Hernandez** (City Attorney)\n" +
      "- 3rd Approver: **Sheilah Faucette** (City Manager's Office); above limits → **Lauren Davis** (Finance Deputy CFO)\n" +
      "- Level 4 (Review & Sign): **Lauren Davis** (Finance Deputy CFO / Deputy Finance Director)\n" +
      "- Level 5 (Signatures Only): **DCM/Designee William (Bo) Ferguson**, department Directors\n" +
      "- Level 6 (Signatures): **City Manager Diana Schreiber**; City Clerk for contracts > $50K\n\n" +
      "Approvers in red sign upon their review (Levels 6–9).",
  },

  // ── SWBNO ────────────────────────────────────────────────────────────────────
  {
    keywords: ["swbno", "sewerage", "water board", "new orleans", "cash moses", "michael johnsey", "jason garner", "alden", "barbara mack", "reginald", "procurement director swbno"],
    answer:
      "**SWBNO (Sewerage & Water Board of New Orleans) SCM Approval Workflow:**\n\n" +
      "**Requisition – Non-Project, Warehouse Restock (Non-Min-Max):**\n" +
      "Buyer → Manager (Michael Johnsey) → Dept Head (Jason Garner) → Procurement Director (Cash Moses)\n" +
      "If no contract exists and amount > $30K: add Buyer Supervisor before Manager step\n\n" +
      "**Requisition – PPM / Project-Related:**\n" +
      "Buyer → Buyer Supervisor → Principal Investigator → Steve Young → General Superintendent (Steve Nelson) → Procurement Director (Cash Moses)\n\n" +
      "**Requisition – Non-Project, Expense Destination:**\n" +
      "Buyer → Buyer Supervisor → Cost Center Manager (of Requester) → Director (of CC Manager)\n" +
      "- Materials & Supplies > $30K: + Dept Leadership → Deputy GSO → Chief Administrator → Procurement Director\n" +
      "- Professional Services > $15K: + Dept Leadership → Deputy GSO → Chief Administrator → Procurement Director\n" +
      "- Non-Professional Services > $30K: same chain as Materials\n\n" +
      "**Requisition – Solicitation Required:**\n" +
      "Buyer → Buyer Supervisor → CC Manager → Director → Dept Leadership → Deputy GSO → Chief Administrator → PDU → Risk Manager → EDBP → Legal (Approval Group) → Executive Director → Procurement Director\n\n" +
      "**Self-Approval**: Not allowed. Transaction escalation after **48 hours** to upline manager.",
  },

  // ── MCPS ─────────────────────────────────────────────────────────────────────
  {
    keywords: ["mcps", "montgomery county", "montgomery county public schools", "county public school"],
    answer:
      "**MCPS (Montgomery County Public Schools) Requisition Approval:**\n\n" +
      "Routing is account-based (\"Where the money is spent from\"), not supervisor hierarchy-based:\n\n" +
      "1. **Project Manager** (if PATEO project) — Sequence 1\n" +
      "2. **Inventory Account** (GL code 03-00000-00000-000-00-141040) → Eugenia Dawson only — Sequence 2\n" +
      "3. **GL Account Owner** (Org/Function/Project segment) — Sequence 3\n" +
      "4. Natural account 212023 or 212083 → Susan Chen; FYI to Kevin Soisson — Sequence 4\n" +
      "5. Natural account 505070 → Virginia Denning; FYI to Kevin Soisson — Sequence 5\n" +
      "6. Fixed Assets $1K–$5K → Property Management — Sequence 6\n" +
      "7. Fixed Assets ≥ $5K → Senior Accountant — Sequence 7\n" +
      "8. NIGP Code + Dollar Amount + Natural Account → Category approvals — Sequence 8\n" +
      "9. Instruction Materials, Technology, School Plant Operations → Subject Matter Approvers — Sequence 9\n" +
      "10. Operating Grants / Title 1 → Project Number from GL string — Sequence 10\n" +
      "11. Building Services (NIGP 485.00/485.65) → Area Supervisor → Director of Plant Operations — Sequence 11\n" +
      "12. Punchout → Buyer as final approver — Sequence 12\n\n" +
      "**PO Approval**: < $15K = Assistant Buyer or Buyer; ≥ $15K = MCPS Buyer only\n" +
      "**Agreements**: < $25K = Assistant Buyer or Buyer; ≥ $25K = MCPS Buyer only",
  },

  // ── BCPSS ─────────────────────────────────────────────────────────────────────
  {
    keywords: ["bcpss", "baltimore", "baltimore city", "baltimore public school", "peter ruchkin", "debi green"],
    answer:
      "**BCPSS (Baltimore City Public School System) Workflow:**\n\n" +
      "Approval routing follows account-based logic (similar to MCPS) using Static Approval Groups:\n\n" +
      "**Requisition routing sequences:**\n" +
      "1. PATEO project → Project Manager only\n" +
      "2. Fund 02 + Function starts with 005 (excl. 00570/00573/00590) → PROJ_APPROVER group\n" +
      "3. Project segment populated (outside Fund 02 rule) → PROJ_APPROVER group\n" +
      "4. Function 00570, 00573, 00590 → FUNC_ALL approver\n" +
      "5. Other function values → FuncApprover\n" +
      "6. Building Services (NIGP 485.00/485.65) → Area Supervisor → Director of Plant Operations\n" +
      "7. Inventory GL code 03-00000-... or 03-35101-... → Eugenia Dawson only\n" +
      "8. GL string → GL Account Owner Logic\n" +
      "9. NIGP code-based category approvals\n" +
      "10–11. Fixed Assets: $1K–$5K → Property Mgmt; ≥ $5K → Senior Accountant\n" +
      "12. Instruction/Technology/School Plant → Subject Matter Approvers\n" +
      "13. Operating Grants → Project Number routing\n\n" +
      "**Workflow timeout**: 21 days, repeat 2 times\n" +
      "**BPM approach**: Static Approval Groups (not role-based) for visibility of approver names",
  },

  // ── BPM vs FSM ───────────────────────────────────────────────────────────────
  {
    keywords: ["bpm", "fsm", "functional setup manager", "business process management", "bpm vs", "fsm vs", "which tool", "configuration"],
    answer:
      "**FSM (Functional Setup Manager) vs BPM (Business Process Management):**\n\n" +
      "**Use FSM when:**\n" +
      "- Routing can be expressed through clear approval stages, conditions, and approver groups\n" +
      "- Cost center approver mapping is straightforward\n" +
      "- Threshold logic is single-dimension (amount-based)\n" +
      "- Category routing is based on stable category values\n\n" +
      "**Use BPM when:**\n" +
      "- Routing requires nested logic, complex sequencing, or custom expressions\n" +
      "- Cost center routing must vary by funding source, category, project, grant, or complex exception rules\n" +
      "- Thresholds combine amount, category, department, fund, supplier type, and emergency status\n" +
      "- Cumulative or look-back spend controls are required\n" +
      "- Supervisory approval has complex skip logic\n\n" +
      "MCPS and BCPSS both use **BPM** with account-based routing because their approval logic depends on 'where the money is spent from' rather than 'who spends it'.",
  },

  // ── PARTICIPANT TYPES ────────────────────────────────────────────────────────
  {
    keywords: ["serial", "parallel", "consensus", "first responder", "fyi", "participant type", "voting", "simultaneous"],
    answer:
      "**Approval Participant Types in Oracle Fusion:**\n\n" +
      "1. **Serial** — Approvers work in sequence, one after another. Most common for management hierarchy routing.\n" +
      "2. **Parallel** — All approvers receive the task simultaneously. Unanimous approval required; one rejection rejects all.\n" +
      "3. **Single (First Responder Wins)** — Assigned to multiple users; the outcome is decided by the first to approve or reject.\n" +
      "4. **Consensus** — All approvers must respond; majority or all must agree depending on configuration.\n" +
      "5. **FYI** — Notification only. No response required; users cannot take action.",
  },

  // ── DELEGATION / VACATION ────────────────────────────────────────────────────
  {
    keywords: ["delegation", "delegate", "vacation", "out of office", "unavailable", "backup approver", "reassign"],
    answer:
      "**Approval Delegation in Oracle Fusion (KDD REQ-APP-018):**\n\n" +
      "Options available:\n" +
      "1. **Vacation Period** — Set in BPM Worklist → Preferences → Vacation Period. Enter dates and select a delegate.\n" +
      "2. **Reassign** — Transfer tasks to subordinates or groups the approver manages.\n" +
      "3. **Delegate** — Delegate to any user or group. Access rights are determined by the original delegator.\n" +
      "4. **Backup Approvers** — Defined in approval groups as secondary members.\n" +
      "5. **Escalation after aging** — Transactions escalate to the upline manager if not acted upon within the SLA window.\n\n" +
      "In SWBNO, escalation occurs after **48 hours**. In BCPSS, workflow timeout is **21 days**, repeating 2 times. " +
      "Best practice: use standard delegation and reassignment functionality where possible before building complex BPM escalation.",
  },

  // ── ESCALATION ───────────────────────────────────────────────────────────────
  {
    keywords: ["escalat", "stall", "stuck", "timeout", "aging", "reminder", "no action", "not approved"],
    answer:
      "**Approval Escalation Rules (KDD REQ-APP-025):**\n\n" +
      "Standard approach:\n" +
      "1. **Reminder notification** sent to approver before escalation\n" +
      "2. **Escalate to backup approver** if primary is unresponsive\n" +
      "3. **Reassign to supervisor** after aging threshold\n" +
      "4. **Procurement admin intervention** as last resort\n\n" +
      "**Client-specific timeouts:**\n" +
      "- SWBNO: escalation to upline manager after **48 hours**\n" +
      "- BCPSS: workflow timeout set to **21 days**, repeat **2 times**\n\n" +
      "Best practice: implement reminders before complex escalation. Stalled approvals delay procurement and reduce trust in the system.",
  },

  // ── BUDGET CHECK ─────────────────────────────────────────────────────────────
  {
    keywords: ["budget", "funds", "budget check", "insufficient funds", "fund validation", "budget validation"],
    answer:
      "**Budget Validation (KDD REQ-APP-021 / REQ-APP-022):**\n\n" +
      "Budget validation timing options:\n" +
      "1. **Validate before submission** — Checked before the requisition enters the approval chain\n" +
      "2. **Validate during approval** — Checked at a specific approval stage\n" +
      "3. **Validate before PO creation** — Final check before commitment\n\n" +
      "**When funds validation fails:**\n" +
      "- Hard stop (most common for formal budget controls)\n" +
      "- Warning only (allows override with justification)\n" +
      "- Route to budget office for resolution\n" +
      "- Route to cost center owner\n\n" +
      "Oracle auto-validates budget availability as Step 2 of the requisition workflow. " +
      "Approving unfunded requisitions creates downstream failures — validate funding before final commitment where practical.",
  },

  // ── SELF-APPROVAL / SOD ──────────────────────────────────────────────────────
  {
    keywords: ["self-approval", "self approval", "requester approve", "segregation", "sod", "conflict of interest", "own requisition"],
    answer:
      "**Segregation of Duties / Self-Approval (KDD REQ-APP-019):**\n\n" +
      "- **Self-approval is prohibited** in most Oracle Fusion configurations and all client KDDs reviewed\n" +
      "- In SWBNO: explicitly restricted — 'Self-Approval of requisitions is not allowed'\n" +
      "- Best practice: Use the 'Skip Creator for Approval List' setting to prevent the transaction creator from appearing in the approval chain\n\n" +
      "Exceptions may exist for executives or in emergency scenarios, but these must be explicitly documented. " +
      "Self-approval can create audit exposure and is a critical audit control.",
  },

  // ── SUPPLIER REGISTRATION ────────────────────────────────────────────────────
  {
    keywords: ["supplier registration", "new supplier", "vendor registration", "supplier portal", "spend authorized", "w9", "tin"],
    answer:
      "**Supplier Registration Approval Workflow:**\n\n" +
      "**External (via Supplier Portal):**\n" +
      "1. Prospective supplier submits registration (Company Details, Contacts, Address, Business Classification, Products/Services)\n" +
      "2. **Office Worker / Procurement Buyer** — Approves, Rejects, or Requests Resubmit (W9, Name, TIN Verification)\n" +
      "3. **Procurement Director** — Final approval\n\n" +
      "**Spend Authorization (after registration):**\n" +
      "1. Office Worker / Payables Dept promotes to Spend Authorized\n" +
      "2. **Payables Administrator** — Validates W9, Bank, and Certifications\n\n" +
      "**Supplier Profile Changes:**\n" +
      "1. Supplier submits change via portal\n" +
      "2. **AP Department / Supplier Manager Role** — Reviews and Approves\n" +
      "3. For SWBNO: Procurement Director gives final approval\n\n" +
      "Suppliers cannot respond to rejected requests — only to 'Request Resubmit' actions.",
  },

  // ── CONTRACT APPROVALS – SWBNO ───────────────────────────────────────────────
  {
    keywords: ["swbno contract", "contract clause", "terms template", "theron", "mary arceneaux", "yoland grinstead", "randy hayman"],
    answer:
      "**SWBNO Contract Approvals:**\n\n" +
      "**Contract Clause Approval:**\n" +
      "Automatic approval — the Legal party entering the clause has authority (Theron Levi & Mary Arceneaux)\n\n" +
      "**Contract Terms Template:**\n" +
      "Sequential: Special Counsel (Yoland Grinstead) → Executive Director (Randy Hayman)\n\n" +
      "**Full Contract Approval (from Sourcing or Standalone):**\n" +
      "1. Legal creates and submits contract\n" +
      "2. **Legal Approval Group** (Theron Levi & Mary Arceneaux) → **Rita Laners** (sequential)\n" +
      "3. **FYI** notification to Legal Contract FYI Group (Gloria Mackey, Joseph Daugrid, Teresa Nelson, Cole Dela Cruz, Cash Moses)",
  },

  // ── WORK CONFIRMATIONS ───────────────────────────────────────────────────────
  {
    keywords: ["work confirmation", "work confirm"],
    answer:
      "**Work Confirmation Approval (SWBNO):**\n\n" +
      "1. Requester enters Work Confirmation and submits\n" +
      "2. Sequential order: **Project Manager** → **PDU (Approval Group)** → **Project Department Director**\n\n" +
      "Note: Work Confirmations are submitted by **Requesters only** — not by suppliers. " +
      "Approver may Approve, Reject, or Request More Information regardless of the confirmation amount.",
  },

  // ── AGREEMENTS / BPA ─────────────────────────────────────────────────────────
  {
    keywords: ["agreement", "blanket", "bpa", "cpa", "blanket purchase", "contract purchase"],
    answer:
      "**Blanket/Contract Purchase Agreement (BPA/CPA) Approvals:**\n\n" +
      "**Common Design (Sample 1):**\n" +
      "Buyer → Procurement Manager → Purchasing Director → Superintendent\n\n" +
      "**Common Design (Sample 2):**\n" +
      "Buyer → Procurement Manager → Purchasing Director → Board\n\n" +
      "**MCPS Agreements:**\n" +
      "- < $25K: MCPS Assistant Buyer or MCPS Buyer can approve\n" +
      "- ≥ $25K: MCPS Buyer required; Assistant Buyer must reassign\n\n" +
      "**SWBNO Agreements:**\n" +
      "Procurement Analyst/Specialist submits → Procurement Director approves",
  },

  // ── APPROVAL GROUPS ──────────────────────────────────────────────────────────
  {
    keywords: ["approval group", "create group", "approval group setup", "static approval", "bpm group"],
    answer:
      "**Approval Groups in Oracle Fusion BPM:**\n\n" +
      "An approval group is a static, predefined set of users who act on a task in serial or parallel mode.\n\n" +
      "**To create an approval group:**\n" +
      "1. Sign into BPM Worklist as administrator\n" +
      "2. Click Administration → Approval Groups tab\n" +
      "3. Click the + icon and enter the group name\n" +
      "4. Add users via the Details area\n" +
      "5. Save the approval group\n\n" +
      "**BCPSS/MCPS naming conventions:**\n" +
      "- PROJ_<Project Value>_APPROVER\n" +
      "- FUNC_<Function Value>_APPROVER\n" +
      "- ORG_<Department Value>_APPROVER\n" +
      "- SPO_<Location>_APPROVER (BCPSS School Plant Operations)\n" +
      "- CFO Approval Group, Controller Approval Group",
  },

  // ── WORKFLOW TRANSACTION CONSOLE ─────────────────────────────────────────────
  {
    keywords: ["transaction console", "workflow console", "stuck transaction", "failed workflow", "synchronize workflow", "admin console"],
    answer:
      "**Workflow Transaction Console (Admin Only):**\n\n" +
      "Navigation: **Tools → Schedule Processes → Synchronize Transaction Workflow Status**\n\n" +
      "Used to:\n" +
      "1. View the latest status of all workflow tasks\n" +
      "2. Review failed workflow tasks and their issue descriptions\n" +
      "3. Recover failed tasks after correcting the rule\n" +
      "4. Withdraw a task in progress\n" +
      "5. Download search results to CSV\n\n" +
      "Two options: **View Transaction Workflow Status** (see stuck transactions) and **Synchronize Transaction Workflow Status** (update status or withdraw).\n\n" +
      "Role required: **Financial Application Administrator**",
  },

  // ── TOUCHLESS / AUTO-PO ──────────────────────────────────────────────────────
  {
    keywords: ["touchless", "auto-po", "auto po", "automatic po", "auto generate", "po generation", "auto-transmit", "auto transmit"],
    answer:
      "**Touchless Procurement / Auto-PO Generation (KDD REQ-APP-012 to 015):**\n\n" +
      "**Eligible for auto-PO:**\n" +
      "- Catalog requisitions with approved suppliers\n" +
      "- Contract-backed requisitions\n" +
      "- Approved supplier purchases\n" +
      "- Low-dollar, routine purchases\n\n" +
      "**Should auto-generated POs require separate approval?**\n" +
      "Options: Requisition approval serves as PO approval | PO auto-approved below threshold | PO requires procurement or finance approval\n\n" +
      "**Auto-transmit options:**\n" +
      "Auto-transmit all approved POs | Catalog POs only | Procurement reviews before transmit | Manual transmit only\n\n" +
      "**Exception handling (when auto-PO fails):**\n" +
      "Route to buyer | Return to requester | Route to procurement queue | Create incomplete PO | Hold for review\n\n" +
      "Best practice: Use touchless procurement for repeatable, policy-compliant purchases only.",
  },

  // ── CATEGORY-BASED ROUTING ───────────────────────────────────────────────────
  {
    keywords: ["category", "nigp", "commodity", "it approval", "fleet", "facilities", "legal category", "furniture", "fixed asset", "category routing"],
    answer:
      "**Category-Based Approval Routing (KDD REQ-APP-007):**\n\n" +
      "Certain procurement categories require specialized approval:\n" +
      "- **IT / Technology**: Additional IT department approval\n" +
      "- **Fleet**: Fleet department sign-off\n" +
      "- **Facilities / School Plant Operations**: SPO Area Supervisor → Director of Plant Operations (BCPSS uses NIGP codes 485.00/485.65)\n" +
      "- **Legal Services**: Legal Counsel review\n" +
      "- **Fixed Assets**: Property Management ($1K–$5K) or Senior Accountant (≥ $5K) — MCPS/BCPSS\n" +
      "- **Punchout purchases**: Route to Buyer as final approver (MCPS)\n\n" +
      "Identification method:\n" +
      "- NIGP/commodity code at Level 2 of Manage Procurement Category Hierarchy\n" +
      "- DFF (Descriptive Flex Field) flags on requisition lines\n" +
      "- Account combination segment values\n\n" +
      "Poor category maintenance breaks routing — use category approval only for true control points.",
  },

  // ── GRANT / FUNDING BASED ────────────────────────────────────────────────────
  {
    keywords: ["grant", "grant-funded", "title 1", "pateo", "operating grant", "capital grant", "funding source", "fund"],
    answer:
      "**Grant-Funded Requisition Approval (KDD REQ-APP-008 / 009):**\n\n" +
      "Grant-funded purchases often require extra validation for:\n" +
      "- Allowability\n" +
      "- Period of performance\n" +
      "- Funding restrictions\n\n" +
      "**MCPS/BCPSS Routing for Grants:**\n" +
      "- If PATEO project account: route to **Project Manager** defined in P&G system\n" +
      "- Operating Grants / Title 1: use GL string (Project Number from first requisition line)\n" +
      "- Fund 02 + Function starting with 005 (excl. 00570/00573/00590) → PROJ_APPROVER group\n\n" +
      "**Options per SLED framework:**\n" +
      "Grant office approves all grant-funded purchases | Grant office approves above threshold | Finance validates only | No separate grant review\n\n" +
      "Automate grant validation where possible, but avoid unnecessary review of low-risk transactions.",
  },

  // ── KDD FRAMEWORK / DISCOVERY QUESTIONS ─────────────────────────────────────
  {
    keywords: ["kdd", "key design decision", "discovery question", "req-app", "framework", "design decision"],
    answer:
      "**Oracle SLED Requisition Approval KDD Framework (REQ-APP-001 to REQ-APP-030):**\n\n" +
      "**Approval Foundation**: REQ-APP-001 (Governance Model)\n" +
      "**Approval Routing**: REQ-APP-002 to 010 (Cost center, supervisor, thresholds, cumulative spend, dept rules, category, funding, grant, emergency)\n" +
      "**Procurement Review**: REQ-APP-011 to 015 (Buyer review, touchless PO, PO approval, transmission, exceptions)\n" +
      "**Governance**: REQ-APP-016 to 020 (External oversight, delegated authority, vacation rules, SOD, policy exceptions)\n" +
      "**Budgetary Controls**: REQ-APP-021 to 022 (Budget check timing, insufficient funds)\n" +
      "**Routing & Security**: REQ-APP-023 to 028 (Parallel/sequential, FYI, escalation, approver eligibility, restrictions, required attributes)\n" +
      "**Testing & Training**: REQ-APP-029 to 030\n\n" +
      "Each KDD includes: AI discovery question, possible client responses, AI interpretation logic, FSM vs BPM guidance, primary configuration object, dependencies, risks, and leading practices.",
  },

  // ── BEST PRACTICES ───────────────────────────────────────────────────────────
  {
    keywords: ["best practice", "tip", "recommendation", "leading practice", "guidance", "avoid", "pitfall", "risk"],
    answer:
      "**Oracle SCM Approval Configuration Best Practices:**\n\n" +
      "1. Start with the **simplest approval structure** that satisfies policy and audit requirements\n" +
      "2. **Normalize approval thresholds** before configuring workflow — overlapping thresholds create routing conflicts\n" +
      "3. Use **transaction-level controls** in workflow; monitor cumulative spend through reporting\n" +
      "4. **Challenge unnecessary department-level exceptions** — too much variation undermines standardization\n" +
      "5. Use **category approval only for true control points** — poor category maintenance breaks routing\n" +
      "6. Separate **validation requirements** from approval routing requirements\n" +
      "7. Where requisition approval is robust, **avoid repeating the same approval on the PO**\n" +
      "8. Require **justification and audit trail** for emergency purchases\n" +
      "9. **Avoid self-approval** except in clearly documented exceptions\n" +
      "10. Add **Assign Managers** to employees in Manage Users if using Hierarchy routing\n" +
      "11. Use **Maximum Escalation Levels** or **Highest Approval Title** for escalations\n" +
      "12. Enable **'Skip Creator for Approval List'** to prevent self-approval if creator is in the flow\n" +
      "13. Do **not modify usernames** once defined — approval groups reference them directly",
  },

  // ── APPROVAL GOVERNANCE MODEL ────────────────────────────────────────────────
  {
    keywords: ["governance", "governance model", "approval model", "hierarchy", "supervisory hierarchy", "position hierarchy", "job level"],
    answer:
      "**Approval Governance Models (KDD REQ-APP-001):**\n\n" +
      "Common models used across clients:\n" +
      "1. **Supervisory Hierarchy** — Approvals route up the employee's supervisor chain defined in HCM\n" +
      "2. **Position Hierarchy** — Based on positions defined and assigned in HCM\n" +
      "3. **Job Level** — Routes to approvers with sufficient job level in the hierarchy\n" +
      "4. **Cost Center Approver** — Routes based on the cost center charged (common in SLED)\n" +
      "5. **Approval Group** — Static predefined group acts on the task\n" +
      "6. **Department Approver** — Routes to the department head or manager\n\n" +
      "A poorly defined governance model causes inconsistent approvals and high maintenance. " +
      "Start with the simplest structure that satisfies policy and audit requirements.",
  },

  // ── SOLICITATION ─────────────────────────────────────────────────────────────
  {
    keywords: ["solicitation", "negotiation", "rfp", "rfq", "bid", "award", "procurement specialist"],
    answer:
      "**Solicitation / Negotiation Approval (SWBNO):**\n\n" +
      "**Solicitation Approval:**\n" +
      "1. Procurement Specialist creates Solicitation (from scratch or from a Requisition)\n" +
      "2. Collaboration Team (Procurement, PDU, Internal Audit, Risk Manager, EDBP, Legal) is assigned tasks during evaluation\n" +
      "3. Procurement Specialist submits for Approval\n" +
      "4. Procurement Director reviews and Approves, Rejects, or Requests More Information\n\n" +
      "**Award Approval:**\n" +
      "1. Procurement Specialist awards the Solicitation\n" +
      "2. Procurement Director reviews and Approves, Rejects, or Requests More Information\n\n" +
      "Note: MCPS and BCPSS have decided **not to utilize** the solicitation workflow.",
  },

  // ── MATERIAL REQUESTS / INVENTORY ───────────────────────────────────────────
  {
    keywords: ["material request", "inventory", "cycle count", "physical inventory", "min-max", "warehouse"],
    answer:
      "**Inventory Workflow (SWBNO):**\n\n" +
      "**Material Requests:**\n" +
      "1. Requester enters request → Materials picked and ship confirmed → Delivered\n" +
      "2. FYI notification to Zone Manager & Q&A Manager\n\n" +
      "**Cycle Counts:**\n" +
      "1. Define Cycle Count with Approval Required enabled\n" +
      "2. Approval Type: Always or If out of tolerance\n" +
      "3. Warehouse Manager or Inventory Manager can Approve Count Sequences\n\n" +
      "**Physical Inventory:**\n" +
      "1. Physical Inventory must be complete before approval\n" +
      "2. Action: Approve Physical Inventory Adjustment\n" +
      "3. Warehouse Manager or Inventory Manager approves\n\n" +
      "**Min-Max Requisitions** (SWBNO): Released by Public Works Supervisor → same approval chain as Non-Min-Max",
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Synonym / common-typo map
// Maps misspellings and abbreviations → canonical keyword used in KB entries
// ─────────────────────────────────────────────────────────────────────────────
const SYNONYMS: Record<string, string> = {
  // typos / alternate spellings
  "requisiton": "requisition", "requsition": "requisition", "reqisition": "requisition",
  "requestion": "requisition", "requsistion": "requisition", "requisitions": "requisition",
  "approvol": "approval",      "approvel": "approval",       "approvall": "approval",
  "aprovals": "approval",      "approvlas": "approval",      "approvals": "approval",
  "emergancy": "emergency",    "emergencey": "emergency",    "emegency": "emergency",
  "emergeny": "emergency",     "emergenci": "emergency",
  "constract": "contract",     "contarct": "contract",       "contraact": "contract",
  "conract": "contract",       "contrat": "contract",
  "procurment": "procurement", "procuremnt": "procurement",  "procurement": "procurement",
  "procrement": "procurement", "proucement": "procurement",
  "deligation": "delegation",  "delegasion": "delegation",   "delegaton": "delegation",
  "escalaton": "escalation",   "escilation": "escalation",   "escaltaion": "escalation",
  "treshold": "threshold",     "threashold": "threshold",    "threshhold": "threshold",
  "thresholds": "threshold",   "threshols": "threshold",
  "solicatation": "solicitation", "solicitatoin": "solicitation", "solicitaiton": "solicitation",
  "suplier": "supplier",       "suppiler": "supplier",       "suppier": "supplier",
  "supplyer": "supplier",
  "vaccation": "vacation",     "vacaton": "vacation",        "vacacion": "vacation",
  "hierachy": "hierarchy",     "hierarcy": "hierarchy",      "hierchy": "hierarchy",
  "heirarchy": "hierarchy",    "hiearchy": "hierarchy",
  "workfow": "workflow",       "wokflow": "workflow",        "workfloe": "workflow",
  "workflo": "workflow",
  "authoization": "authorization", "athority": "authority",  "autority": "authority",
  "delegat": "delegation",     "delgate": "delegation",
  "amont": "amount",           "amout": "amount",            "ammount": "amount",
  // abbreviations / alternate forms
  "req":  "requisition",  "reqs": "requisition",
  "po":   "purchase order", "pos": "purchase order",
  "bpo":  "purchase order", "p.o": "purchase order",
  "cpo":  "cpo",
  "cfo":  "cfo",
  "ica":  "ica",
  "sled": "sled",
  "kdd":  "kdd",
  "bpm":  "bpm",
  "fsm":  "fsm",
  "hcm":  "hcm",
  "nigp": "nigp",
  "dff":  "dff",
  "fyi":  "fyi",
  "sod":  "segregation",
  "mou":  "mou",
  "erp":  "oracle",
  "fusion": "oracle",
  "scm":  "routing",
  // client aliases
  "detroit":   "cod",   "city of detroit": "cod",
  "new orleans": "swbno", "sewerage": "swbno", "water board": "swbno",
  "montgomery": "mcps", "montgomery county": "mcps",
  "baltimore":  "bcpss", "balt": "bcpss",
  "lcps": "lcps", "loudoun": "lcps",
  // common question lead-ins (stripped, but kept for partial matching)
  "what is": "", "what are": "", "how does": "", "how do": "",
  "can you": "", "tell me": "", "explain": "", "describe": "",
  "show me": "", "give me": "", "help me": "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Levenshtein distance (edit distance) for fuzzy single-word matching
// ─────────────────────────────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalise input: lower-case, apply synonym map, strip filler words
// ─────────────────────────────────────────────────────────────────────────────
function normalise(input: string): string {
  let q = input.toLowerCase().trim();

  // Apply multi-word synonym phrases first (longest first)
  const multiPhrases = Object.entries(SYNONYMS)
    .filter(([k]) => k.includes(" "))
    .sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, replacement] of multiPhrases) {
    if (q.includes(phrase)) q = q.replace(phrase, replacement);
  }

  // Apply single-word synonyms token by token
  const tokens = q.split(/\s+/);
  const mapped = tokens.map((tok) => {
    // exact synonym hit
    if (SYNONYMS[tok] !== undefined) return SYNONYMS[tok] || "";
    // fuzzy: find closest synonym key within edit distance 2 (only for words ≥ 6 chars)
    if (tok.length >= 6) {
      let closestDist = 3;
      let closestVal  = tok;
      for (const [key, val] of Object.entries(SYNONYMS)) {
        if (key.includes(" ")) continue;
        if (Math.abs(key.length - tok.length) > 3) continue;
        const d = levenshtein(tok, key);
        if (d < closestDist) { closestDist = d; closestVal = val || tok; }
      }
      return closestVal;
    }
    return tok;
  });
  return mapped.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Score a KB entry against the normalised query
// ─────────────────────────────────────────────────────────────────────────────
function scoreEntry(q: string, entry: KBEntry): number {
  let score = 0;
  for (const kw of entry.keywords) {
    if (q.includes(kw)) {
      // Exact substring hit — weight by keyword length (specificity)
      score += kw.length * 2;
    } else {
      // Fuzzy per-token: check if any query token is close to any keyword token
      const qTokens  = q.split(/\s+/);
      const kwTokens = kw.split(/\s+/);
      for (const qt of qTokens) {
        for (const kt of kwTokens) {
          if (qt.length < 4 || kt.length < 4) continue;
          const d = levenshtein(qt, kt);
          if (d <= 1) score += kt.length;        // 1-char edit
          else if (d === 2 && kt.length > 6) score += Math.floor(kt.length / 2); // 2-char edit on longer words
        }
      }
    }
  }
  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// General procurement Q&A for broad / non-document questions
// ─────────────────────────────────────────────────────────────────────────────
const GENERAL_QA: Array<{ patterns: string[]; answer: string }> = [
  {
    patterns: ["what is procurement", "procurement mean", "define procurement", "procurement definition"],
    answer:
      "**Procurement** is the process of sourcing, purchasing, and receiving goods or services that an organisation needs to operate. " +
      "In Oracle Fusion SCM this covers the full cycle from requisition creation through supplier selection, purchase order issuance, receipt, and payment. " +
      "Good procurement practices ensure value for money, legal compliance, appropriate approvals, and a clear audit trail.",
  },
  {
    patterns: ["what is a requisition", "what is req", "define requisition", "requisition mean"],
    answer:
      "A **purchase requisition** is an internal document submitted by an employee requesting that the organisation buy specific goods or services. " +
      "In Oracle Fusion it is created in Self-Service Procurement and must be approved before a Purchase Order can be raised. " +
      "It captures line items, quantities, cost centers, justification, and any funding information needed for approval routing.",
  },
  {
    patterns: ["what is a purchase order", "what is po", "define purchase order", "po mean"],
    answer:
      "A **Purchase Order (PO)** is a formal, legally binding document issued by the buyer to a supplier authorising the purchase of goods or services at agreed terms. " +
      "In Oracle Fusion, POs can be created from approved requisitions (via Document Builder) or as standalone POs. " +
      "They must go through their own approval workflow before being transmitted to the supplier.",
  },
  {
    patterns: ["what is oracle fusion", "what is oracle scm", "oracle cloud", "fusion scm"],
    answer:
      "**Oracle Fusion Cloud SCM (Supply Chain Management)** is Oracle's cloud ERP solution for procurement and supply chain. " +
      "It includes modules for Self-Service Procurement, Purchasing, Sourcing, Supplier Management, Inventory, and Contracts. " +
      "Approval workflows are configured using **FSM (Functional Setup Manager)** for standard rules or **BPM (Business Process Management)** for complex routing logic.",
  },
  {
    patterns: ["what is bpm", "business process management", "bpm worklist"],
    answer:
      "**BPM (Business Process Management)** is Oracle's workflow tool used to configure complex approval routing rules in Oracle Fusion Cloud. " +
      "The BPM Worklist is a web-based application where users view their approval tasks and administrators set up rules. " +
      "It is used when routing logic is too complex for FSM — for example, when approvals depend on multiple COA segments, funding sources, or custom conditions.",
  },
  {
    patterns: ["what is fsm", "functional setup manager"],
    answer:
      "**FSM (Functional Setup Manager)** is Oracle Fusion's standard approval configuration tool. " +
      "It provides a guided setup interface for configuring approval rules, conditions, and approver groups for common scenarios. " +
      "FSM is preferred over BPM for straightforward routing based on amount thresholds, supervisory hierarchy, or cost center ownership.",
  },
  {
    patterns: ["what is cost center", "cost centre", "cost center mean", "define cost center"],
    answer:
      "A **cost center** is a segment of the Oracle Chart of Accounts that identifies the smallest organisational unit for which costs are tracked. " +
      "In approval routing, the cost center on a requisition is used to derive the responsible manager or approver group. " +
      "Oracle Cloud requires at least one COA segment to be designated as the Cost Center qualifier.",
  },
  {
    patterns: ["what is hcm", "human capital management", "hcm hierarchy"],
    answer:
      "**HCM (Human Capital Management)** is Oracle's HR module that stores the employee supervisory hierarchy, job levels, and position assignments. " +
      "It is the foundation for supervisory-based approval routing in Oracle Fusion SCM — approval chains follow the manager relationships defined in HCM. " +
      "If HCM is not fully implemented (as in MCPS), organisations must use alternative routing approaches like role-based or account-based approval groups.",
  },
  {
    patterns: ["what is an approval group", "approval group mean", "define approval group"],
    answer:
      "An **approval group** in Oracle Fusion BPM is a named, static set of users who are assigned to act on approval tasks together. " +
      "Groups can be configured as Serial (one at a time), Parallel (all simultaneously), or Single (first responder wins). " +
      "They are used when a role or account segment needs a dedicated set of approvers rather than routing up the supervisory hierarchy.",
  },
  {
    patterns: ["what is delegation of authority", "delegated authority", "authority matrix"],
    answer:
      "A **Delegation of Authority (DOA)** is a formal policy document that defines who is authorised to approve transactions up to specific dollar limits. " +
      "In Oracle Fusion, the DOA is translated into approval rules and conditions in FSM or BPM. " +
      "Without a clear DOA, approval configuration leads to disputes and rework — KDD REQ-APP-017 identifies the DOA as the backbone of all approval configuration.",
  },
  {
    patterns: ["what clients", "which clients", "which organizations", "which schools", "who uses this"],
    answer:
      "The approval workflows in this knowledge base cover the following clients and frameworks:\n\n" +
      "1. **LCPS** (Loudoun County Public Schools) — 5-level requisition workflow\n" +
      "2. **COD** (City of Detroit) — Multi-level contract approvals with named approvers and department thresholds\n" +
      "3. **SWBNO** (Sewerage & Water Board of New Orleans) — Complex req, PO, contract, solicitation, and inventory workflows\n" +
      "4. **MCPS** (Montgomery County Public Schools) — Account-based routing using BPM with role-based approver groups\n" +
      "5. **BCPSS** (Baltimore City Public School System) — Similar to MCPS but uses Static Approval Groups instead of roles\n" +
      "6. **SLED ICA Framework** — Oracle training framework covering 30 KDDs for State/Local/Education procurement",
  },
  {
    patterns: ["hello", "hi ", "hey ", "good morning", "good afternoon", "greetings"],
    answer:
      "Hello! I'm the **Procurement Approvals Agent**. I can answer questions about Oracle Fusion SCM approval workflows based on source documents for LCPS, COD, SWBNO, MCPS, BCPSS, and the SLED ICA Framework.\n\n" +
      "You can ask me about:\n" +
      "- Approval thresholds and routing rules\n" +
      "- Specific client workflows (COD, SWBNO, MCPS, BCPSS)\n" +
      "- Contract, ICA, sole source, or emergency approvals\n" +
      "- BPM vs FSM configuration\n" +
      "- Delegation, escalation, and budget validation\n" +
      "- Any of the 30 KDD design decision topics",
  },
  {
    patterns: ["thank", "thanks", "thank you", "thx", "cheers"],
    answer: "You're welcome! Feel free to ask if you have any more procurement or approval workflow questions.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main exported query function
// ─────────────────────────────────────────────────────────────────────────────
export function queryKnowledgeBase(input: string): string {
  const raw = input.toLowerCase().trim();
  const q   = normalise(raw);

  // 1. Check general Q&A patterns first (exact substring on raw input)
  for (const item of GENERAL_QA) {
    for (const pat of item.patterns) {
      if (raw.includes(pat) || q.includes(pat)) return item.answer;
    }
  }

  // 2. Score every KB entry against the normalised query
  let best: KBEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    const score = scoreEntry(q, entry);
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  // Require a minimum confidence score to avoid spurious matches
  if (best && bestScore >= 4) return best.answer;

  // 3. Second pass on raw input in case normalisation degraded the query
  for (const entry of KNOWLEDGE_BASE) {
    const score = scoreEntry(raw, entry);
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  if (best && bestScore >= 4) return best.answer;

  // 4. No confident match — return helpful fallback
  return (
    "I couldn't find a confident match for that question. Here's what I can help with:\n\n" +
    "1. **Approval thresholds** — dollar limits and required approvers\n" +
    "2. **Routing logic** — how requisitions, POs, and contracts are routed\n" +
    "3. **Client specifics** — COD, SWBNO, MCPS, BCPSS, or LCPS workflows\n" +
    "4. **Emergency / Sole Source / ICA / Contract** approval paths\n" +
    "5. **BPM vs FSM** configuration guidance\n" +
    "6. **Delegation, escalation, and budget validation** rules\n" +
    "7. **General definitions** — what is a requisition, PO, cost center, BPM, etc.\n\n" +
    "Try rephrasing your question or ask about a specific client or approval type."
  );
}
