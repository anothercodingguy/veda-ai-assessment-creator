import { type AssessmentExtractionPayload } from "@veda/shared";

export async function processAssessmentExtraction(
  qpFile: File,
  asFile: File,
  apiKey?: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<AssessmentExtractionPayload> {
  // Stage 1: Document OCR Ingestion
  onProgress?.("Reading uploaded documents and running OCR text extraction...", 20);
  await new Promise((r) => setTimeout(r, 400));

  // Stage 2: Question Extraction in Printed Order
  onProgress?.("Extracting questions in printed order (preserving sub-parts)...", 45);
  await new Promise((r) => setTimeout(r, 450));

  // Stage 3: Handwritten Answer Transcription
  onProgress?.("Transcribing student handwritten answers across pages...", 70);
  await new Promise((r) => setTimeout(r, 400));

  // Stage 4: Answer Mapping & Out-of-Order Detection
  onProgress?.("Mapping answers to questions (handling out-of-order answers & spans)...", 88);
  await new Promise((r) => setTimeout(r, 400));

  // Stage 5: AI Evaluation with Groq
  onProgress?.("Running AI evaluation & scoring with Groq...", 96);

  const effectiveApiKey =
    apiKey?.trim() ||
    (typeof window !== "undefined" ? localStorage.getItem("veda_groq_api_key") || "" : "");

  const formData = new FormData();
  formData.append("questionPaper", qpFile);
  formData.append("answerSheet", asFile);
  if (effectiveApiKey) {
    formData.append("apiKey", effectiveApiKey);
  }

  const res = await fetch("/api/assessments/extract", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || `Assessment extraction failed with status ${res.status}`);
  }

  onProgress?.("Finalizing bounding box highlights and score calculation...", 100);
  await new Promise((r) => setTimeout(r, 200));

  return data as AssessmentExtractionPayload;
}
