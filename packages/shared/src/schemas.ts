import { z } from "zod";

export const GENERATION_QUEUE_NAME = "generation";
export const ASSIGNMENT_EVENTS_CHANNEL = "assignment-events";

export const questionTypeOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Long Answer Questions",
  "Case Study Questions"
] as const;

export const difficultySchema = z.enum(["easy", "moderate", "hard"]);
export type Difficulty = z.infer<typeof difficultySchema>;

export const generationStatusSchema = z.enum([
  "draft",
  "queued",
  "processing",
  "completed",
  "failed"
]);
export type GenerationStatus = z.infer<typeof generationStatusSchema>;

export const questionTypeRowSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(2, "Question type is required"),
  count: z.coerce.number().int().min(1, "Use at least 1 question").max(100),
  marks: z.coerce.number().int().min(1, "Marks must be positive").max(100)
});
export type QuestionTypeRow = z.infer<typeof questionTypeRowSchema>;

export const assignmentInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required"),
    schoolName: z.string().trim().min(2, "School name is required"),
    subject: z.string().trim().min(2, "Subject is required"),
    classLevel: z.string().trim().min(1, "Class is required"),
    timeAllowedMinutes: z.coerce.number().int().min(15).max(360),
    dueDate: z.string().min(1, "Due date is required"),
    questionTypes: z.array(questionTypeRowSchema).min(1, "Add at least one question type"),
    additionalInstructions: z.string().trim().max(2000).optional().default(""),
    sourceText: z.string().trim().max(24000).optional().default(""),
    uploadedFileName: z.string().trim().max(255).optional().default(""),
    questionPaperFileName: z.string().trim().max(255).optional().default(""),
    questionPaperText: z.string().trim().max(24000).optional().default(""),
    answerSheetFileName: z.string().trim().max(255).optional().default(""),
    answerSheetText: z.string().trim().max(24000).optional().default("")
  })
  .superRefine((value, ctx) => {
    const parsedDate = Date.parse(value.dueDate);
    if (Number.isNaN(parsedDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Use a valid due date"
      });
    }
  });
export type AssignmentInput = z.infer<typeof assignmentInputSchema>;

export const generatedQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(8),
  difficulty: difficultySchema,
  marks: z.coerce.number().int().min(1),
  answer: z.string().trim().optional().default("")
});
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export const questionSectionSchema = z.object({
  title: z.string().trim().min(1),
  instruction: z.string().trim().min(1),
  questionType: z.string().trim().min(1),
  questions: z.array(generatedQuestionSchema).min(1)
});
export type QuestionSection = z.infer<typeof questionSectionSchema>;

export const answerKeySchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().trim().min(1)
});
export type AnswerKeyItem = z.infer<typeof answerKeySchema>;

export const questionPaperSchema = z.object({
  title: z.string().trim().min(1),
  schoolName: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  classLevel: z.string().trim().min(1),
  timeAllowedMinutes: z.coerce.number().int().min(1),
  maxMarks: z.coerce.number().int().min(1),
  instructions: z.array(z.string().trim().min(1)).min(1),
  sections: z.array(questionSectionSchema).min(1),
  answerKey: z.array(answerKeySchema).default([])
});
export type QuestionPaper = z.infer<typeof questionPaperSchema>;

export const assignmentRecordSchema = z.object({
  id: z.string(),
  input: assignmentInputSchema,
  status: generationStatusSchema,
  result: questionPaperSchema.optional(),
  error: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AssignmentRecord = z.infer<typeof assignmentRecordSchema>;

export const assignmentEventSchema = z.object({
  assignmentId: z.string(),
  status: generationStatusSchema,
  message: z.string().optional(),
  result: questionPaperSchema.optional()
});
export type AssignmentEvent = z.infer<typeof assignmentEventSchema>;

export function calculateTotals(rows: QuestionTypeRow[]) {
  return rows.reduce(
    (total, row) => ({
      questions: total.questions + row.count,
      marks: total.marks + row.count * row.marks
    }),
    { questions: 0, marks: 0 }
  );
}

export function formatDifficulty(difficulty: Difficulty) {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "moderate") return "Moderate";
  return "Hard";
}

export const boundingBoxSchema = z.object({
  top: z.number().min(0).max(100),
  left: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100)
});
export type BoundingBox = z.infer<typeof boundingBoxSchema>;

export const answerRegionSchema = z.object({
  pageNumber: z.number().int().min(1),
  boundingBox: boundingBoxSchema,
  label: z.string().optional()
});
export type AnswerRegion = z.infer<typeof answerRegionSchema>;

export const questionStatusSchema = z.enum(["answered", "partial", "unanswered", "unmatched"]);
export type QuestionStatus = z.infer<typeof questionStatusSchema>;

export const extractedQuestionItemSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1), // e.g. "1", "2", "11 (a)", "11 (b)"
  parentQuestionNumber: z.string().optional(),
  sectionTitle: z.string().min(1),
  text: z.string().min(1),
  maxMarks: z.number().min(1),
  awardedMarks: z.number().min(0),
  status: questionStatusSchema,
  transcribedAnswer: z.string(),
  aiFeedback: z.string(),
  regions: z.array(answerRegionSchema),
  confidence: z.number().optional()
});
export type ExtractedQuestionItem = z.infer<typeof extractedQuestionItemSchema>;

export const unmatchedAnswerItemSchema = z.object({
  id: z.string().min(1),
  transcribedText: z.string(),
  pageNumber: z.number().int().min(1),
  regions: z.array(answerRegionSchema),
  note: z.string()
});
export type UnmatchedAnswerItem = z.infer<typeof unmatchedAnswerItemSchema>;

export const assessmentExtractionPayloadSchema = z.object({
  paperTitle: z.string().min(1),
  subject: z.string().min(1),
  classLevel: z.string().min(1),
  totalMaxMarks: z.number().min(1),
  totalScore: z.number().min(0),
  percentage: z.number().min(0).max(100),
  questions: z.array(extractedQuestionItemSchema),
  unmatchedAnswers: z.array(unmatchedAnswerItemSchema).default([]),
  overallFeedback: z.string(),
  pageCount: z.number().int().min(1).default(2)
});
export type AssessmentExtractionPayload = z.infer<typeof assessmentExtractionPayloadSchema>;

