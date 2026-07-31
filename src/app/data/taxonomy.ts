/**
 * taxonomy.ts
 *
 * Single source of truth for the three-level hierarchy:
 *   Industry → Functional Area → Module → Activities
 *
 * Industries:  K12, City, County, Utilities, Transit, Healthcare
 * Functional Areas: SCM, Finance, HCM
 * SCM Modules: Requisitions, Purchase Orders, Agreements, Suppliers, Contracts
 * Finance Modules: AP Invoices, Journals, Projects
 * HCM Modules: (placeholder)
 */

import {
  GraduationCap, Building2, MapPin, Zap, Bus, Heart,
  ShoppingCart, FileText, FileSignature, Truck, HandshakeIcon,
  ReceiptText, BookOpen, FolderKanban,
  Users, UserCog, Award,
  Package, BarChart3, Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Activity {
  slug: string;
  label: string;
  description: string;
  route: string;         // react-router path to navigate to
  available: boolean;
}

export interface Module {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  activities: Activity[];
}

export interface FunctionalArea {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  modules: Module[];
}

export interface Industry {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
  functionalAreas: FunctionalArea[];
}

// ── SCM Modules ───────────────────────────────────────────────────────────────

const SCM_MODULES: Module[] = [
  {
    slug: "requisitions",
    label: "Requisitions",
    description: "Purchase requisition approval workflows, routing rules, threshold-based escalation, and KDD configuration.",
    icon: ShoppingCart,
    color: "#0f62fe",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure and generate the requisition approval process flow.", route: "/approval/requisition",                  available: true  },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for requisition approval configuration.", route: "/approval/requisition",          available: true  },
      { slug: "process-flows",  label: "Process Flows",              description: "Industry approval process flow reference documents.",            route: "/process",                             available: true  },
      { slug: "decks",          label: "Reference Decks",            description: "Requisition-specific resource decks and webinar recordings.",    route: "/decks",                               available: true  },
    ],
  },
  {
    slug: "purchase-orders",
    label: "Purchase Orders",
    description: "PO approval workflows, change order routing, and supplier acknowledgment requirements.",
    icon: Package,
    color: "#009d9a",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure and generate the PO approval process flow.",           route: "/approval/purchase-order",             available: true  },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for PO approval configuration.",     route: "/approval/purchase-order",             available: true  },
      { slug: "process-flows",  label: "Process Flows",              description: "PO-specific approval process flows.",                            route: "/process",                             available: true  },
    ],
  },
  {
    slug: "agreements",
    label: "Agreements",
    description: "Interagency and intercompany agreement approvals with MOU requirements and state procurement routing.",
    icon: HandshakeIcon,
    color: "#24a148",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure and generate the agreement approval process flow.",    route: "/approval/ica",                        available: true  },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for agreement approvals.",           route: "/approval/ica",                        available: true  },
    ],
  },
  {
    slug: "suppliers",
    label: "Suppliers",
    description: "Supplier qualification, onboarding approval routing, and supplier management workflows.",
    icon: Truck,
    color: "#8a3ffc",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure supplier onboarding and qualification approvals.",     route: "/approval/ica",                        available: false },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for supplier approvals.",            route: "/approval/ica",                        available: false },
    ],
  },
  {
    slug: "contracts",
    label: "Contracts",
    description: "Contract approval thresholds, legal review gates, and executive sign-off requirements by value tier.",
    icon: FileSignature,
    color: "#ba4e00",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure and generate the contract approval process flow.",     route: "/approval/contract",                   available: true  },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for contract approval configuration.", route: "/approval/contract",                 available: true  },
      { slug: "process-flows",  label: "Process Flows",              description: "Contract-specific approval process flows and reference decks.",  route: "/process",                             available: true  },
    ],
  },
];

// ── Finance Modules ───────────────────────────────────────────────────────────

const FINANCE_MODULES: Module[] = [
  {
    slug: "ap-invoices",
    label: "AP Invoices",
    description: "Accounts payable invoice approval workflows, 3-way match validation, and exception routing.",
    icon: ReceiptText,
    color: "#da1e28",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure and generate AP invoice approval process flows.",     route: "/approval/sole-source",                 available: true  },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for AP invoice approval routing.",  route: "/approval/sole-source",                 available: true  },
      { slug: "process-flows",  label: "Process Flows",              description: "AP invoice-specific approval process flows.",                   route: "/process",                              available: false },
    ],
  },
  {
    slug: "journals",
    label: "Journals",
    description: "Journal entry approval workflows, budget authority validation, and period-close approval routing.",
    icon: BookOpen,
    color: "#ff832b",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure journal entry approval chains and routing rules.",    route: "/approval/emergency",                   available: true  },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for journal approval configuration.", route: "/approval/emergency",                 available: true  },
      { slug: "process-flows",  label: "Process Flows",              description: "Journal entry approval process flows.",                          route: "/process",                             available: false },
    ],
  },
  {
    slug: "projects",
    label: "Projects",
    description: "Project budget approval workflows, capital project authorization, and grant-funded project approval gates.",
    icon: FolderKanban,
    color: "#6929c4",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure project budget and capital approval workflows.",       route: "/approval/contract",                   available: false },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for project approval configuration.", route: "/approval/contract",                 available: false },
      { slug: "process-flows",  label: "Process Flows",              description: "Project-specific approval process flows.",                       route: "/process",                             available: false },
    ],
  },
];

// ── HCM Modules ───────────────────────────────────────────────────────────────

const HCM_MODULES: Module[] = [
  {
    slug: "hiring",
    label: "Hiring & Onboarding",
    description: "Position approval, offer letter approval routing, and new hire onboarding authorization.",
    icon: Users,
    color: "#0043ce",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure hiring and onboarding approval workflows.",           route: "/",                                    available: false },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for hiring approval routing.",      route: "/",                                    available: false },
    ],
  },
  {
    slug: "compensation",
    label: "Compensation",
    description: "Compensation change approvals, merit increase routing, and equity adjustment authorization chains.",
    icon: Award,
    color: "#007d79",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure compensation change approval workflows.",             route: "/",                                    available: false },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for compensation approvals.",       route: "/",                                    available: false },
    ],
  },
  {
    slug: "workforce",
    label: "Workforce Management",
    description: "Absence approval, timecard approval, and workforce scheduling authorization routing.",
    icon: UserCog,
    color: "#1192e8",
    activities: [
      { slug: "approvals",      label: "Approval Workflow",          description: "Configure workforce management approval workflows.",            route: "/",                                    available: false },
      { slug: "discovery",      label: "KDD Requirements",           description: "Answer key design decisions for workforce approval routing.",   route: "/",                                    available: false },
    ],
  },
];

// ── Functional Areas (shared across all industries) ───────────────────────────

function buildFAs(): FunctionalArea[] {
  return [
    {
      slug: "scm",
      label: "Supply Chain Management",
      description: "End-to-end procurement and supply chain approval configuration — requisitions, POs, contracts, agreements, and supplier management.",
      icon: Package,
      color: "#0f62fe",
      modules: SCM_MODULES,
    },
    {
      slug: "finance",
      label: "Finance",
      description: "Financial approval workflows across accounts payable, journal entries, and project budget authorization.",
      icon: Landmark,
      color: "#da1e28",
      modules: FINANCE_MODULES,
    },
    {
      slug: "hcm",
      label: "Human Capital Management",
      description: "HR process approval workflows for hiring, compensation changes, and workforce management.",
      icon: Users,
      color: "#24a148",
      modules: HCM_MODULES,
    },
  ];
}

// ── Industries ────────────────────────────────────────────────────────────────

export const INDUSTRIES: Industry[] = [
  {
    slug: "k12",
    label: "K-12 Education",
    description: "School districts, charter networks, and education agencies — ESSER/SPLOST funding compliance, procurement thresholds, and multi-level board approval chains.",
    icon: GraduationCap,
    color: "#0f62fe",
    colorLight: "#d0e2ff",
    functionalAreas: buildFAs(),
  },
  {
    slug: "city",
    label: "City Government",
    description: "Municipal procurement, city council authorization, and departmental approval chains for general fund and grant-funded expenditures.",
    icon: Building2,
    color: "#009d9a",
    colorLight: "#9ef0f0",
    functionalAreas: buildFAs(),
  },
  {
    slug: "county",
    label: "County Government",
    description: "County procurement and financial approvals including board of commissioners authorization, auditor review gates, and state compliance routing.",
    icon: MapPin,
    color: "#8a3ffc",
    colorLight: "#e8daff",
    functionalAreas: buildFAs(),
  },
  {
    slug: "utilities",
    label: "Utilities",
    description: "Public utility procurement approvals — capital project authorization, rate-case compliance, and regulatory review gates for infrastructure spend.",
    icon: Zap,
    color: "#f1c21b",
    colorLight: "#fdefbf",
    functionalAreas: buildFAs(),
  },
  {
    slug: "transit",
    label: "Transit",
    description: "Transit authority procurement and financial approvals — FTA compliance, capital grant project authorization, and fleet/infrastructure approval chains.",
    icon: Bus,
    color: "#ba4e00",
    colorLight: "#ffd9be",
    functionalAreas: buildFAs(),
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    description: "Public and non-profit healthcare procurement approvals — clinical supply chains, regulatory compliance, capital equipment authorization, and grant approval routing.",
    icon: Heart,
    color: "#da1e28",
    colorLight: "#ffd7d9",
    functionalAreas: buildFAs(),
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}

export function getFunctionalArea(industry: Industry, faSlug: string): FunctionalArea | undefined {
  return industry.functionalAreas.find((fa) => fa.slug === faSlug);
}

export function getModule(fa: FunctionalArea, moduleSlug: string): Module | undefined {
  return fa.modules.find((m) => m.slug === moduleSlug);
}

// FA display name shorthands used in breadcrumbs
export const FA_SHORT: Record<string, string> = {
  scm:     "SCM",
  finance: "Finance",
  hcm:     "HCM",
};
