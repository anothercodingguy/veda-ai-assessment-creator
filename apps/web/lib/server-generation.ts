import OpenAI from "openai";
import {
  assignmentInputSchema,
  calculateTotals,
  questionPaperSchema,
  type AssignmentInput,
  type Difficulty,
  type GeneratedQuestion,
  type QuestionPaper
} from "@veda/shared";

const difficultyCycle: Difficulty[] = ["easy", "moderate", "moderate", "hard"];

export function buildServerPrompt(input: AssignmentInput) {
  const totals = calculateTotals(input.questionTypes);
  const rows = input.questionTypes
    .map((row) => `- ${row.type}: ${row.count} questions, ${row.marks} marks each`)
    .join("\n");

  const qpContent = input.questionPaperText || input.sourceText || "No question paper file was provided. Use grade-appropriate curriculum knowledge.";
  const asContent = input.answerSheetText ? `\nStudent Answer Sheet:\n${input.answerSheetText}` : "";

  return `
Return JSON only for this question paper and grading guide.

Shape:
{
  "title": string,
  "schoolName": string,
  "subject": string,
  "classLevel": string,
  "timeAllowedMinutes": number,
  "maxMarks": number,
  "instructions": string[],
  "sections": [
    {
      "title": "Section A",
      "instruction": string,
      "questionType": string,
      "questions": [
        { "id": "A1", "text": string, "difficulty": "easy" | "moderate" | "hard", "marks": number, "answer": string }
      ]
    }
  ],
  "answerKey": [{ "questionId": string, "answer": string }]
}

Assignment:
Title: ${input.title}
School: ${input.schoolName}
Subject: ${input.subject}
Class: ${input.classLevel}
Time: ${input.timeAllowedMinutes} minutes
Max marks: ${totals.marks}
Question plan:
${rows}
Instructions: ${input.additionalInstructions || "None"}
Question Paper / Reference Material:
${qpContent}${asContent}

Rules:
- One section per question type.
- Use marks from the question plan exactly.
- Use only easy, moderate, or hard for difficulty.
- Include answer-key entries for every question.
`.trim();
}

function safeJsonParse(content: string) {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  return JSON.parse(trimmed);
}

function sectionLetter(index: number) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function makeQuestion(input: AssignmentInput, sectionIndex: number, questionIndex: number, marks: number): GeneratedQuestion {
  const letter = sectionLetter(sectionIndex);
  const difficulty = difficultyCycle[(sectionIndex + questionIndex) % difficultyCycle.length];
  const topic = (input.sourceText || input.additionalInstructions || input.subject).replace(/\s+/g, " ").slice(0, 140);

  return {
    id: `${letter}${questionIndex + 1}`,
    text: `Explain ${topic || input.subject} for Class ${input.classLevel} with a clear example.`,
    difficulty,
    marks,
    answer: `A complete answer should cover the concept, reasoning, and example at ${marks}-mark depth.`
  };
}

export function fallbackQuestionPaper(rawInput: AssignmentInput): QuestionPaper {
  const input = assignmentInputSchema.parse(rawInput);
  const totals = calculateTotals(input.questionTypes);
  const sections = input.questionTypes.map((row, sectionIndex) => ({
    title: `Section ${sectionLetter(sectionIndex)}`,
    instruction: `Attempt all questions. Each question carries ${row.marks} mark${row.marks === 1 ? "" : "s"}.`,
    questionType: row.type,
    questions: Array.from({ length: row.count }, (_item, questionIndex) =>
      makeQuestion(input, sectionIndex, questionIndex, row.marks)
    )
  }));

  return questionPaperSchema.parse({
    title: input.title,
    schoolName: input.schoolName,
    subject: input.subject,
    classLevel: input.classLevel,
    timeAllowedMinutes: input.timeAllowedMinutes,
    maxMarks: totals.marks,
    instructions: [
      "All questions are compulsory unless stated otherwise.",
      input.additionalInstructions || "Write answers neatly and show all necessary working."
    ],
    sections,
    answerKey: sections.flatMap((section) =>
      section.questions.map((question) => ({
        questionId: question.id,
        answer: question.answer || "Teacher review required."
      }))
    )
  });
}

export async function generateServerQuestionPaper(input: AssignmentInput): Promise<QuestionPaper> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return fallbackQuestionPaper(input);

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
    const response = await client.chat.completions.create({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You create structured assessment papers and return valid JSON only." },
        { role: "user", content: buildServerPrompt(input) }
      ]
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("AI engine returned an empty response");
    return questionPaperSchema.parse(safeJsonParse(content));
  } catch (error) {
    console.warn("[web-api] AI generation failed; using fallback", error);
    return fallbackQuestionPaper(input);
  }
}
