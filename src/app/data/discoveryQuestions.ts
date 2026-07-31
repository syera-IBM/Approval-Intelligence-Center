export interface DiscoveryQuestion {
  id: string;
  section: string;
  sectionIndex: number;
  question: string;
  hint?: string;
  inputType: "text" | "yesno" | "select" | "textarea" | "roster";
  options?: string[];
  types: string[];
  /** If true this is the section gating question — a "No" answer hides the rest of the section */
  isGate?: boolean;
  /** For roster inputType — defines the columns in the roster table */
  rosterColumns?: string[];
  /** Key used to persist roster rows in localStorage */
  rosterKey?: string;
}

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  // ── 1. Gatekeeper Approval ──────────────────────────────────────────────────
  { id: "GATE-GK", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Is a Gatekeeper approver required for this approval type?",
    hint: "The Gatekeeper is the first reviewer/approver of the requisition. When a purchase requisition is submitted with relevant information (Goods/Services, Description, Unit of Measure, Qty/Value, Category, Deliver-to Address, Requestor, Department, Funding Account, Project information, etc.), the Gatekeeper validates that the information is complete and accurate before it advances to the approval chain — saving all subsequent approvers' review time. The leading practice is one Gatekeeper per Department/Division. Select Yes to configure Gatekeeper, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition"], isGate: true },
  { id: "GK-001", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Is a Gatekeeper approval required for all requisitions or only specific types?",
    hint: "If Specific, describe which types below (e.g., General Fund, SPLOST, by Category, Other).",
    inputType: "select", options: ["All", "Specific"], types: ["requisition"] },
  { id: "GK-002", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "If specific types — describe the requisition types that require Gatekeeper approval.",
    hint: "e.g., General Fund, SPLOST, specific categories, other.",
    inputType: "textarea", types: ["requisition"] },
  { id: "GK-003", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Are there requisition categories that bypass Gatekeeper review?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GK-004", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "If yes — which specific categories bypass Gatekeeper review?",
    hint: "e.g., General Fund, SPLOST, category-based, other.",
    inputType: "textarea", types: ["requisition"] },
  { id: "GK-005", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Should Gatekeeper approval occur before all other approvals?",
    inputType: "select", options: ["Yes", "No", "Not Applicable"], types: ["requisition"] },
  { id: "GK-006", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "How is the Gatekeeper identified? Select all that apply and provide details.",
    hint: "By Business Unit, Department, Cost Center, Category, Requesting Organization.",
    inputType: "textarea", types: ["requisition"] },
  { id: "GK-007", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Can multiple Gatekeepers exist for the same organization?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GK-008", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Is a backup/delegate Gatekeeper required?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GK-009", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Provide the list of Gatekeepers (by Business Unit, Department, Cost Center, Category, or Requesting Organization).",
    inputType: "textarea", types: ["requisition"] },
  { id: "GK-009b", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Upload your Gatekeeper roster — one row per Gatekeeper. Download the template, fill it in, then re-upload.",
    hint: "Columns: Department, Division, Gatekeeper (Full Name), Backup Gatekeeper (Full Name). This roster will appear as a dedicated sheet in the final process-flow Excel export.",
    inputType: "roster",
    rosterColumns: ["Department", "Division", "Gatekeeper", "Backup Gatekeeper"],
    rosterKey: "gatekeeper_roster",
    types: ["requisition"] },
  { id: "GK-010", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "What information must the Gatekeeper validate?",
    hint: "e.g., Charge Account, Supplier, Contract, Price, Quantity, Budget Availability, Buyer Assignment.",
    inputType: "textarea", types: ["requisition"] },
  { id: "GK-011", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Can the Gatekeeper edit requisitions, or only approve/reject?",
    inputType: "select", options: ["Edit only", "Approve/Reject only", "Both"], types: ["requisition"] },
  { id: "GK-012", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Should Gatekeepers be able to return requisitions for correction?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GK-013", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Should catalog purchases bypass Gatekeeper review?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GK-014", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Should contract-backed purchases bypass Gatekeeper review?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GK-015", section: "1. Gatekeeper Approval", sectionIndex: 0,
    question: "Are emergency purchases exempt from Gatekeeper review?",
    inputType: "yesno", types: ["requisition", "emergency"] },

  // ── 2. Cost Center Manager Approval ─────────────────────────────────────────
  { id: "GATE-CCM", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Is a Cost Center Manager approver required for this approval type?",
    hint: "The Cost Center Manager is the budget owner responsible for the cost center being charged on the requisition. They review the charge against departmental budgets and confirm the spend is authorized within their cost center. Would you like to route the requisition to the Cost Center Manager for approval? Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order"], isGate: true },
  { id: "CCM-roster", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Upload your Cost Center Manager roster — one row per cost center. Download the template, fill it in, then re-upload.",
    hint: "Columns: Department, Division, Cost Center, CC Manager (Full Name), Backup Manager (Full Name). This roster will appear as a dedicated sheet in the final process-flow Excel export.",
    inputType: "roster",
    rosterColumns: ["Department", "Division", "Cost Center", "CC Manager", "Backup Mgr"],
    rosterKey: "cc_manager_roster",
    types: ["requisition", "purchase-order"] },
  { id: "CCM-001", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "How is the Cost Center Manager identified?",
    hint: "HR hierarchy, Financial system owner, Manual assignment.",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "CCM-002", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Can a cost center have multiple approvers?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CCM-003", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Is approval required for every cost center charge?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CCM-004", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Are there additional approval requirements based on Cost Center or Department (e.g., IT purchases require extra approvers)?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "CCM-005", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Which accounting segment represents the Cost Center in Oracle Fusion?",
    inputType: "text", types: ["requisition", "purchase-order"] },
  { id: "CCM-006", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "If a requisition is split across multiple Cost Centers, should all Cost Center Managers approve?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CCM-007", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Should split Cost Center approvals occur in parallel or sequentially?",
    inputType: "select", options: ["Parallel", "Sequential", "Not Applicable"], types: ["requisition", "purchase-order"] },
  { id: "CCM-008", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Are there dollar thresholds for Cost Center Manager approval?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "CCM-009", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Should Cost Center Managers review all line items or only those charged to their Cost Center?",
    inputType: "select", options: ["All line items", "Only their Cost Center lines", "Not Applicable"], types: ["requisition"] },
  { id: "CCM-010", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Can a Cost Center Manager reassign funds or charge accounts?",
    inputType: "yesno", types: ["requisition"] },
  { id: "CCM-011", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Are grants or projects exempt from Cost Center Manager approval?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CCM-012", section: "2. Cost Center Manager Approval", sectionIndex: 1,
    question: "Should contract purchases bypass Cost Center Manager approval?",
    inputType: "yesno", types: ["requisition", "purchase-order", "contract"] },

  // ── 3. Supervisor Approval ────────────────────────────────────────────────
  { id: "GATE-SUP", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Is a Supervisor approver required for this approval type?",
    hint: "The Supervisor (or Department Head) is the requester's direct manager in the HR hierarchy. They provide the first human approval touchpoint, confirming the business need, vendor selection, and budget impact. Routing is typically driven by the Oracle HCM Supervisor Hierarchy. Would you like to route the requisition to the HR Supervisor based on a dollar limit or for all requisitions? Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order"], isGate: true },
  { id: "SUP-001", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Will Supervisor approvals be derived from Oracle HCM Supervisor Hierarchy?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "SUP-002", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "What should happen when the requestor has no manager assigned?",
    inputType: "textarea", types: ["requisition"] },
  { id: "SUP-003", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Should acting or interim managers be recognized for approval routing?",
    inputType: "yesno", types: ["requisition"] },
  { id: "SUP-004", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Is Supervisor approval required for every requisition?",
    inputType: "yesno", types: ["requisition"] },
  { id: "SUP-005", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Are there requisition types that bypass Supervisor approval?",
    inputType: "textarea", types: ["requisition"] },
  { id: "SUP-006", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Should supervisors approve based on total requisition amount or per-line amount?",
    inputType: "select", options: ["Total amount", "Per-line amount", "Both"], types: ["requisition"] },
  { id: "SUP-007", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "If a supervisor is unavailable, who approves?",
    inputType: "textarea", types: ["requisition"] },
  { id: "SUP-008", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Are delegation rules required for supervisors?",
    inputType: "yesno", types: ["requisition"] },
  { id: "SUP-009", section: "3. Supervisor Approval", sectionIndex: 2,
    question: "Should escalation occur after a defined number of days? If yes, how many?",
    inputType: "text", types: ["requisition"] },

  // ── 4. Project Manager Approval ────────────────────────────────────────────
  { id: "GATE-PM", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Is a Project Manager approver required for this approval type?",
    hint: "The Project Manager approves requisitions that are charged to a project or grant account in Oracle Projects. They verify that the purchase aligns with project scope, milestone timelines, and the approved project budget. This step is required when project expenditure types are used on the requisition. Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order"], isGate: true },
  { id: "PM-001", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Which projects require Project Manager approval?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "PM-002", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "How is the Project Manager identified?",
    hint: "Oracle Projects ownership, Custom mapping, other.",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "PM-003", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Is approval required for all project-related spend, or only above a threshold?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "PM-004", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "If multiple projects are charged on the same requisition, should each Project Manager approve?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "PM-005", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Should multi-project approvals be sequential or parallel?",
    inputType: "select", options: ["Sequential", "Parallel", "Not Applicable"], types: ["requisition"] },
  { id: "PM-006", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Must Project Managers verify remaining project budget before approving?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "PM-007", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Should Project Manager approval be triggered only when a project expenditure type is used?",
    inputType: "yesno", types: ["requisition"] },
  { id: "PM-008", section: "4. Project Manager Approval", sectionIndex: 3,
    question: "Are capital projects treated differently than operating projects for approval routing?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },

  // ── 5. Grant Approval ──────────────────────────────────────────────────────
  { id: "GATE-GR", section: "5. Grant Approval", sectionIndex: 4,
    question: "Is a Grant approver required for this approval type?",
    hint: "The Grant Approver (typically the Grant Principal Investigator or Grant Compliance Officer) reviews grant-funded purchases for federal/state compliance. They validate funding availability, allowable expense categories, grant period validity, and sponsor restrictions per 2 CFR 200 Uniform Guidance. Required when any requisition line is charged to a grant or federally funded account. Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order", "contract"], isGate: true },
  { id: "GR-001", section: "5. Grant Approval", sectionIndex: 4,
    question: "What grants require approval? Provide a list or describe the criteria.",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract"] },
  { id: "GR-002", section: "5. Grant Approval", sectionIndex: 4,
    question: "How is the Grant Approver identified?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "GR-003", section: "5. Grant Approval", sectionIndex: 4,
    question: "Is the Grant Principal Investigator (PI) the approver?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "GR-004", section: "5. Grant Approval", sectionIndex: 4,
    question: "What validations should occur for grant-funded purchases?",
    hint: "e.g., Funding availability, Allowable expenses, Grant period validity, Sponsor restrictions.",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract"] },
  { id: "GR-005", section: "5. Grant Approval", sectionIndex: 4,
    question: "Should grant-funded purchases require additional documentation?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "GR-006", section: "5. Grant Approval", sectionIndex: 4,
    question: "If a requisition contains multiple grants, should all grant owners approve?",
    inputType: "yesno", types: ["requisition"] },
  { id: "GR-007", section: "5. Grant Approval", sectionIndex: 4,
    question: "What happens if grants and projects are both charged on the same requisition?",
    inputType: "textarea", types: ["requisition"] },
  { id: "GR-008", section: "5. Grant Approval", sectionIndex: 4,
    question: "Are there dollar thresholds for Grant approval?",
    inputType: "text", types: ["requisition", "purchase-order"] },
  { id: "GR-009", section: "5. Grant Approval", sectionIndex: 4,
    question: "Are specific categories exempt from Grant approval?",
    inputType: "textarea", types: ["requisition"] },

  // ── 6. Category Approval ───────────────────────────────────────────────────
  { id: "GATE-CAT", section: "6. Category Approval", sectionIndex: 5,
    question: "Is a Category Manager approver required for this approval type?",
    hint: "The Category Manager is a procurement professional responsible for a specific spend category (e.g., IT Hardware, Software, Professional Services, Facilities, Telecommunications). They review vendor selection, pricing competitiveness, contract utilization, and sourcing strategy compliance. Typically required for managed spend categories above a defined threshold. Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order"], isGate: true },
  { id: "CAT-001", section: "6. Category Approval", sectionIndex: 5,
    question: "Which procurement categories require Category Manager approval?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "CAT-002", section: "6. Category Approval", sectionIndex: 5,
    question: "How is the Category Manager identified?",
    hint: "Category hierarchy, Commodity codes, UNSPSC codes.",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "CAT-003", section: "6. Category Approval", sectionIndex: 5,
    question: "Should Category approval only be required above specific spend thresholds?",
    inputType: "textarea", types: ["requisition"] },
  { id: "CAT-004", section: "6. Category Approval", sectionIndex: 5,
    question: "Are preferred supplier validations required at Category approval?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CAT-005", section: "6. Category Approval", sectionIndex: 5,
    question: "Should Category Managers verify contract utilization?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CAT-006", section: "6. Category Approval", sectionIndex: 5,
    question: "Which categories need mandatory review?",
    hint: "e.g., IT Hardware, Software, Professional Services, Facilities, Marketing, Telecommunications.",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "CAT-007", section: "6. Category Approval", sectionIndex: 5,
    question: "Are there categories exempt from Category approval?",
    inputType: "textarea", types: ["requisition"] },
  { id: "CAT-008", section: "6. Category Approval", sectionIndex: 5,
    question: "Should existing contract purchases bypass Category approval?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CAT-009", section: "6. Category Approval", sectionIndex: 5,
    question: "Should punchout/catalog purchases bypass Category approval?",
    inputType: "yesno", types: ["requisition"] },

  // ── 7. Procurement Type Approval ───────────────────────────────────────────
  { id: "GATE-PT", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "Is a Procurement Type approver required for this approval type?",
    hint: "Procurement Type approval applies type-specific routing rules based on what is being purchased — for example: Software purchases route to IT review, Construction routes to Facilities, Professional Services routes to HR or executive sign-off, and Consulting routes to Legal. Each procurement type may have its own approver and dollar threshold. Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order", "contract"], isGate: true },
  { id: "PT-001", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "What procurement types exist in your organization?",
    hint: "e.g., Goods, Services, Professional Services, Capital Equipment, Software, Construction, Consulting.",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract"] },
  { id: "PT-002", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "How is Procurement Type identified in Oracle Fusion?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "PT-003", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "Does each procurement type require a different approver?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "PT-004", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "Should approvals vary by dollar amount per procurement type?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "PT-005", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "Are additional approvals required for specific types (e.g., Software → IT review, Contracts → Legal, Construction → Facilities, Consulting → HR/Executive)?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract"] },
  { id: "PT-006", section: "7. Procurement Type Approval", sectionIndex: 6,
    question: "Are there procurement types that bypass standard approval?",
    inputType: "textarea", types: ["requisition"] },

  // ── 8. Buyer Approval ──────────────────────────────────────────────────────
  { id: "GATE-BUY", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Is a Buyer approver required for this approval type?",
    hint: "The Buyer is the procurement professional assigned to process the requisition into a Purchase Order. They verify the supplier, applicable contracts, pricing, competitive bidding compliance, and sourcing event requirements before PO creation. Buyers are typically assigned by category, business unit, or supplier. Select Yes to configure, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order"], isGate: true },
  { id: "BUY-001", section: "8. Buyer Approval", sectionIndex: 7,
    question: "How are Buyers assigned?",
    hint: "Category-based, Business Unit-based, Supplier-based.",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "BUY-002", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Provide the list of Buyer approvers with their assignment context (Category, BU, Supplier).",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "BUY-003", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Is Buyer approval required before PO creation?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "BUY-004", section: "8. Buyer Approval", sectionIndex: 7,
    question: "What must Buyers validate?",
    hint: "e.g., Supplier, Contract, Pricing, Competitive bidding, Sourcing event compliance.",
    inputType: "textarea", types: ["purchase-order"] },
  { id: "BUY-005", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Can Buyers modify requisitions?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "BUY-006", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Can Buyers reject requisitions?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "BUY-007", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Should emergency purchases bypass Buyer review?",
    inputType: "yesno", types: ["requisition", "emergency"] },
  { id: "BUY-008", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Are public bidding thresholds applicable (SLED-specific)?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "BUY-009", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Are minority/diversity supplier requirements applicable?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "BUY-010", section: "8. Buyer Approval", sectionIndex: 7,
    question: "Are cooperative purchasing contracts used?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },

  // ── 9. Dollar-Based Approval (DOA) ─────────────────────────────────────────
  { id: "GATE-DOA", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Is Dollar-Based (Delegation of Authority) approval required for this approval type?",
    hint: "Delegation of Authority (DOA) routes the requisition to progressively higher authority levels based on the transaction dollar amount. For example: $0–$10K → Supervisor; $10K–$50K → Dept. Head; $50K–$250K → Finance Controller; $250K+ → CPO; $500K+ → CFO + Legal; $1M+ → Board. DOA thresholds may vary by Business Unit and can be sequential or parallel. Select Yes to configure your DOA matrix, or No to go to the next approval stage.",
    inputType: "yesno", types: ["requisition", "purchase-order", "contract", "sole-source", "emergency"], isGate: true },
  { id: "DOA-001", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "What are the approved Delegation of Authority (DOA) thresholds?",
    hint: "Provide the full DOA matrix (amount range → approver).",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "sole-source", "emergency"] },
  { id: "DOA-002", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Are thresholds based on total requisition amount, line amount, or annual aggregated spend?",
    inputType: "select", options: ["Total requisition amount", "Line amount", "Annual aggregated spend", "Combination"], types: ["requisition", "purchase-order"] },
  { id: "DOA-003", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Are thresholds different by Business Unit?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "DOA-004", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Is approval required from all prior levels or only the highest applicable level?",
    inputType: "select", options: ["All prior levels", "Highest applicable level only"], types: ["requisition", "purchase-order"] },
  { id: "DOA-005", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Should dollar-based approvals be sequential or parallel?",
    inputType: "select", options: ["Sequential", "Parallel"], types: ["requisition", "purchase-order"] },
  { id: "DOA-006", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Is approval based on requestor hierarchy, preparer hierarchy, cost center hierarchy, or financial approval hierarchy?",
    inputType: "select", options: ["Requestor hierarchy", "Preparer hierarchy", "Cost center hierarchy", "Financial approval hierarchy", "Combination"], types: ["requisition"] },
  { id: "DOA-007", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Are Board approvals needed above specific thresholds?",
    inputType: "text", types: ["requisition", "contract", "sole-source"] },
  { id: "DOA-008", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Are public procurement thresholds mandated by state regulations?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "DOA-009", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Are competitive bidding thresholds different from approval thresholds?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "DOA-010", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Do federal grant-funded purchases require additional approvals above certain thresholds?",
    inputType: "textarea", types: ["requisition", "purchase-order"] },
  { id: "DOA-011", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Do contract purchases follow the same DOA thresholds?",
    inputType: "yesno", types: ["contract", "requisition"] },
  { id: "DOA-012", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Do emergency purchases follow separate DOA thresholds?",
    inputType: "yesno", types: ["emergency", "requisition"] },
  { id: "DOA-013", section: "9. Dollar-Based Approval (Delegation of Authority)", sectionIndex: 8,
    question: "Should change orders have separate approval limits?",
    inputType: "textarea", types: ["purchase-order", "contract"] },

  // ── 10. Others ─────────────────────────────────────────────────────────────
  { id: "GATE-OTH", section: "10. Others", sectionIndex: 9,
    question: "Do you have any unique approvals specific to your agency, that are not covered by the above requirements?",
    hint: "For example: elected official sign-off, Legal Counsel review, CFO approval, IT security review, board ratification, or any other custom approval step. Select Yes to add approvers, or No to finish.",
    inputType: "yesno", types: ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"], isGate: true },

  // ── Cross-Cutting Questions ─────────────────────────────────────────────────
  { id: "CC-001", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "What is the desired overall approval sequence? List the blocks in order.",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"] },
  { id: "CC-002", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Which approval blocks should run in parallel?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica"] },
  { id: "CC-003", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Which approvals should be mandatory vs. optional?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"] },
  { id: "CC-004", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Should approvers be able to edit requisitions?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CC-005", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Should FYI (informational) notifications be sent? If so, to whom?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica"] },
  { id: "CC-006", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "What delegation rules are required across all approval types?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"] },
  { id: "CC-007", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "What vacation/out-of-office coverage is required?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica"] },
  { id: "CC-008", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "What escalation rules should be configured?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica", "emergency"] },
  { id: "CC-009", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Should approvals be re-triggered when a requisition is changed?",
    inputType: "yesno", types: ["requisition", "purchase-order"] },
  { id: "CC-010", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Which modifications should trigger reapproval?",
    hint: "e.g., Amount increase, Supplier change, Account change, Contract change, Project/Grant change.",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract"] },
  { id: "CC-011", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "What audit reporting is required?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"] },
  { id: "CC-012", section: "Cross-Cutting (All Approval Types)", sectionIndex: 10,
    question: "Are there regulatory compliance requirements (State, Local Government, Higher Education, Federal Grant) that impact approvals?",
    inputType: "textarea", types: ["requisition", "purchase-order", "contract", "ica", "sole-source", "emergency"] },
];

export function getQuestionsForType(slug: string): DiscoveryQuestion[] {
  return DISCOVERY_QUESTIONS.filter((q) => q.types.includes(slug));
}

export function getSectionsForType(slug: string): { name: string; index: number; questions: DiscoveryQuestion[] }[] {
  const qs = getQuestionsForType(slug);
  const map = new Map<number, { name: string; index: number; questions: DiscoveryQuestion[] }>();
  for (const q of qs) {
    if (!map.has(q.sectionIndex)) map.set(q.sectionIndex, { name: q.section, index: q.sectionIndex, questions: [] });
    map.get(q.sectionIndex)!.questions.push(q);
  }
  return [...map.values()].sort((a, b) => a.index - b.index);
}

/** Returns the gate question id for a given sectionIndex, if one exists */
export function getGateIdForSection(sectionIndex: number): string | undefined {
  return DISCOVERY_QUESTIONS.find((q) => q.isGate && q.sectionIndex === sectionIndex)?.id;
}

/**
 * Returns the list of questions that are actually visible given the current
 * saved answers for a slug.  Questions whose section is gated off (gate answer
 * is "No") are excluded from both the total and the filled count so they don't
 * distort progress rings.
 *
 * A question is considered "answered" only when its stored value is non-empty
 * AND is not a placeholder empty string.  Yes/No and Select questions are NOT
 * pre-answered — they have no stored value until the user explicitly clicks.
 */
export function getVisibleQuestions(
  slug: string,
  answers: Record<string, string>,
): DiscoveryQuestion[] {
  const all = getQuestionsForType(slug);

  // Build section groups
  type Sec = { gate: DiscoveryQuestion | null; body: DiscoveryQuestion[] };
  const map = new Map<number, Sec>();
  for (const q of all) {
    if (!map.has(q.sectionIndex)) map.set(q.sectionIndex, { gate: null, body: [] });
    const sec = map.get(q.sectionIndex)!;
    if (q.isGate) { sec.gate = q; } else { sec.body.push(q); }
  }

  const visible: DiscoveryQuestion[] = [];
  for (const sec of map.values()) {
    if (sec.gate) visible.push(sec.gate);
    const gateAns = sec.gate ? (answers[sec.gate.id] ?? "").trim() : "";
    const active = !sec.gate || gateAns !== "No";
    if (active) visible.push(...sec.body);
  }
  return visible;
}

/**
 * Loads saved answers from localStorage for a slug and returns the visible
 * question list plus a filled count — used by progress rings.
 */
export function loadProgressForSlug(slug: string): { total: number; filled: number } {
  let ans: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(`discovery_answers_${slug}`);
    ans = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch { /* ignore */ }
  const visible = getVisibleQuestions(slug, ans).filter((q) => q.inputType !== "roster");
  const filled = visible.filter((q) => (ans[q.id] ?? "").trim() !== "").length;
  return { total: visible.length, filled };
}
