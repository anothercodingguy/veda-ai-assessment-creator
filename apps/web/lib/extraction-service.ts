import { type AssessmentExtractionPayload } from "@veda/shared";

async function optimizeImageForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1100;
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
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.65
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
    const maxPages = Math.min(pdf.numPages, 50);
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

async function extractDocumentVisualPages(
  file: File,
  maxPages = 30
): Promise<{ dataUrl: string; pageNumber: number }[]> {
  if (typeof window === "undefined") return [];

  // If already an image file (PNG / JPG / WEBP)
  if (file.type.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 640;
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
        if (!ctx) return resolve([]);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.45);
        resolve([{ dataUrl, pageNumber: 1 }]);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
      img.src = url;
    });
  }

  // If PDF file
  if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const count = Math.min(pdf.numPages, maxPages);
      const pages: { dataUrl: string; pageNumber: number }[] = [];

      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = document.createElement("canvas");
        const maxDim = 640;
        let scale = 1.0;
        if (viewport.width > maxDim) {
          scale = maxDim / viewport.width;
        }
        const scaledViewport = page.getViewport({ scale });
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.45);
        pages.push({ dataUrl, pageNumber: i });
      }
      return pages;
    } catch (err) {
      console.warn("[extraction-service] PDF visual extraction fallback:", err);
      return [];
    }
  }

  return [];
}

export async function processAssessmentExtraction(
  qpFile: File,
  asFile: File,
  apiKey?: string,
  onProgress?: (stage: string, percent: number) => void
): Promise<AssessmentExtractionPayload> {
  // Stage 1: Document OCR Ingestion & Optimization
  onProgress?.("Reading uploaded documents and rendering all visual pages...", 20);

  const [optimizedQP, optimizedAS] = await Promise.all([
    optimizeImageForUpload(qpFile),
    optimizeImageForUpload(asFile)
  ]);

  const [qpExtractedText, asExtractedText, qpVisualPages, asVisualPages] = await Promise.all([
    extractPdfTextClient(qpFile),
    extractPdfTextClient(asFile),
    extractDocumentVisualPages(qpFile, 15),
    extractDocumentVisualPages(asFile, 30)
  ]);

  // Stage 2: Question Extraction in Printed Order
  onProgress?.(`Extracting questions across ${qpVisualPages.length || 1} QP pages (preserving sub-parts)...`, 45);
  await new Promise((r) => setTimeout(r, 200));

  // Stage 3: Handwritten Answer Transcription across all pages
  onProgress?.(`Transcribing student handwritten answers across all ${asVisualPages.length || 1} pages...`, 70);
  await new Promise((r) => setTimeout(r, 200));

  // Stage 4: Answer Mapping & Out-of-Order Detection
  onProgress?.("Mapping answers to questions across complete answer sheet...", 88);

  const effectiveApiKey =
    apiKey?.trim() ||
    (typeof window !== "undefined" ? localStorage.getItem("veda_gemini_api_key") || "" : "");

  // If text/pages are extracted from large PDF files, avoid sending redundant multi-MB raw PDF binaries
  const finalQP =
    (qpExtractedText || qpVisualPages.length > 0) && optimizedQP.size > 250 * 1024
      ? new File(["PDF_TEXT_EXTRACTED"], qpFile.name, { type: "application/pdf" })
      : optimizedQP;

  const finalAS =
    (asExtractedText || asVisualPages.length > 0) && optimizedAS.size > 250 * 1024
      ? new File(["PDF_TEXT_EXTRACTED"], asFile.name, { type: "application/pdf" })
      : optimizedAS;

  const formData = new FormData();
  formData.append("questionPaper", finalQP);
  formData.append("answerSheet", finalAS);
  if (qpExtractedText) formData.append("qpText", qpExtractedText);
  if (asExtractedText) formData.append("asText", asExtractedText);
  if (qpVisualPages.length > 0) formData.append("qpImages", JSON.stringify(qpVisualPages));
  if (asVisualPages.length > 0) formData.append("asImages", JSON.stringify(asVisualPages));
  formData.append("asPageCount", String(asVisualPages.length || 1));
  formData.append("qpPageCount", String(qpVisualPages.length || 1));
  if (effectiveApiKey) {
    formData.append("apiKey", effectiveApiKey);
  }

  // Stage 5: AI Evaluation with Google Gemini
  onProgress?.("Running AI evaluation & scoring with Google Gemini...", 95);

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

