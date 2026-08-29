"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Mic,
  Minus,
  Plus,
  UploadCloud,
  X
} from "lucide-react";
import { assignmentInputSchema, calculateTotals, questionTypeOptions, type AssignmentInput, type QuestionTypeRow } from "@veda/shared";
import { useAssignmentStore } from "../store/assignment-store";

const initialRows: QuestionTypeRow[] = [
  { id: "row-1", type: "Multiple Choice Questions", count: 4, marks: 1 },
  { id: "row-2", type: "Short Questions", count: 3, marks: 2 },
  { id: "row-3", type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
  { id: "row-4", type: "Numerical Problems", count: 5, marks: 5 }
];

function nextWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `row-${Date.now()}`;
}

export function AssignmentForm() {
  const router = useRouter();
  const { createAssignment, saving } = useAssignmentStore();
  const [title, setTitle] = useState("Quiz on Electricity");
  const [schoolName, setSchoolName] = useState("Delhi Public School, Sector-4, Bokaro");
  const [subject, setSubject] = useState("Science");
  const [classLevel, setClassLevel] = useState("8");
  const [timeAllowedMinutes, setTimeAllowedMinutes] = useState(45);
  const [dueDate, setDueDate] = useState(nextWeekDate());
  const [rows, setRows] = useState<QuestionTypeRow[]>(initialRows);
  const [additionalInstructions, setAdditionalInstructions] = useState(
    "Generate a balanced question paper based on NCERT chapters and include a concise answer key."
  );
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [answerSheetFile, setAnswerSheetFile] = useState<File | null>(null);
  const [isDraggingQP, setIsDraggingQP] = useState(false);
  const [isDraggingAS, setIsDraggingAS] = useState(false);
  const [localError, setLocalError] = useState("");

  const validateFile = (selectedFile: File): boolean => {
    const validExtensions = [".pdf", ".txt", ".png", ".jpg", ".jpeg"];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setLocalError("Only PDF, TXT, PNG, and JPG files are supported.");
      return false;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      setLocalError("File size exceeds the 10MB limit.");
      return false;
    }
    
    setLocalError("");
    return true;
  };

  const handleQPChange = (file: File | null) => {
    if (!file) {
      setQuestionPaperFile(null);
      return;
    }
    if (validateFile(file)) {
      setQuestionPaperFile(file);
    }
  };

  const handleASChange = (file: File | null) => {
    if (!file) {
      setAnswerSheetFile(null);
      return;
    }
    if (validateFile(file)) {
      setAnswerSheetFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totals = useMemo(() => calculateTotals(rows), [rows]);

  function updateRow(id: string, patch: Partial<QuestionTypeRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function stepRow(id: string, key: "count" | "marks", delta: number) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [key]: Math.max(1, row[key] + delta) } : row))
    );
  }

  function addRow() {
    const nextType = questionTypeOptions.find((option) => !rows.some((row) => row.type === option)) ?? "Long Answer Questions";
    setRows((current) => [...current, { id: makeId(), type: nextType, count: 4, marks: 4 }]);
  }

  async function submit() {
    const input: AssignmentInput = {
      title,
      schoolName,
      subject,
      classLevel,
      timeAllowedMinutes,
      dueDate,
      questionTypes: rows,
      additionalInstructions,
      sourceText: "",
      uploadedFileName: questionPaperFile?.name ?? answerSheetFile?.name ?? "",
      questionPaperFileName: questionPaperFile?.name ?? "",
      questionPaperText: "",
      answerSheetFileName: answerSheetFile?.name ?? "",
      answerSheetText: ""
    };

    const parsed = assignmentInputSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setLocalError(issue?.message ?? "Please fix the form details");
      return;
    }

    setLocalError("");
    try {
      const assignmentId = await createAssignment(parsed.data, {
        questionPaper: questionPaperFile,
        answerSheet: answerSheetFile
      });
      router.push(`/assignments/${assignmentId}`);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Could not create assignment");
    }
  }

  return (
    <section className="form-stage">
      <div className="progress-lines" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="form-card">
        <div className="form-heading">
          <h2>Assignment Details</h2>
          <p>Basic information about your assignment</p>
        </div>

        <div className="dual-upload-grid">
          <div className="upload-box-wrapper">
            <span className="upload-section-title">1. Question Paper</span>
            <label 
              className={`upload-zone ${isDraggingQP ? "dragging" : ""} ${questionPaperFile ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingQP(true); }}
              onDragLeave={() => setIsDraggingQP(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingQP(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) handleQPChange(droppedFile);
              }}
            >
              <input
                type="file"
                accept=".pdf,.txt,.png,.jpg,.jpeg"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) handleQPChange(selected);
                }}
              />
              <UploadCloud size={28} />
              {questionPaperFile ? (
                <div className="file-pill">
                  <div className="file-pill-info">
                    <strong title={questionPaperFile.name}>{questionPaperFile.name}</strong>
                    <span>{formatFileSize(questionPaperFile.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleQPChange(null);
                    }}
                    aria-label="Remove question paper"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <strong>Choose Question Paper</strong>
                  <span>PDF, TXT, Images up to 10MB</span>
                  <em>Browse Files</em>
                </>
              )}
            </label>
            <p className="upload-caption">Upload exam question paper or syllabus</p>
          </div>

          <div className="upload-box-wrapper">
            <span className="upload-section-title">2. Student Answer Sheet</span>
            <label 
              className={`upload-zone ${isDraggingAS ? "dragging" : ""} ${answerSheetFile ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingAS(true); }}
              onDragLeave={() => setIsDraggingAS(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingAS(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) handleASChange(droppedFile);
              }}
            >
              <input
                type="file"
                accept=".pdf,.txt,.png,.jpg,.jpeg"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) handleASChange(selected);
                }}
              />
              <UploadCloud size={28} />
              {answerSheetFile ? (
                <div className="file-pill">
                  <div className="file-pill-info">
                    <strong title={answerSheetFile.name}>{answerSheetFile.name}</strong>
                    <span>{formatFileSize(answerSheetFile.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleASChange(null);
                    }}
                    aria-label="Remove answer sheet"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <strong>Choose Answer Sheet</strong>
                  <span>PDF, TXT, Images up to 10MB</span>
                  <em>Browse Files</em>
                </>
              )}
            </label>
            <p className="upload-caption">Upload student submission or handwritten scan</p>
          </div>
        </div>

        <div className="field-grid">
          <label>
            Assignment Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Quiz on Electricity" />
          </label>
          <label>
            School Name
            <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} placeholder="School name" />
          </label>
          <label>
            Subject
            <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Science" />
          </label>
          <label>
            Class
            <input value={classLevel} onChange={(event) => setClassLevel(event.target.value)} placeholder="8" />
          </label>
          <label>
            Time Allowed
            <input
              type="number"
              min={15}
              value={timeAllowedMinutes}
              onChange={(event) => setTimeAllowedMinutes(Number(event.target.value))}
            />
          </label>
          <label>
            Due Date
            <span className="date-input">
              <input value={dueDate} type="date" onChange={(event) => setDueDate(event.target.value)} />
              <CalendarDays size={20} />
            </span>
          </label>
        </div>

        <div className="question-table">
          <div className="question-table-head">
            <span>Question Type</span>
            <span>No. of Questions</span>
            <span>Marks</span>
          </div>
          {rows.map((row) => (
            <div className="question-row" key={row.id}>
              <label className="select-wrap">
                <select value={row.type} onChange={(event) => updateRow(row.id, { type: event.target.value })}>
                  {questionTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown size={17} />
              </label>
              <Stepper value={row.count} onMinus={() => stepRow(row.id, "count", -1)} onPlus={() => stepRow(row.id, "count", 1)} />
              <Stepper value={row.marks} onMinus={() => stepRow(row.id, "marks", -1)} onPlus={() => stepRow(row.id, "marks", 1)} />
              <button
                className="remove-row"
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                disabled={rows.length === 1}
                aria-label="Remove question type"
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>

        <button className="add-row" onClick={addRow}>
          <span>
            <Plus size={23} />
          </span>
          Add Question Type
        </button>

        <div className="totals">
          <span>Total Questions : {totals.questions}</span>
          <span>Total Marks : {totals.marks}</span>
        </div>

        <label className="instructions-field">
          Additional Information (For better output)
          <textarea
            value={additionalInstructions}
            onChange={(event) => setAdditionalInstructions(event.target.value)}
            placeholder="e.g Generate a question paper for 3 hour exam duration..."
          />
          <button aria-label="Voice input" type="button">
            <Mic size={16} />
          </button>
        </label>

        {localError && <p className="form-error">{localError}</p>}
      </div>

      <div className="form-actions">
        <button className="secondary-pill" onClick={() => router.push("/")}>
          <ArrowLeft size={18} />
          Previous
        </button>
        <button className="primary-pill" onClick={submit} disabled={saving}>
          {saving ? "Generating..." : "Next"}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="stepper">
      <button onClick={onMinus} aria-label="Decrease">
        <Minus size={15} />
      </button>
      <strong>{value}</strong>
      <button onClick={onPlus} aria-label="Increase">
        <Plus size={15} />
      </button>
    </div>
  );
}
