import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  assessmentExtractionPayloadSchema,
  type AssessmentExtractionPayload,
  type ExtractedQuestionItem
} from "@veda/shared";

export const runtime = "nodejs";

// Safe helper to extract text from PDF buffer
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    // @ts-ignore
    const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data: uint8, useSystemFonts: true });
    const doc = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str || "").join(" ");
      fullText += `\n--- Page ${i} ---\n${strings}\n`;
    }
    return fullText.trim();
  } catch (err) {
    console.warn("[extract-api] PDF text extraction warning:", err);
    // Fallback: extract ASCII string tokens from buffer
    try {
      const raw = buffer.toString("utf-8");
      const clean = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ");
      const words = clean.split(/\s+/).filter((w) => w.length > 2 && w.length < 30);
      return words.slice(0, 1500).join(" ");
    } catch {
      return "";
    }
  }
}

function clamp(val: number, min: number, max: number): number {
  if (isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

// Robust normalization to guarantee valid payload
function normalizePayload(
  raw: any,
  qpName: string,
  asName: string
): AssessmentExtractionPayload {
  const paperTitle =
    typeof raw?.paperTitle === "string" && raw.paperTitle.trim()
      ? raw.paperTitle.trim()
      : qpName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

  const subject =
    typeof raw?.subject === "string" && raw.subject.trim()
      ? raw.subject.trim()
      : "General Assessment";

  const classLevel =
    typeof raw?.classLevel === "string" && raw.classLevel.trim()
      ? raw.classLevel.trim()
      : "Class X / Senior Secondary";

  const rawQuestions = Array.isArray(raw?.questions) ? raw.questions : [];

  const questions: ExtractedQuestionItem[] = rawQuestions.map((q: any, idx: number) => {
    const id = typeof q?.id === "string" && q.id ? q.id : `q_${idx + 1}`;
    const number = String(q?.number || idx + 1);
    const sectionTitle =
      typeof q?.sectionTitle === "string" && q.sectionTitle
        ? q.sectionTitle
        : "Section A";
    const text =
      typeof q?.text === "string" && q.text
        ? q.text
        : `Question ${number}`;
    const maxMarks = Math.max(1, Number(q?.maxMarks) || 2);
    const awardedMarks = Math.max(0, Math.min(maxMarks, Number(q?.awardedMarks ?? maxMarks)));

    let status: "answered" | "partial" | "unanswered" = "answered";
    if (q?.status === "unanswered" || awardedMarks === 0) {
      status = "unanswered";
    } else if (q?.status === "partial" || awardedMarks < maxMarks) {
      status = "partial";
    }

    const transcribedAnswer =
      typeof q?.transcribedAnswer === "string"
        ? q.transcribedAnswer
        : status === "unanswered"
          ? "[Unattempted by student]"
          : "Student response recorded.";

    const aiFeedback =
      typeof q?.aiFeedback === "string" && q.aiFeedback
        ? q.aiFeedback
        : awardedMarks === maxMarks
          ? "Accurate answer matching rubric criteria."
          : `Awarded ${awardedMarks}/${maxMarks} marks based on evaluation criteria.`;

    const rawRegions = Array.isArray(q?.regions) ? q.regions : [];
    const regions = rawRegions.length > 0
      ? rawRegions.map((r: any, rIdx: number) => ({
          pageNumber: Math.max(1, Number(r?.pageNumber) || 1),
          boundingBox: {
            top: clamp(Number(r?.boundingBox?.top ?? (10 + (idx % 4) * 20)), 0, 95),
            left: clamp(Number(r?.boundingBox?.left ?? 5), 0, 95),
            width: clamp(Number(r?.boundingBox?.width ?? 90), 5, 100),
            height: clamp(Number(r?.boundingBox?.height ?? 16), 5, 100)
          },
          label: typeof r?.label === "string" ? r.label : `Q${number}`
        }))
      : [
          {
            pageNumber: 1,
            boundingBox: {
              top: clamp(10 + (idx % 4) * 20, 0, 80),
              left: 5,
              width: 90,
              height: 16
            },
            label: `Q${number}`
          }
        ];

    return {
      id,
      number,
      sectionTitle,
      text,
      maxMarks,
      awardedMarks,
      status,
      transcribedAnswer,
      aiFeedback,
      regions,
      confidence: 0.95
    };
  });

  // Calculate totals
  const totalMaxMarks =
    Number(raw?.totalMaxMarks) ||
    questions.reduce((acc, q) => acc + q.maxMarks, 0) ||
    20;

  const totalScore =
    Number(raw?.totalScore) ??
    questions.reduce((acc, q) => acc + q.awardedMarks, 0);

  const percentage =
    totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;

  const overallFeedback =
    typeof raw?.overallFeedback === "string" && raw.overallFeedback
      ? raw.overallFeedback
      : `Evaluated ${questions.length} questions. Student achieved ${totalScore}/${totalMaxMarks} (${percentage}%).`;

  const pageCount = Math.max(1, Number(raw?.pageCount) || 1);

  return {
    paperTitle,
    subject,
    classLevel,
    totalMaxMarks,
    totalScore,
    percentage,
    pageCount,
    overallFeedback,
    questions,
    unmatchedAnswers: []
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const qpFile = formData.get("questionPaper") as File | null;
    const asFile = formData.get("answerSheet") as File | null;
    const clientApiKey = formData.get("apiKey") as string | null;

    if (!qpFile || !asFile) {
      return NextResponse.json(
        { error: "Both Question Paper and Answer Sheet files are required." },
        { status: 400 }
      );
    }

    const apiKey =
      clientApiKey?.trim() ||
      process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Groq API Key not configured. Please add GROQ_API_KEY in your Vercel Environment Variables or enter it in the upload box."
        },
        { status: 400 }
      );
    }

    const qpName = qpFile.name;
    const asName = asFile.name;

    const isQpPdf = qpName.toLowerCase().endsWith(".pdf") || qpFile.type === "application/pdf";
    const isAsPdf = asName.toLowerCase().endsWith(".pdf") || asFile.type === "application/pdf";

    const isQpImage = qpFile.type.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(qpName);
    const isAsImage = asFile.type.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(asName);

    let qpText = "";
    let asText = "";
    let qpBase64 = "";
    let asBase64 = "";

    // Process Question Paper
    if (isQpPdf) {
      const qpBuffer = Buffer.from(await qpFile.arrayBuffer());
      qpText = await extractTextFromPdfBuffer(qpBuffer);
    } else if (isQpImage) {
      const buffer = Buffer.from(await qpFile.arrayBuffer());
      const mime = qpFile.type || "image/jpeg";
      qpBase64 = `data:${mime};base64,${buffer.toString("base64")}`;
    } else {
      qpText = (await qpFile.text()).slice(0, 30000);
    }

    // Process Answer Sheet
    if (isAsPdf) {
      const asBuffer = Buffer.from(await asFile.arrayBuffer());
      asText = await extractTextFromPdfBuffer(asBuffer);
    } else if (isAsImage) {
      const buffer = Buffer.from(await asFile.arrayBuffer());
      const mime = asFile.type || "image/jpeg";
      asBase64 = `data:${mime};base64,${buffer.toString("base64")}`;
    } else {
      asText = (await asFile.text()).slice(0, 30000);
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const isVisionRequired = Boolean(qpBase64 || asBase64);
    const candidateModels = isVisionRequired
      ? ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview", "openai/gpt-oss-120b"]
      : [
          process.env.GROQ_MODEL,
          "openai/gpt-oss-120b",
          "openai/gpt-oss-20b",
          "qwen/qwen3.8-27b",
          "llama-3.3-70b-versatile",
          "groq/compound"
        ].filter(Boolean) as string[];

    const systemPrompt = `
You are an expert AI Examination Assessment Engine.
Analyze the uploaded Question Paper and Student Answer Sheet.

RULES:
1. Extract ALL questions from the question paper in exact printed order. If there are sub-parts (e.g. 11 (a), 11 (b)), treat each as an independent item.
2. Locate and transcribe the student's handwritten solution for each question from the answer sheet.
3. If a question is skipped or unattempted by the student, mark status as "unanswered", set awardedMarks to 0, and note that the student did not attempt this question.
4. If an answer is fully correct according to standard curriculum rubrics, mark status as "answered" and award full marks.
5. If an answer is partially correct (e.g. missing condition, calculation slip, incomplete diagram), mark status as "partial" and award partial marks.
6. Provide clear, constructive "aiFeedback" for each question explaining the evaluation and mark breakdown.
7. Assign bounding box coordinates on the answer sheet (top, left, width, height as percentages 0-100, and pageNumber starting from 1).

You must return strictly valid JSON matching this structure:
{
  "paperTitle": string,
  "subject": string,
  "classLevel": string,
  "totalMaxMarks": number,
  "totalScore": number,
  "percentage": number,
  "pageCount": number,
  "overallFeedback": string,
  "questions": [
    {
      "id": string,
      "number": string,
      "sectionTitle": string,
      "text": string,
      "maxMarks": number,
      "awardedMarks": number,
      "status": "answered" | "partial" | "unanswered",
      "transcribedAnswer": string,
      "aiFeedback": string,
      "regions": [
        {
          "pageNumber": number,
          "boundingBox": { "top": number, "left": number, "width": number, "height": number },
          "label": string
        }
      ]
    }
  ]
}
`;

    const userPromptText = `
Analyze these uploaded exam documents:

QUESTION PAPER FILE: ${qpName}
${qpText ? `Question Paper Content:\n${qpText}` : "[Question Paper provided via document upload]"}

STUDENT ANSWER SHEET FILE: ${asName}
${asText ? `Student Answer Sheet Content:\n${asText}` : "[Student Answer Sheet provided via document upload]"}

Please extract the questions, transcribe answers, evaluate marks, provide AI feedback per question, and output the required JSON.
`;

    const userContent: any = isVisionRequired
      ? [
          { type: "text", text: userPromptText },
          ...(qpBase64 ? [{ type: "image_url", image_url: { url: qpBase64 } }] : []),
          ...(asBase64 ? [{ type: "image_url", image_url: { url: asBase64 } }] : [])
        ]
      : userPromptText;

    let content: string | null = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await client.chat.completions.create({
          model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
          ]
        });

        content = response.choices[0]?.message?.content ?? null;
        if (content) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[extract-api] Model ${model} failed, trying next candidate:`, err.message);
      }
    }

    if (!content) {
      throw lastError || new Error("Groq returned an empty response. Please verify the uploaded documents and retry.");
    }

    const cleanJson = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(cleanJson);
    const normalized = normalizePayload(parsed, qpName, asName);
    const validated = assessmentExtractionPayloadSchema.parse(normalized);

    return NextResponse.json(validated);
  } catch (error: any) {
    console.error("[extract-api] AI Extraction failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process AI assessment extraction."
      },
      { status: 500 }
    );
  }
}
