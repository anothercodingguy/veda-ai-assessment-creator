import type { AssignmentInput, AssignmentRecord } from "@veda/shared";
import { generateServerQuestionPaper } from "./server-generation";
import { renderQuestionPaperPdf } from "./server-pdf";

type StoredAssignment = AssignmentRecord & {
  pdf?: Buffer;
};

const globalStore = globalThis as typeof globalThis & {
  __vedaAssignments?: Map<string, StoredAssignment>;
};

const assignments = globalStore.__vedaAssignments ?? new Map<string, StoredAssignment>();
globalStore.__vedaAssignments = assignments;

export function listStoredAssignments() {
  return Array.from(assignments.values())
    .map(stripPdf)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getStoredAssignment(id: string) {
  return assignments.get(id);
}

export function deleteStoredAssignment(id: string) {
  return assignments.delete(id);
}

export async function createStoredAssignment(input: AssignmentInput) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const result = await generateServerQuestionPaper(input);
  const pdf = await renderQuestionPaperPdf(result);
  const assignment: StoredAssignment = {
    id,
    input,
    status: "completed",
    result,
    createdAt: now,
    updatedAt: now,
    pdf
  };
  assignments.set(id, assignment);
  return assignment;
}

export async function regenerateStoredAssignment(id: string) {
  const assignment = assignments.get(id);
  if (!assignment) return undefined;
  const result = await generateServerQuestionPaper(assignment.input);
  const pdf = await renderQuestionPaperPdf(result);
  const updated: StoredAssignment = {
    ...assignment,
    result,
    pdf,
    status: "completed",
    updatedAt: new Date().toISOString()
  };
  assignments.set(id, updated);
  return updated;
}

export function stripPdf(assignment: StoredAssignment): AssignmentRecord {
  const { pdf: _pdf, ...record } = assignment;
  return record;
}
