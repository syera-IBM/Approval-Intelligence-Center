/**
 * versionStore.ts
 *
 * Unified versioned snapshots — each version holds BOTH the requirements
 * answers AND (once generated) the process flow for that submission.
 *
 * Clicking a version chip in the UI loads both tabs from the same snapshot.
 */

import type { GeneratedWorkflow } from "./workflowEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UnifiedVersion {
  id: string;
  name: string;
  createdAt: number;          // unix ms
  answers: Record<string, string>;
  workflow?: GeneratedWorkflow; // set once the user generates a process flow
}

// ── Legacy types (kept for back-compat imports still referenced in the file) ──

export interface ReqVersion {
  id: string;
  name: string;
  createdAt: number;
  answers: Record<string, string>;
}

export interface WfVersion {
  id: string;
  name: string;
  createdAt: number;
  workflow: GeneratedWorkflow;
}

// ── Key helpers ───────────────────────────────────────────────────────────────

const UNIFIED_KEY = (slug: string) => `unified_versions_${slug}`;

// Keep legacy keys so old data is not silently lost
const REQ_KEY = (slug: string) => `req_versions_${slug}`;
const WF_KEY  = (slug: string) => `wf_versions_${slug}`;

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ── Unified versions ──────────────────────────────────────────────────────────

export function loadUnifiedVersions(slug: string): UnifiedVersion[] {
  try {
    const raw = localStorage.getItem(UNIFIED_KEY(slug));
    return raw ? (JSON.parse(raw) as UnifiedVersion[]) : [];
  } catch { return []; }
}

export function saveUnifiedVersions(slug: string, versions: UnifiedVersion[]): void {
  localStorage.setItem(UNIFIED_KEY(slug), JSON.stringify(versions));
  window.dispatchEvent(new Event("storage"));
}

/** Append a new version snapshot (requirements answers, no workflow yet). */
export function addUnifiedVersion(
  slug: string,
  answers: Record<string, string>,
  existing: UnifiedVersion[],
): { versions: UnifiedVersion[]; newId: string } {
  const count = existing.length + 1;
  const v: UnifiedVersion = {
    id: makeId(),
    name: `v${count}`,
    createdAt: Date.now(),
    answers,
  };
  const versions = [...existing, v];
  saveUnifiedVersions(slug, versions);
  return { versions, newId: v.id };
}

/** Attach a generated workflow to an existing version. */
export function attachWorkflowToVersion(
  slug: string,
  versionId: string,
  workflow: GeneratedWorkflow,
  existing: UnifiedVersion[],
): UnifiedVersion[] {
  const versions = existing.map((v) =>
    v.id === versionId ? { ...v, workflow } : v
  );
  saveUnifiedVersions(slug, versions);
  return versions;
}

export function renameUnifiedVersion(slug: string, id: string, name: string): UnifiedVersion[] {
  const versions = loadUnifiedVersions(slug).map((v) =>
    v.id === id ? { ...v, name } : v
  );
  saveUnifiedVersions(slug, versions);
  return versions;
}

export function deleteUnifiedVersion(slug: string, id: string): UnifiedVersion[] {
  const versions = loadUnifiedVersions(slug).filter((v) => v.id !== id);
  saveUnifiedVersions(slug, versions);
  return versions;
}

// ── Legacy stubs (kept so old imports don't break) ────────────────────────────

export function loadReqVersions(_slug: string): ReqVersion[] { return []; }
export function saveReqVersions(_slug: string, _v: ReqVersion[]): void {}
export function addReqVersion(
  _slug: string, _answers: Record<string, string>, existing: ReqVersion[],
): { versions: ReqVersion[]; newId: string } {
  return { versions: existing, newId: "" };
}
export function renameReqVersion(_slug: string, _id: string, _name: string): ReqVersion[] { return []; }
export function deleteReqVersion(_slug: string, _id: string): ReqVersion[] { return []; }

export function loadWfVersions(_slug: string): WfVersion[] { return []; }
export function saveWfVersions(_slug: string, _v: WfVersion[]): void {}
export function addWfVersion(
  _slug: string, _wf: GeneratedWorkflow, existing: WfVersion[],
): { versions: WfVersion[]; newId: string } {
  return { versions: existing, newId: "" };
}
export function renameWfVersion(_slug: string, _id: string, _name: string): WfVersion[] { return []; }
export function deleteWfVersion(_slug: string, _id: string): WfVersion[] { return []; }
