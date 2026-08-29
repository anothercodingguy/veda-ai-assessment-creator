"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  RotateCcw,
  Sparkles,
  XCircle,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import {
  type AssessmentExtractionPayload,
  type ExtractedQuestionItem,
  type UnmatchedAnswerItem
} from "@veda/shared";

type MappingStudioViewProps = {
  data: AssessmentExtractionPayload;
  questionPaperName?: string;
  answerSheetName?: string;
  onReset: () => void;
};

export function MappingStudioView({
  data,
  questionPaperName = "Class_10_maths_unit_test.pdf",
  answerSheetName = "student_1_answer_sheet.pdf",
  onReset
}: MappingStudioViewProps) {
  const [questions, setQuestions] = useState<ExtractedQuestionItem[]>(data.questions);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(data.questions[0]?.id || "");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeFilter, setActiveFilter] = useState<"all" | "answered" | "partial" | "unanswered">("all");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const activeQuestion =
    questions.find((q) => q.id === activeQuestionId) || questions[0];

  const activeIndex = questions.findIndex((q) => q.id === activeQuestion?.id);

  // Handle switching active question
  const selectQuestion = (q: ExtractedQuestionItem) => {
    setActiveQuestionId(q.id);
    if (q.regions.length > 0) {
      // Navigate to the question's first answer page
      setCurrentPage(q.regions[0].pageNumber);
    }
  };

  // Score modifier
  const handleScoreChange = (qId: string, newScore: number) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id === qId) {
          const clamped = Math.max(0, Math.min(item.maxMarks, newScore));
          const updatedStatus =
            clamped === item.maxMarks
              ? "answered"
              : clamped > 0
              ? "partial"
              : item.status === "unanswered"
              ? "unanswered"
              : "partial";
          return { ...item, awardedMarks: clamped, status: updatedStatus };
        }
        return item;
      })
    );
  };

  const totalMaxMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);
  const totalAwardedMarks = questions.reduce((sum, q) => sum + q.awardedMarks, 0);
  const percentage = Math.round((totalAwardedMarks / totalMaxMarks) * 100);

  const filteredQuestions = questions.filter((q) => {
    if (activeFilter === "all") return true;
    return q.status === activeFilter;
  });

  const activeRegionsOnCurrentPage = activeQuestion?.regions.filter(
    (r) => r.pageNumber === currentPage
  ) || [];

  const spansMultiplePages = (activeQuestion?.regions.length || 0) > 1;

  return (
    <section className="mapping-studio-container">
      {/* Studio Header Bar */}
      <header className="studio-topbar">
        <div className="studio-topbar-left">
          <button className="icon-back-btn" onClick={onReset} title="Back to upload">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="studio-title-row">
              <h2 className="studio-paper-title">{data.paperTitle}</h2>
              <span className="exam-subject-badge">{data.subject} • {data.classLevel}</span>
            </div>
            <div className="studio-files-meta">
              <span className="file-tag qp-tag">
                <FileText size={12} /> {questionPaperName}
              </span>
              <span className="file-tag as-tag">
                <FileCheck size={12} /> {answerSheetName}
              </span>
            </div>
          </div>
        </div>

        <div className="studio-topbar-right">
          <div className="score-summary-pill" onClick={() => setShowSummaryModal(true)}>
            <Award size={15} />
            <span>Score:</span>
            <strong>
              {totalAwardedMarks} / {totalMaxMarks} ({percentage}%)
            </strong>
          </div>

          <button className="secondary-pill-compact" onClick={() => setShowSummaryModal(true)}>
            <Sparkles size={14} />
            <span>AI Summary</span>
          </button>

          <button className="primary-pill-compact" onClick={onReset}>
            <RotateCcw size={14} />
            <span>New Scan</span>
          </button>
        </div>
      </header>

      {/* 3-Column Studio Grid */}
      <div className="studio-layout">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Questions Navigator (In Printed Order + Subparts) */}
        {/* ============================================================ */}
        <aside className="studio-left-panel">
          <div className="panel-header">
            <div>
              <h3>Questions ({questions.length})</h3>
              <span className="panel-sub-label">Printed order preserved</span>
            </div>
            <span className="ai-badge">
              <Sparkles size={12} /> Auto-Mapped
            </span>
          </div>

          {/* Filter Bar */}
          <div className="questions-filter-tabs">
            <button
              className={`filter-tab-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({questions.length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === "answered" ? "active" : ""}`}
              onClick={() => setActiveFilter("answered")}
            >
              Answered ({questions.filter((q) => q.status === "answered").length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === "partial" ? "active" : ""}`}
              onClick={() => setActiveFilter("partial")}
            >
              Partial ({questions.filter((q) => q.status === "partial").length})
            </button>
            <button
              className={`filter-tab-btn ${activeFilter === "unanswered" ? "active" : ""}`}
              onClick={() => setActiveFilter("unanswered")}
            >
              Skipped ({questions.filter((q) => q.status === "unanswered").length})
            </button>
          </div>

          {/* Questions Scrollable List */}
          <div className="questions-scroll-list">
            {filteredQuestions.map((q) => {
              const isActive = q.id === activeQuestion.id;
              const isSubpart = Boolean(q.parentQuestionNumber);
              const isMultiPage = q.regions.length > 1;

              return (
                <div
                  key={q.id}
                  className={`question-item-card ${isActive ? "active" : ""} ${
                    isSubpart ? "is-subpart-item" : ""
                  }`}
                  onClick={() => selectQuestion(q)}
                >
                  <div className="item-card-top">
                    <strong className={`q-number-pill ${isSubpart ? "subpart-pill" : ""}`}>
                      Q{q.number}
                    </strong>

                    <span className={`q-status-badge ${q.status}`}>
                      {q.status === "answered" && <CheckCircle2 size={11} />}
                      {q.status === "partial" && <AlertTriangle size={11} />}
                      {q.status === "unanswered" && <XCircle size={11} />}
                      <span>
                        {q.status === "answered"
                          ? "Answered"
                          : q.status === "partial"
                          ? "Partial"
                          : "Unanswered"}
                      </span>
                    </span>

                    {isMultiPage && (
                      <span className="multi-page-pill" title="Answer spans multiple pages">
                        <Layers size={10} /> 2 Pages
                      </span>
                    )}

                    <span className="q-marks-pill">
                      {q.awardedMarks}/{q.maxMarks} M
                    </span>
                  </div>

                  <p className="q-text-snippet">{q.text}</p>

                  <div className="item-card-footer">
                    <span className="section-meta-tag">{q.sectionTitle}</span>
                    {q.regions.length > 0 ? (
                      <span className="mapped-page-tag">
                        Page {q.regions.map((r) => r.pageNumber).join(", ")}
                      </span>
                    ) : (
                      <span className="no-page-tag">Not in Answer Sheet</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Unmatched Answers Section */}
            {data.unmatchedAnswers.length > 0 && (
              <div className="unmatched-answers-section">
                <div className="unmatched-header">
                  <AlertTriangle size={13} />
                  <span>Unmatched Responses ({data.unmatchedAnswers.length})</span>
                </div>
                {data.unmatchedAnswers.map((ua) => (
                  <div
                    key={ua.id}
                    className="unmatched-item-card"
                    onClick={() => setCurrentPage(ua.pageNumber)}
                  >
                    <span className="unmatched-tag">Page {ua.pageNumber}</span>
                    <p className="unmatched-text">{ua.transcribedText}</p>
                    <span className="unmatched-note">{ua.note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ============================================================ */}
        {/* CENTER COLUMN: Student Answer Sheet Document Viewer          */}
        {/* ============================================================ */}
        <main className="studio-center-panel">
          {/* Canvas Navigation Toolbar */}
          <div className="canvas-toolbar">
            <div className="page-switcher">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="page-indicator">
                Page <strong>{currentPage}</strong> of <strong>{data.pageCount}</strong>
              </span>
              <button
                disabled={currentPage >= data.pageCount}
                onClick={() => setCurrentPage((p) => Math.min(data.pageCount, p + 1))}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Multi-page jump indicator */}
            {spansMultiplePages && (
              <div className="multi-page-jump-bar">
                <span>Q{activeQuestion.number} spans:</span>
                {activeQuestion.regions.map((r, idx) => (
                  <button
                    key={idx}
                    className={`page-jump-btn ${currentPage === r.pageNumber ? "active" : ""}`}
                    onClick={() => setCurrentPage(r.pageNumber)}
                  >
                    Page {r.pageNumber}
                  </button>
                ))}
              </div>
            )}

            <div className="zoom-controls">
              <button onClick={() => setZoomLevel((z) => Math.max(70, z - 15))} title="Zoom out">
                <ZoomOut size={16} />
              </button>
              <span>{zoomLevel}%</span>
              <button onClick={() => setZoomLevel((z) => Math.min(140, z + 15))} title="Zoom in">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Document Sheet Canvas with Highlighting Overlay */}
          <div className="document-viewport">
            <div
              className="sheet-paper"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center"
              }}
            >
              {/* Paper Header / Watermark lines */}
              <div className="sheet-ruled-header">
                <span className="sheet-rule-line" />
                <span className="sheet-rule-line" />
                <div className="sheet-meta-header">
                  <span>Student Submission • Page {currentPage}</span>
                  <span>Delhi Public School • Examination 2026</span>
                </div>
              </div>

              {/* Simulated Ruled Page Lines */}
              <div className="sheet-ruled-lines">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="sheet-line" />
                ))}
              </div>

              {/* Unanswered Notice Banner if Active Question has no region on this sheet */}
              {activeQuestion?.status === "unanswered" && (
                <div className="unanswered-watermark-notice">
                  <XCircle size={18} />
                  <div>
                    <strong>Q{activeQuestion.number} is Unanswered</strong>
                    <p>The student did not attempt this question on the answer sheet.</p>
                  </div>
                </div>
              )}

              {/* Simulated Handwritten Answer Blocks & Highlight Regions */}
              <div className="sheet-answers-content">
                {questions.map((q) => {
                  const regionsOnPage = q.regions.filter((r) => r.pageNumber === currentPage);
                  const isTarget = q.id === activeQuestion.id;

                  return regionsOnPage.map((r, rIdx) => (
                    <div
                      key={`${q.id}-${rIdx}`}
                      className={`answer-highlight-region ${
                        isTarget ? "highlight-active" : ""
                      }`}
                      style={{
                        top: `${r.boundingBox.top}%`,
                        left: `${r.boundingBox.left}%`,
                        width: `${r.boundingBox.width}%`,
                        minHeight: `${r.boundingBox.height}%`
                      }}
                      onClick={() => selectQuestion(q)}
                    >
                      {isTarget && (
                        <div className="highlight-tag">
                          <CheckCircle2 size={12} />
                          <span>{r.label || `Answer for Q${q.number}`}</span>
                        </div>
                      )}

                      <div className="handwriting-preview">
                        <strong className="ans-num">Ans {q.number}: </strong>
                        <span>
                          {rIdx === 0
                            ? q.transcribedAnswer.slice(0, 180) +
                              (q.transcribedAnswer.length > 180 ? "..." : "")
                            : `(Continued from Page 1) ... ${q.transcribedAnswer.slice(120)}`}
                        </span>
                      </div>
                    </div>
                  ));
                })}

                {/* Render Unmatched scratch notes on Page 2 */}
                {currentPage === 2 &&
                  data.unmatchedAnswers.map((ua) =>
                    ua.regions.map((r, idx) => (
                      <div
                        key={`unmatched-${idx}`}
                        className="unmatched-highlight-region"
                        style={{
                          top: `${r.boundingBox.top}%`,
                          left: `${r.boundingBox.left}%`,
                          width: `${r.boundingBox.width}%`,
                          minHeight: `${r.boundingBox.height}%`
                        }}
                      >
                        <div className="unmatched-tag-badge">
                          <AlertTriangle size={11} />
                          <span>Unmatched Work</span>
                        </div>
                        <div className="handwriting-preview scratch-text">
                          {ua.transcribedText}
                        </div>
                      </div>
                    ))
                  )}
              </div>
            </div>
          </div>
        </main>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Question Details, Transcription & Grading     */}
        {/* ============================================================ */}
        <aside className="studio-right-panel">
          <div className="panel-header">
            <div>
              <h3>Grading & Evaluation</h3>
              <span className="panel-sub-label">Question Inspector</span>
            </div>
            <span className="q-tag-active">Q{activeQuestion.number}</span>
          </div>

          <div className="eval-scroll-body">
            {/* Question Text Card */}
            <div className="eval-section">
              <label className="eval-label">Question Text</label>
              <div className="eval-question-box">
                <p className="eval-q-text">{activeQuestion.text}</p>
                <div className="eval-meta-row">
                  <span>{activeQuestion.sectionTitle}</span>
                  <span>Maximum Marks: {activeQuestion.maxMarks}</span>
                </div>
              </div>
            </div>

            {/* Transcribed Student Answer */}
            <div className="eval-section">
              <div className="eval-label-row">
                <label className="eval-label">Transcribed Student Answer</label>
                <span className={`eval-status-chip ${activeQuestion.status}`}>
                  {activeQuestion.status === "answered"
                    ? "✓ Answered"
                    : activeQuestion.status === "partial"
                    ? "⚠ Partial"
                    : "✕ Unanswered"}
                </span>
              </div>
              <div className={`eval-answer-box ${activeQuestion.status}`}>
                <p>{activeQuestion.transcribedAnswer}</p>
                {activeQuestion.regions.length > 0 && (
                  <div className="eval-location-note">
                    Mapped across Page(s):{" "}
                    <strong>{activeQuestion.regions.map((r) => r.pageNumber).join(", ")}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* AI Grading & Rubric Feedback */}
            <div className="eval-section">
              <label className="eval-label">
                <Sparkles size={14} className="sparkle-gold" /> AI Diagnostic Feedback
              </label>
              <div className="eval-feedback-box">
                <p>{activeQuestion.aiFeedback}</p>
              </div>
            </div>

            {/* Score Stepper / Editor */}
            <div className="eval-section">
              <label className="eval-label">Awarded Score</label>
              <div className="score-adjuster-box">
                <button
                  className="score-step-btn"
                  onClick={() => handleScoreChange(activeQuestion.id, activeQuestion.awardedMarks - 1)}
                  disabled={activeQuestion.awardedMarks <= 0}
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={activeQuestion.maxMarks}
                  value={activeQuestion.awardedMarks}
                  onChange={(e) => handleScoreChange(activeQuestion.id, Number(e.target.value))}
                  className="score-input"
                />
                <button
                  className="score-step-btn"
                  onClick={() => handleScoreChange(activeQuestion.id, activeQuestion.awardedMarks + 1)}
                  disabled={activeQuestion.awardedMarks >= activeQuestion.maxMarks}
                >
                  +
                </button>
                <span className="score-max-label">/ {activeQuestion.maxMarks} Marks</span>
              </div>
            </div>

            {/* Next / Prev Question Navigator */}
            <div className="eval-nav-buttons">
              <button
                className="secondary-pill-compact"
                disabled={activeIndex <= 0}
                onClick={() => selectQuestion(questions[activeIndex - 1])}
              >
                <ChevronLeft size={15} />
                <span>Prev Question</span>
              </button>
              <button
                className="secondary-pill-compact"
                disabled={activeIndex >= questions.length - 1}
                onClick={() => selectQuestion(questions[activeIndex + 1])}
              >
                <span>Next Question</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Summary Diagnostics Modal */}
      {showSummaryModal && (
        <div className="summary-modal-backdrop" onClick={() => setShowSummaryModal(false)}>
          <div className="summary-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Assessment Grading Summary</h2>
                <p>{data.paperTitle} • {data.subject}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSummaryModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-stats-grid">
              <div className="stat-card">
                <span className="stat-num">{totalAwardedMarks} / {totalMaxMarks}</span>
                <span className="stat-label">Total Score ({percentage}%)</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{questions.filter((q) => q.status === "answered").length}</span>
                <span className="stat-label">Full Credit</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{questions.filter((q) => q.status === "partial").length}</span>
                <span className="stat-label">Partial Credit</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{questions.filter((q) => q.status === "unanswered").length}</span>
                <span className="stat-label">Skipped</span>
              </div>
            </div>

            <div className="modal-feedback-section">
              <h3>Overall Teacher Feedback</h3>
              <p>{data.overallFeedback}</p>
            </div>

            <div className="modal-actions">
              <button className="primary-pill-compact" onClick={() => setShowSummaryModal(false)}>
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
