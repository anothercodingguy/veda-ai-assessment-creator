"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Plus,
  Sparkles
} from "lucide-react";
import {
  type AssessmentExtractionPayload,
  type ExtractedQuestionItem
} from "@veda/shared";

type MappingStudioViewProps = {
  data: AssessmentExtractionPayload;
  questionPaperName?: string;
  answerSheetName?: string;
  onReset: () => void;
};

export function MappingStudioView({
  data,
  questionPaperName = "Biology_Assessment.pdf",
  answerSheetName = "Student_Answer_Sheet.pdf",
  onReset
}: MappingStudioViewProps) {
  const [questions, setQuestions] = useState<ExtractedQuestionItem[]>(data.questions);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(data.questions[1]?.id || data.questions[0]?.id || "q2");
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({
    [data.questions[1]?.id || "q2"]: true
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeQuestion =
    questions.find((q) => q.id === activeQuestionId) || questions[0];

  const totalPages = data.pageCount || 4;

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => {
      const isCurrentlyExpanded = Boolean(prev[qId]);
      const nextState = { ...prev, [qId]: !isCurrentlyExpanded };
      return nextState;
    });

    setActiveQuestionId(qId);
    const targetQ = questions.find((q) => q.id === qId);
    if (targetQ && targetQ.regions.length > 0) {
      setCurrentPage(targetQ.regions[0].pageNumber);
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
  };

  // Scroll active bounding box into view when page/question changes
  useEffect(() => {
    const targetRegion = activeQuestion?.regions.find((r) => r.pageNumber === currentPage);
    if (targetRegion && canvasRef.current) {
      const el = canvasRef.current.querySelector(`[data-question-id="${activeQuestion.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeQuestionId, currentPage, activeQuestion]);

  const getScoreBadgeClass = (awarded: number, max: number, status: string) => {
    if (status === "unanswered" || awarded === 0) return "score-badge-red";
    if (awarded < max) return "score-badge-orange";
    return "score-badge-green";
  };

  return (
    <div className="biology-studio-layout">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Extracted Questions (from question paper)       */}
      {/* ============================================================ */}
      <section className="extracted-questions-col">
        <div className="questions-col-header">
          <h2 className="questions-col-title">Extracted Questions (from question paper)</h2>
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

            return (
              <div
                key={q.id}
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
                    <p className="question-text-title">{q.text}</p>
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
                    <div className="ai-feedback-inner-card">
                      <strong className="ai-feedback-title">AI Feedback</strong>
                      <p className="ai-feedback-text">
                        {q.aiFeedback ||
                          "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis. Keep it up!"}
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
          <span className="sheet-title-text">Answer Sheet</span>

          <div className="sheet-toolbar-controls">
            {/* Zoom Controls */}
            <div className="zoom-pill-group">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                title="Zoom Out"
              >
                <Minus size={14} />
              </button>
              <span className="zoom-value">{zoomLevel}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel((z) => Math.min(135, z + 15))}
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

        {/* Paper Canvas */}
        <div className="sheet-canvas-container" ref={canvasRef}>
          <div
            className="authentic-ruled-sheet"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center"
            }}
          >
            {/* Red Left Margin Line */}
            <div className="sheet-left-margin-line" />

            {/* Ruled Horizontal Lines */}
            <div className="sheet-horizontal-lines">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="ruled-line" />
              ))}
            </div>

            {/* Handwritten Answer Sheet Content & Drawings */}
            <div className="sheet-handwritten-content">
              {currentPage === 1 && (
                <>
                  {/* Q1 Answer Block */}
                  <div
                    className="handwritten-block q1-block"
                    onClick={() => selectQuestionFromCanvas("q1")}
                  >
                    <span className="handwritten-label">Q1.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        Photosynthesis is the process used by green plants and some other organisms to convert light energy into chemical energy.
                      </p>
                      <div className="handwritten-equation">
                        <div className="equation-box">
                          6CO<sub>2</sub> + 6H<sub>2</sub>O
                          <span className="reaction-arrow">
                            <span className="arrow-top">Light</span>
                            <span className="arrow-line">────────►</span>
                            <span className="arrow-bottom">Chlorophyll</span>
                          </span>
                          C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub>
                        </div>
                      </div>

                      {/* Plant Diagram */}
                      <div className="handwritten-plant-diagram">
                        <svg viewBox="0 0 280 140" className="plant-svg">
                          {/* Sun */}
                          <circle cx="95" cy="28" r="12" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                          {Array.from({ length: 8 }).map((_, i) => {
                            const angle = (i * 45 * Math.PI) / 180;
                            return (
                              <line
                                key={i}
                                x1={95 + 16 * Math.cos(angle)}
                                y1={28 + 16 * Math.sin(angle)}
                                x2={95 + 23 * Math.cos(angle)}
                                y2={28 + 23 * Math.sin(angle)}
                                stroke="#d97706"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            );
                          })}
                          <text x="122" y="32" className="svg-annotation">Sunlight</text>
                          <line x1="110" y1="42" x2="135" y2="70" stroke="#475569" strokeWidth="1.2" markerEnd="url(#arrow)" />

                          {/* CO2 Arrow */}
                          <text x="25" y="72" className="svg-annotation">Carbon dioxide</text>
                          <line x1="90" y1="74" x2="120" y2="78" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 2" />
                          <polygon points="120,78 114,75 114,81" fill="#475569" />

                          {/* Oxygen Arrow */}
                          <text x="210" y="74" className="svg-annotation">Oxygen</text>
                          <line x1="168" y1="78" x2="198" y2="74" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 2" />
                          <polygon points="198,74 192,71 192,77" fill="#475569" />

                          {/* Plant Stem and Leaves */}
                          <path d="M 145 68 Q 146 95 145 118" stroke="#15803d" strokeWidth="2.5" fill="none" />
                          {/* Left Leaf */}
                          <path d="M 145 82 Q 120 72 122 88 Q 135 92 145 88" fill="#86efac" stroke="#15803d" strokeWidth="1.2" />
                          {/* Right Leaf */}
                          <path d="M 145 80 Q 170 70 168 86 Q 155 90 145 86" fill="#86efac" stroke="#15803d" strokeWidth="1.2" />

                          {/* Soil and Roots */}
                          <line x1="115" y1="118" x2="175" y2="118" stroke="#78716c" strokeWidth="1.5" strokeDasharray="4 2" />
                          <path d="M 145 118 Q 138 132 132 138" stroke="#78716c" strokeWidth="1.2" fill="none" />
                          <path d="M 145 118 Q 148 130 152 137" stroke="#78716c" strokeWidth="1.2" fill="none" />
                          <path d="M 145 118 L 145 136" stroke="#78716c" strokeWidth="1.2" fill="none" />
                          <text x="180" y="128" className="svg-annotation">Water</text>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Q2 Answer Block with Active Glowing Bounding Box */}
                  <div
                    className={`handwritten-block q2-block ${activeQuestionId === "q2" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q2"
                    onClick={() => selectQuestionFromCanvas("q2")}
                  >
                    <div className="green-bounding-box-badge">Q2</div>
                    <span className="handwritten-label">Q2.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        The process mainly occurs in the chloroplast of the plant cell. It has two main stages:
                      </p>
                      <ol className="handwritten-list">
                        <li>
                          <strong>1. Light reaction</strong> – Captures light energy.
                        </li>
                        <li>
                          <strong>2. Dark reaction</strong> – Uses energy to make glucose.
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Bottom Q1 Continuation Box */}
                  <div
                    className={`handwritten-block q1-bottom-block ${activeQuestionId === "q1" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q1"
                    onClick={() => selectQuestionFromCanvas("q1")}
                  >
                    <div className="green-bounding-box-badge">Q1</div>
                    <span className="handwritten-label">Q1.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        Photosynthesis is the process used by green plants and some other organisms to convert light energy into chemical energy.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentPage === 2 && (
                <>
                  {/* Q3 Answer Block */}
                  <div
                    className={`handwritten-block ${activeQuestionId === "q3" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q3"
                    onClick={() => selectQuestionFromCanvas("q3")}
                  >
                    <div className="green-bounding-box-badge">Q3</div>
                    <span className="handwritten-label">Q3.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        Chloroplasts contain chlorophyll pigment in thylakoid membranes that absorbs solar photons.
                        <br />
                        Stage 1 (Light Dependent): In thylakoids, photolysis of water produces ATP and NADPH with O<sub>2</sub> release.
                        <br />
                        Stage 2 (Calvin Cycle / Dark Reaction): In the stroma, CO<sub>2</sub> is enzymatically fixed into glucose utilizing ATP & NADPH.
                      </p>
                    </div>
                  </div>

                  {/* Q4 Skipped Notice */}
                  <div
                    className={`handwritten-block skipped-block ${activeQuestionId === "q4" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q4"
                    onClick={() => selectQuestionFromCanvas("q4")}
                  >
                    <span className="handwritten-label">Q4.</span>
                    <div className="handwritten-body">
                      <span className="skipped-handwritten-note">[Unattempted / Skipped by Student]</span>
                    </div>
                  </div>

                  {/* Q5 Alveolus Answer Block */}
                  <div
                    className={`handwritten-block ${activeQuestionId === "q5" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q5"
                    onClick={() => selectQuestionFromCanvas("q5")}
                  >
                    <div className="green-bounding-box-badge">Q5</div>
                    <span className="handwritten-label">Q5.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        Alveolar gas exchange diagram: Thin respiratory membrane between alveolar wall and pulmonary capillaries facilitates O<sub>2</sub> intake and CO<sub>2</sub> release.
                      </p>
                      <div className="alveolus-diagram-placeholder">
                        <span className="diagram-tag">Alveolar Sac (O<sub>2</sub> in, CO<sub>2</sub> out) • Pulmonary Capillaries</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {currentPage === 3 && (
                <>
                  {/* Q6 Digestive System */}
                  <div
                    className={`handwritten-block ${activeQuestionId === "q6" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q6"
                    onClick={() => selectQuestionFromCanvas("q6")}
                  >
                    <div className="green-bounding-box-badge">Q6</div>
                    <span className="handwritten-label">Q6.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        Human Digestive System: Food travels through Oesophagus ➔ Stomach (pepsin/HCl digestion) ➔ Small Intestine (Site of maximum absorption via villi) ➔ Large Intestine.
                      </p>
                    </div>
                  </div>

                  {/* Q7 Nephron */}
                  <div
                    className={`handwritten-block ${activeQuestionId === "q7" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q7"
                    onClick={() => selectQuestionFromCanvas("q7")}
                  >
                    <div className="green-bounding-box-badge">Q7</div>
                    <span className="handwritten-label">Q7.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        Structure of Nephron:
                        1. Bowman&apos;s Capsule enclosing Glomerulus (Ultrafiltration)
                        2. Proximal Convoluted Tubule (Selective reabsorption of glucose, amino acids)
                        3. Loop of Henle (Osmoregulation)
                        4. Distal Convoluted Tubule & Collecting Duct (Urine concentration).
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentPage === 4 && (
                <>
                  {/* Q8 Palisade vs Spongy Mesophyll */}
                  <div
                    className={`handwritten-block ${activeQuestionId === "q8" ? "target-bounding-box-active" : ""}`}
                    data-question-id="q8"
                    onClick={() => selectQuestionFromCanvas("q8")}
                  >
                    <div className="green-bounding-box-badge">Q8</div>
                    <span className="handwritten-label">Q8.</span>
                    <div className="handwritten-body">
                      <p className="handwritten-paragraph">
                        <strong>Palisade Mesophyll:</strong> Elongated, vertically aligned cells located just below the upper epidermis with high chloroplast density to trap maximum sunlight.
                        <br /><br />
                        <strong>Spongy Mesophyll:</strong> Loosely arranged rounded cells with large intercellular air spaces to facilitate rapid gas exchange (CO<sub>2</sub>/O<sub>2</sub>) between stomata and photosynthetic cells.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
