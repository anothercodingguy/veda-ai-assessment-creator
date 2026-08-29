import { NextResponse } from "next/server";
import OpenAI from "openai";
import { assessmentExtractionPayloadSchema } from "@veda/shared";

export const runtime = "nodejs";

// Extract text from PDF buffer using pdfjs-dist
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
    console.warn("[extract-api] PDF text extraction error:", err);
    return "";
  }
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

    const apiKey = clientApiKey?.trim() || process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Groq API Key is required to analyze your uploaded documents. Please enter your Groq API Key (starts with gsk_) in the upload panel or Settings."
        },
        { status: 400 }
      );
    }

    const qpName = qpFile.name;
    const asName = asFile.name;

    // Check file types
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
    const model = isVisionRequired
      ? "llama-3.2-11b-vision-preview"
      : process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const systemPrompt = `
You are an expert AI Examination Assessment Engine.
Your task is to analyze the provided Question Paper and Student Answer Sheet.

RULES:
1. Extract ALL questions from the question paper in exact printed order. If there are sub-parts (e.g. 11 (a), 11 (b)), treat each as an independent item.
2. Locate and transcribe the student's handwritten solution for each question from the answer sheet.
3. If a question is skipped or unattempted by the student, mark status as "unanswered", set awardedMarks to 0, and note that the student did not attempt this question.
4. If an answer is fully correct according to standard curriculum rubrics, mark status as "answered" and award full marks.
5. If an answer is partially correct (e.g. missing condition, calculation slip, incomplete diagram), mark status as "partial" and award partial marks.
6. Provide clear, constructive "aiFeedback" for each question explaining the evaluation and mark breakdown.
7. Assign bounding box coordinates on the answer sheet (top, left, width, height as percentages 0-100, and pageNumber starting from 1).

You must return strictly valid JSON matching this schema:
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
  ],
  "unmatchedAnswers": []
}
`;

    const userPromptText = `
Analyze these uploaded exam documents:

QUESTION PAPER FILE: ${qpName}
${qpText ? `Question Paper Content:\n${qpText}` : "[Question Paper provided via image/document upload]"}

STUDENT ANSWER SHEET FILE: ${asName}
${asText ? `Student Answer Sheet Content:\n${asText}` : "[Student Answer Sheet provided via image/document upload]"}

Please extract the questions, transcribe answers, evaluate marks, provide AI feedback per question, and output the required JSON.
`;

    const userContent: any = isVisionRequired
      ? [
          { type: "text", text: userPromptText },
          ...(qpBase64 ? [{ type: "image_url", image_url: { url: qpBase64 } }] : []),
          ...(asBase64 ? [{ type: "image_url", image_url: { url: asBase64 } }] : [])
        ]
      : userPromptText;

    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Groq returned an empty response. Please verify the uploaded documents and retry.");
    }

    const cleanJson = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
    const parsed = JSON.parse(cleanJson);
    const validated = assessmentExtractionPayloadSchema.parse(parsed);

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
