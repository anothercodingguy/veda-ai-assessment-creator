import { describe, expect, it } from "vitest";
import { assignmentInputSchema, calculateTotals, questionPaperSchema } from "./schemas.js";

describe("assignmentInputSchema", () => {
  it("rejects negative question counts and marks", () => {
    const result = assignmentInputSchema.safeParse({
      title: "Electricity Quiz",
      schoolName: "Delhi Public School",
      subject: "Science",
      classLevel: "8",
      timeAllowedMinutes: 45,
      dueDate: "2026-06-20",
      questionTypes: [{ id: "1", type: "Short Questions", count: -1, marks: 2 }]
    });

    expect(result.success).toBe(false);
  });

  it("calculates totals by row count and marks", () => {
    expect(
      calculateTotals([
        { id: "1", type: "Short Questions", count: 3, marks: 2 },
        { id: "2", type: "Long Answer Questions", count: 2, marks: 5 }
      ])
    ).toEqual({ questions: 5, marks: 16 });
  });

  it("accepts dual-upload fields for question paper and answer sheet", () => {
    const result = assignmentInputSchema.safeParse({
      title: "Electricity Quiz",
      schoolName: "Delhi Public School",
      subject: "Science",
      classLevel: "8",
      timeAllowedMinutes: 45,
      dueDate: "2026-06-20",
      questionTypes: [{ id: "1", type: "Short Questions", count: 3, marks: 2 }],
      questionPaperFileName: "qp.pdf",
      questionPaperText: "Question paper extracted text",
      answerSheetFileName: "answers.pdf",
      answerSheetText: "Student handwritten answer text"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questionPaperFileName).toBe("qp.pdf");
      expect(result.data.answerSheetFileName).toBe("answers.pdf");
    }
  });
});

describe("questionPaperSchema", () => {
  it("accepts structured question papers", () => {
    const result = questionPaperSchema.safeParse({
      title: "Electricity Quiz",
      schoolName: "Delhi Public School",
      subject: "Science",
      classLevel: "8",
      timeAllowedMinutes: 45,
      maxMarks: 10,
      instructions: ["Attempt all questions."],
      sections: [
        {
          title: "Section A",
          instruction: "Attempt all questions.",
          questionType: "Short Questions",
          questions: [{ id: "A1", text: "Explain electroplating with one use.", difficulty: "easy", marks: 2 }]
        }
      ],
      answerKey: []
    });

    expect(result.success).toBe(true);
  });
});
