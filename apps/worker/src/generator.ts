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
import { config } from "./config.js";

const difficultyCycle: Difficulty[] = ["easy", "moderate", "moderate", "hard"];

export function buildPrompt(input: AssignmentInput) {
  const totals = calculateTotals(input.questionTypes);
  const rows = input.questionTypes
    .map((row) => `- ${row.type}: ${row.count} questions, ${row.marks} marks each`)
    .join("\n");

  const qpContent = input.questionPaperText || input.sourceText || "No question paper file was provided. Use grade-appropriate curriculum knowledge.";
  const asContent = input.answerSheetText ? `\nStudent Answer Sheet:\n${input.answerSheetText}` : "";

  return `
You are generating a teacher-ready exam paper and grading guide. Return JSON only. Do not include markdown fences or commentary.

Required JSON shape:
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
Time allowed: ${input.timeAllowedMinutes} minutes
Maximum marks: ${totals.marks}
Question plan:
${rows}
Additional instructions: ${input.additionalInstructions || "None"}
Question Paper / Reference Material:
${qpContent}${asContent}

Rules:
- Create one section per question type, named Section A, Section B, and so on.
- Every question must have marks matching its question type row.
- Difficulty must use only easy, moderate, or hard.
- Include concise answer-key entries for all questions based on the reference material/student answers provided.
- Do not return raw text outside the JSON object.
`.trim();
}

function safeJsonParse(content: string) {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  return JSON.parse(trimmed);
}

function sectionLetter(index: number) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function topicSeed(input: AssignmentInput) {
  const source = input.questionPaperText || input.sourceText || input.answerSheetText || input.additionalInstructions || input.subject;
  return source
    .replace(/\s+/g, " ")
    .slice(0, 180)
    .trim();
}

function makeQuestion(input: AssignmentInput, sectionIndex: number, questionIndex: number, marks: number): GeneratedQuestion {
  const letter = sectionLetter(sectionIndex);
  const difficulty = difficultyCycle[(sectionIndex + questionIndex) % difficultyCycle.length];
  const topic = topicSeed(input);
  const prompts = [
    `Define one important concept from ${input.subject} and explain its purpose for Class ${input.classLevel}.`,
    `Explain how ${topic || input.subject} can be applied in a classroom example.`,
    `Compare two related ideas from ${input.subject} and mention one real-life use.`,
    `Analyze a situation based on ${topic || input.subject} and justify your answer.`
  ];

  return {
    id: `${letter}${questionIndex + 1}`,
    text: prompts[questionIndex % prompts.length],
    difficulty,
    marks,
    answer: `Expected answer should correctly address the concept, include relevant reasoning, and match the ${marks}-mark depth.`
  };
}

export function fallbackQuestionPaper(rawInput: AssignmentInput): QuestionPaper {
  const input = assignmentInputSchema.parse(rawInput);
  const totals = calculateTotals(input.questionTypes);
  const sections = input.questionTypes.map((row, sectionIndex) => {
    const letter = sectionLetter(sectionIndex);
    const questions = Array.from({ length: row.count }, (_item, index) =>
      makeQuestion(input, sectionIndex, index, row.marks)
    );

    return {
      title: `Section ${letter}`,
      instruction: `Attempt all questions. Each question carries ${row.marks} mark${row.marks === 1 ? "" : "s"}.`,
      questionType: row.type,
      questions
    };
  });

  const answerKey = sections.flatMap((section) =>
    section.questions.map((question) => ({
      questionId: question.id,
      answer: question.answer || "Teacher review required."
    }))
  );

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
    answerKey
  });
}

export async function generateQuestionPaper(input: AssignmentInput): Promise<QuestionPaper> {
  if (!config.groqApiKey) return fallbackQuestionPaper(input);

  try {
    const openai = new OpenAI({ 
      apiKey: config.groqApiKey,
      baseURL: "https://api.groq.com/openai/v1"
    });
    const response = await openai.chat.completions.create({
      model: config.groqModel,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You create structured assessment papers and return valid JSON only."
        },
        {
          role: "user",
          content: buildPrompt(input)
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response");
    return questionPaperSchema.parse(safeJsonParse(content));
  } catch (error) {
    console.warn("[worker] Groq generation failed; using deterministic fallback", error);
    return fallbackQuestionPaper(input);
  }
}
