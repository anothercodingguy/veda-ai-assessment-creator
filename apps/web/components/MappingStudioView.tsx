"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Minus,
  Plus,
  Sparkles
} from "lucide-react";
import {
  type AssessmentExtractionPayload,
  type ExtractedQuestionItem
} from "@veda/shared";
import { PdfCanvasRenderer } from "./PdfCanvasRenderer";

type MappingStudioViewProps = {
  data: AssessmentExtractionPayload;
  questionPaperName?: string;
  answerSheetName?: string;
  answerSheetFile?: File | null;
  questionPaperFile?: File | null;
  onReset: () => void;
};

export function MappingStudioView({
  data,
  questionPaperName = "Question_Paper.pdf",
  answerSheetName = "Answer_Sheet.pdf",
  answerSheetFile,
  questionPaperFile,
  onReset
}: MappingStudioViewProps) {
  const [questions, setQuestions] = useState<ExtractedQuestionItem[]>(data.questions);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(data.questions[0]?.id || "");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({
    [data.questions[0]?.id || ""]: true
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate image URL if answer sheet is an image
  const isAnswerSheetPdf = useMemo(() => {
    return answerSheetFile && (answerSheetFile.type === "application/pdf" || answerSheetFile.name.toLowerCase().endsWith(".pdf"));
  }, [answerSheetFile]);

  const answerSheetImageUrl = useMemo(() => {
    if (answerSheetFile && !isAnswerSheetPdf && (answerSheetFile.type.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(answerSheetFile.name))) {
      return URL.createObjectURL(answerSheetFile);
    }
    return null;
  }, [answerSheetFile, isAnswerSheetPdf]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (answerSheetImageUrl) {
        URL.revokeObjectURL(answerSheetImageUrl);
      }
    };
  }, [answerSheetImageUrl]);

  const activeQuestion =
    questions.find((q) => q.id === activeQuestionId) || questions[0];

  const totalPages = Math.max(1, pdfTotalPages || data.pageCount || 1);

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => {
      const isCurrentlyExpanded = Boolean(prev[qId]);
      return { ...prev, [qId]: !isCurrentlyExpanded };
    });

    setActiveQuestionId(qId);
    const targetQ = questions.find((q) => q.id === qId);
    if (targetQ && targetQ.regions && targetQ.regions.length > 0) {
      const targetPage = targetQ.regions[0].pageNumber;
      if (targetPage && targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    }
  };

  const handleExpandAll = () => {
    const allExpanded = questions.every((q) => expandedQuestions[q.id]);
    const newState: Record<string, boolean> = {};
    questions.forEach((q) => {
      newState[q.id] = !allExpanded;
    });
    setExpandedQuestions(newState);
  };

  const allAreExpanded = questions.length > 0 && questions.every((q) => expandedQuestions[q.id]);

  const selectQuestionFromCanvas = (qId: string) => {
    setActiveQuestionId(qId);
    setExpandedQuestions((prev) => ({ ...prev, [qId]: true }));
    const targetEl = document.querySelector(`[data-card-question-id="${qId}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Scroll active bounding box into view when question changes
  useEffect(() => {
    if (canvasRef.current && activeQuestionId) {
      const el = canvasRef.current.querySelector(`[data-question-id="${activeQuestionId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeQuestionId, currentPage]);

  const getScoreBadgeClass = (awarded: number, max: number, status: string) => {
    if (status === "unanswered" || awarded === 0) return "score-badge-red";
    if (awarded < max) return "score-badge-orange";
    return "score-badge-green";
  };

  // Questions on current page
  const questionsOnPage = questions.filter(
    (q) => (q.regions && q.regions.some((r) => r.pageNumber === currentPage)) || (currentPage === 1 && (!q.regions || q.regions.length === 0))
  );

  return (
    <div className="biology-studio-layout">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Extracted Questions (from question paper)       */}
      {/* ============================================================ */}
      <section className="extracted-questions-col">
        <div className="questions-col-header">
          <div>
            <h2 className="questions-col-title">Extracted Questions (from question paper)</h2>
            <span className="questions-col-subtitle">
              {data.subject} • {data.paperTitle} ({data.totalScore}/{data.totalMaxMarks} Marks • {data.percentage}%)
            </span>
          </div>
          <button
            type="button"
            className="expand-all-outline-btn"
            onClick={handleExpandAll}
          >
            {allAreExpanded ? "Collapse All" : "Expand All"}
          </button>
        </div>

        <div className="questions-card-list">
          {questions.map((q) => {
            const isExpanded = Boolean(expandedQuestions[q.id]);
            const isTargetActive = q.id === activeQuestion?.id;
            const scoreClass = getScoreBadgeClass(q.awardedMarks, q.maxMarks, q.status);
            const questionPage = q.regions?.[0]?.pageNumber || 1;

            return (
              <div
                key={q.id}
                data-card-question-id={q.id}
                className={`biology-question-card ${isExpanded ? "is-expanded" : ""} ${isTargetActive ? "is-active-target" : ""}`}
              >
                <div
                  className="question-card-header-row"
                  onClick={() => toggleExpand(q.id)}
                >
                  <div className="question-header-left">
                    <span className={`question-number-circle ${isExpanded ? "orange-circle" : "dark-circle"}`}>
                      {q.number}
                    </span>
                    <div className="question-title-meta">
                      <p className="question-text-title">{q.text}</p>
                      {questionPage > 1 && (
                        <span className="question-page-indicator">Found on Page {questionPage}</span>
                      )}
                    </div>
                  </div>

                  <div className="question-header-right">
                    <span className={`question-score-pill ${scoreClass}`}>
                      {q.awardedMarks}/{q.maxMarks}
                    </span>
                    <button
                      type="button"
                      className="accordion-chevron-btn"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="question-card-body-expanded">
                    {/* Transcribed student response */}
                    <div className="transcribed-answer-preview">
                      <div className="transcribed-answer-header">
                        <strong className="transcribed-label">Transcribed Student Answer:</strong>
                        <span className={`status-pill-small ${q.status || "answered"}`}>
                          {q.status === "unanswered" ? "Unattempted" : q.status === "partial" ? "Partial Credit" : "Answered"}
                        </span>
                      </div>
                      <p className="transcribed-text">
                        {q.transcribedAnswer || (q.status === "unanswered" ? "[No answer provided by student]" : "Answer recorded.")}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="ai-feedback-inner-card">
                      <strong className="ai-feedback-title">AI Rubric Feedback</strong>
                      <p className="ai-feedback-text">
                        {q.aiFeedback || "Evaluation completed based on rubric criteria."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Answer Sheet Viewer with Bounding Boxes       */}
      {/* ============================================================ */}
      <section className="answer-sheet-col">
        {/* Dark Top Toolbar Header */}
        <div className="answer-sheet-dark-toolbar">
          <span className="sheet-title-text">Answer Sheet ({answerSheetName})</span>

          <div className="sheet-toolbar-controls">
            {/* Zoom Controls */}
            <div className="zoom-pill-group">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel((z) => Math.max(65, z - 15))}
                title="Zoom Out"
              >
                <Minus size={14} />
              </button>
              <span className="zoom-value">{zoomLevel}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                title="Zoom In"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Page Navigation */}
            <div className="page-pill-group">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="page-nav-value">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Paper Canvas Container */}
        <div className="sheet-canvas-container" ref={canvasRef}>
          <div
            className="document-canvas-card"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              width: "100%",
              maxWidth: "720px"
            }}
          >
            {/* If an image or PDF was uploaded, render it with bounding boxes */}
            {answerSheetImageUrl || isAnswerSheetPdf ? (
              <div className="uploaded-image-canvas-wrapper" style={{ position: "relative", width: "100%" }}>
                {answerSheetImageUrl ? (
                  <img
                    src={answerSheetImageUrl}
                    alt="Student Answer Sheet"
                    className="uploaded-sheet-img"
                  />
                ) : (
                  <PdfCanvasRenderer 
                    file={answerSheetFile!} 
                    pageNumber={currentPage} 
                    onLoadDoc={(pages) => setPdfTotalPages(pages)}
                  />
                )}
                {/* Overlay Bounding Boxes on the image/canvas */}
                {questions.map((q) => {
                  const regionsOnPage = (q.regions || []).filter((r) => r.pageNumber === currentPage);
                  const isTarget = q.id === activeQuestion?.id;

                  return regionsOnPage.map((r, idx) => (
                    <div
                      key={`${q.id}-${idx}`}
                      className={`image-bounding-box ${isTarget ? "target-bounding-box-active" : ""}`}
                      data-question-id={q.id}
                      style={{
                        top: `${r.boundingBox.top}%`,
                        left: `${r.boundingBox.left}%`,
                        width: `${r.boundingBox.width}%`,
                        height: `${r.boundingBox.height}%`
                      }}
                      onClick={() => selectQuestionFromCanvas(q.id)}
                    >
                      <div className="green-bounding-box-badge">{r.label || `Q${q.number}`}</div>
                    </div>
                  ));
                })}
              </div>
            ) : (
              /* Ruled Sheet with Real Extracted Content & Bounding Boxes */
              <div className="authentic-ruled-sheet">
                {/* Red Left Margin Line */}
                <div className="sheet-left-margin-line" />

                {/* Ruled Horizontal Lines */}
                <div className="sheet-horizontal-lines">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="ruled-line" />
                  ))}
                </div>

                {/* Handwritten Answer Sheet Content */}
                <div className="sheet-handwritten-content">
                  {questionsOnPage.length === 0 ? (
                    <div className="empty-page-notice">
                      <p>No answers recorded on Page {currentPage}.</p>
                    </div>
                  ) : (
                    questionsOnPage.map((q) => {
                      const isTarget = q.id === activeQuestion?.id;
                      const isSkipped = q.status === "unanswered";

                      return (
                        <div
                          key={q.id}
                          className={`handwritten-block ${isTarget ? "target-bounding-box-active" : ""}`}
                          data-question-id={q.id}
                          onClick={() => selectQuestionFromCanvas(q.id)}
                        >
                          <div className="green-bounding-box-badge">Q{q.number}</div>
                          <span className="handwritten-label">Q{q.number}.</span>
                          <div className="handwritten-body">
                            {isSkipped ? (
                              <span className="skipped-handwritten-note">
                                [Unattempted / Skipped by Student]
                              </span>
                            ) : (
                              <p className="handwritten-paragraph">
                                {q.transcribedAnswer || "Student solution evaluated."}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
