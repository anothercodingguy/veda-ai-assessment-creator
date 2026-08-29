import type { AssignmentInput, AssignmentRecord } from "@veda/shared";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function listAssignments() {
  const response = await fetch(`${API_URL}/api/assignments`, { cache: "no-store" });
  return parseResponse<{ assignments: AssignmentRecord[] }>(response);
}

export async function getAssignment(id: string) {
  const response = await fetch(`${API_URL}/api/assignments/${id}`, { cache: "no-store" });
  return parseResponse<{ assignment: AssignmentRecord }>(response);
}

export type CreateAssignmentFiles = {
  questionPaper?: File | null;
  answerSheet?: File | null;
  material?: File | null;
} | File | null;

export async function createAssignment(input: AssignmentInput, files?: CreateAssignmentFiles) {
  const body = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (key === "questionTypes") body.append(key, JSON.stringify(value));
    else body.append(key, String(value ?? ""));
  }

  if (files instanceof File) {
    body.append("material", files);
    body.append("questionPaper", files);
  } else if (files && typeof files === "object") {
    if (files.questionPaper) body.append("questionPaper", files.questionPaper);
    if (files.answerSheet) body.append("answerSheet", files.answerSheet);
    if (files.material) body.append("material", files.material);
  }

  const response = await fetch(`${API_URL}/api/assignments`, {
    method: "POST",
    body
  });
  return parseResponse<{ assignmentId: string; jobId: string; assignment: AssignmentRecord }>(response);
}

export async function regenerateAssignment(id: string) {
  const response = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, {
    method: "POST"
  });
  return parseResponse<{ assignmentId: string; jobId: string; assignment: AssignmentRecord }>(response);
}

export function pdfUrl(id: string) {
  return `${API_URL}/api/assignments/${id}/pdf`;
}

export async function deleteAssignment(id: string) {
  const response = await fetch(`${API_URL}/api/assignments/${id}`, {
    method: "DELETE"
  });
  return parseResponse<{ ok: boolean; message: string }>(response);
}
