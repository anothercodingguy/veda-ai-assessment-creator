import { type AssessmentExtractionPayload } from "@veda/shared";

async function optimizeImageForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.size < 1.2 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1800;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

async function extractPdfTextClient(file: File): Promise<string> {
  if (typeof window === "undefined" || !file.name.toLowerCase().endsWith(".pdf")) {
    return "";
  }
  try {
    const pdfjsLib = await import("pdfjs-dist");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str || "").join(" ");
      fullText += `\n--- Page ${i} ---\n${strings}\n`;
    }
    return fullText.trim();
  } catch (err) {
    console.warn("Client PDF extraction fallback:", err);
    return "";
  }
}

export async function processAssessmentExtraction(
  qpFile: File,
  asFile: File,
  apiKey?: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<AssessmentExtractionPayload> {
  // Stage 1: Document OCR Ingestion & Optimization
  onProgress?.("Reading uploaded documents and running OCR text extraction...", 20);
  
  const [optimizedQP, optimizedAS] = await Promise.all([
    optimizeImageForUpload(qpFile),
    optimizeImageForUpload(asFile)
  ]);

  const [qpExtractedText, asExtractedText] = await Promise.all([
    extractPdfTextClient(qpFile),
    extractPdfTextClient(asFile)
  ]);

  // Stage 2: Question Extraction in Printed Order
  onProgress?.("Extracting questions in printed order (preserving sub-parts)...", 45);
  await new Promise((r) => setTimeout(r, 350));

  // Stage 3: Handwritten Answer Transcription
  onProgress?.("Transcribing student handwritten answers across pages...", 70);
  await new Promise((r) => setTimeout(r, 350));

  // Stage 4: Answer Mapping & Out-of-Order Detection
  onProgress?.("Mapping answers to questions (handling out-of-order answers & spans)...", 88);

  const effectiveApiKey =
    apiKey?.trim() ||
    (typeof window !== "undefined" ? localStorage.getItem("veda_groq_api_key") || "" : "");

  const formData = new FormData();
  formData.append("questionPaper", optimizedQP);
  formData.append("answerSheet", optimizedAS);
  if (qpExtractedText) formData.append("qpText", qpExtractedText);
  if (asExtractedText) formData.append("asText", asExtractedText);
  if (effectiveApiKey) {
    formData.append("apiKey", effectiveApiKey);
  }

  // Stage 5: AI Evaluation with Groq
  onProgress?.("Running AI evaluation & scoring with Groq...", 95);

  let res: Response;
  try {
    res = await fetch("/api/assessments/extract", {
      method: "POST",
      body: formData
    });
  } catch (netErr: any) {
    throw new Error(`Network error connecting to assessment API: ${netErr.message}`);
  }

  const rawText = await res.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    if (res.status === 413 || rawText.includes("Request Entity Too Large")) {
      throw new Error("Uploaded files exceed the 4.5MB server upload limit. Please upload compressed images or files under 4MB.");
    }
    throw new Error(`API Error (${res.status}): ${rawText.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Assessment extraction failed with status ${res.status}`);
  }

  onProgress?.("Finalizing bounding box highlights and score calculation...", 100);
  await new Promise((r) => setTimeout(r, 200));

  return data as AssessmentExtractionPayload;
}

