// WorkflowBuilder.helpers.ts
// localStorage persistence for workflow results

export interface StoredWorkflow {
  result: {
    riskLevel: "Low" | "Medium" | "High" | "Critical";
    approvers: string[];
    sla: string;
    documents: string[];
    notes: string[];
  };
  savedAt: number;
}

export function saveWorkflowResult(slug: string, result: StoredWorkflow["result"]): void {
  try {
    localStorage.setItem(`workflow_result_${slug}`, JSON.stringify({ result, savedAt: Date.now() }));
  } catch { /* storage quota — silent */ }
}

export function loadWorkflowResult(slug: string): StoredWorkflow | null {
  try {
    const raw = localStorage.getItem(`workflow_result_${slug}`);
    return raw ? JSON.parse(raw) as StoredWorkflow : null;
  } catch { return null; }
}
