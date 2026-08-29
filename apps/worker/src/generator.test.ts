import { describe, expect, it } from "vitest";
import type { AssignmentInput } from "@veda/shared";
import { buildPrompt, fallbackQuestionPaper } from "./generator.js";

const input: AssignmentInput = {
  title: "Quiz on Electricity",
  schoolName: "Delhi Public School, Sector-4, Bokaro",
  subject: "Science",
  classLevel: "8",
  timeAllowedMinutes: 45,
  dueDate: "2026-06-21",
  questionTypes: [
    { id: "1", type: "Short Questions", count: 3, marks: 2 },
    { id: "2", type: "Numerical Problems", count: 2, marks: 5 }
  ],
  additionalInstructions: "Focus on electroplating.",
  sourceText: "",
  uploadedFileName: "",
  questionPaperFileName: "",
  questionPaperText: "",
  answerSheetFileName: "",
  answerSheetText: ""
};

describe("generator", () => {
  it("builds prompts with totals and rows", () => {
    const prompt = buildPrompt(input);
    expect(prompt).toContain("Maximum marks: 16");
    expect(prompt).toContain("Short Questions: 3 questions");
  });

  it("includes question paper and answer sheet context when supplied", () => {
    const prompt = buildPrompt({
      ...input,
      questionPaperText: "Q1: Explain Ohm's law.",
      answerSheetText: "A1: V = IR is Ohm's law."
    });
    expect(prompt).toContain("Q1: Explain Ohm's law.");
    expect(prompt).toContain("Student Answer Sheet:");
    expect(prompt).toContain("A1: V = IR is Ohm's law.");
  });

  it("creates a valid deterministic paper", () => {
    const paper = fallbackQuestionPaper(input);
    expect(paper.sections).toHaveLength(2);
    expect(paper.sections[0].questions).toHaveLength(3);
    expect(paper.maxMarks).toBe(16);
    expect(paper.answerKey).toHaveLength(5);
  });
});
