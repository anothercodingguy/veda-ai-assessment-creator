"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, Upload, X } from "lucide-react";
import { TeacherIllustration } from "./TeacherIllustration";
import { ExtractingAnimationView } from "./ExtractingAnimationView";
import { MappingStudioView } from "./MappingStudioView";
import { processAssessmentExtraction } from "../lib/extraction-service";
import { type AssessmentExtractionPayload } from "@veda/shared";

type ViewState = "upload" | "extracting" | "studio";

type FileMeta = {
  file: File;
  name: string;
  sizeText: string;
  pagesText: string;
};

export function ExamUploadStudio() {
  const [viewState, setViewState] = useState<ViewState>("upload");
  const [qpFile, setQpFile] = useState<FileMeta | null>(null);
  const [asFile, setAsFile] = useState<FileMeta | null>(null);
  const [isDraggingQP, setIsDraggingQP] = useState(false);
  const [isDraggingAS, setIsDraggingAS] = useState(false);
  const [extractStage, setExtractStage] = useState<string>("Initializing extraction pipeline...");
  const [extractPercent, setExtractPercent] = useState<number>(15);
  const [extractionPayload, setExtractionPayload] = useState<AssessmentExtractionPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleSelectQP = (file: File | null) => {
    if (!file) {
      setQpFile(null);
      return;
    }
    setQpFile({
      file,
      name: file.name,
      sizeText: formatFileSize(file.size),
      pagesText: file.name.toLowerCase().includes("math") ? "2 Pages" : "2 Pages"
    });
    setErrorMsg("");
  };

  const handleSelectAS = (file: File | null) => {
    if (!file) {
      setAsFile(null);
      return;
    }
    setAsFile({
      file,
      name: file.name,
      sizeText: formatFileSize(file.size),
      pagesText: "2 Pages"
    });
    setErrorMsg("");
  };

  // Quick Demo Preload
  const handleLoadSample = () => {
    const mockQP = new File(["Class 10 Physics Unit Assessment Questions"], "Class_10_physics_unit_test.pdf", {
      type: "application/pdf"
    });
    const mockAS = new File(["Student handwritten solution sheet answers"], "student_1_answer_sheet.pdf", {
      type: "application/pdf"
    });
    setQpFile({
      file: mockQP,
      name: "Class_10_physics_unit_test.pdf",
      sizeText: "2.4MB",
      pagesText: "2 Pages"
    });
    setAsFile({
      file: mockAS,
      name: "student_1_answer_sheet.pdf",
      sizeText: "8.1MB",
      pagesText: "2 Pages"
    });
    setErrorMsg("");
  };

  const handleStartMapping = async () => {
    if (!qpFile || !asFile) return;

    setViewState("extracting");
    setErrorMsg("");

    try {
      const payload = await processAssessmentExtraction(
        qpFile.file,
        asFile.file,
        (stage, percent) => {
          setExtractStage(stage);
          setExtractPercent(percent);
        }
      );
      setExtractionPayload(payload);
      setViewState("studio");
    } catch (err) {
      console.error("Extraction error:", err);
      setErrorMsg("Failed to complete extraction. Please check the uploaded files.");
      setViewState("upload");
    }
  };

  if (viewState === "extracting") {
    return <ExtractingAnimationView stage={extractStage} percent={extractPercent} />;
  }

  if (viewState === "studio" && extractionPayload) {
    return (
      <MappingStudioView
        data={extractionPayload}
        questionPaperName={qpFile?.name || "Class_10_physics_unit_test.pdf"}
        answerSheetName={asFile?.name || "student_1_answer_sheet.pdf"}
        onReset={() => {
          setViewState("upload");
          setQpFile(null);
          setAsFile(null);
          setExtractionPayload(null);
        }}
      />
    );
  }

  const isBothSelected = Boolean(qpFile && asFile);

  return (
    <section className="exam-upload-container">
      {/* Main Heading with Orange Pill Highlight */}
      <div className="exam-heading-wrapper">
        <h1 className="exam-main-title">
          Upload <span className="title-orange-pill">Question Paper & Answer Sheets</span>
        </h1>
        <p className="exam-main-subtitle">Upload both files to get started</p>
      </div>

      {/* Teacher Orbital Graphic */}
      <TeacherIllustration />

      {/* Dual Upload Dropzone Cards */}
      <div className="exam-dual-dropzone-grid">
        {/* Dropzone 1: Question Paper */}
        <div
          className={`exam-dropzone-box ${isDraggingQP ? "is-dragging" : ""} ${qpFile ? "has-selected-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingQP(true);
          }}
          onDragLeave={() => setIsDraggingQP(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingQP(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleSelectQP(file);
          }}
        >
          <input
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            id="qp-file-input"
            className="hidden-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectQP(file);
            }}
          />

          {!qpFile ? (
            <label htmlFor="qp-file-input" className="dropzone-empty-state">
              <div className="upload-icon-badge">
                <Upload size={22} strokeWidth={2.2} />
              </div>
              <p className="dropzone-label">
                Upload <span className="label-orange">Question Paper</span>
              </p>
              <span className="dropzone-limit">Max 10MB</span>
            </label>
          ) : (
            <div className="selected-pdf-card">
              <div className="pdf-icon-red">
                <span>PDF</span>
              </div>
              <div className="pdf-info-meta">
                <strong className="pdf-filename" title={qpFile.name}>
                  {qpFile.name}
                </strong>
                <span className="pdf-filesize">
                  {qpFile.sizeText} • {qpFile.pagesText}
                </span>
              </div>
              <button
                type="button"
                className="pdf-remove-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectQP(null);
                }}
                aria-label="Remove Question Paper"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Dropzone 2: Answer Sheet */}
        <div
          className={`exam-dropzone-box ${isDraggingAS ? "is-dragging" : ""} ${asFile ? "has-selected-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingAS(true);
          }}
          onDragLeave={() => setIsDraggingAS(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingAS(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleSelectAS(file);
          }}
        >
          <input
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            id="as-file-input"
            className="hidden-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectAS(file);
            }}
          />

          {!asFile ? (
            <label htmlFor="as-file-input" className="dropzone-empty-state">
              <div className="upload-icon-badge">
                <Upload size={22} strokeWidth={2.2} />
              </div>
              <p className="dropzone-label">
                Upload <span className="label-orange">Answer Sheet</span>
              </p>
              <span className="dropzone-limit">Max 10MB</span>
            </label>
          ) : (
            <div className="selected-pdf-card">
              <div className="pdf-icon-red">
                <span>PDF</span>
              </div>
              <div className="pdf-info-meta">
                <strong className="pdf-filename" title={asFile.name}>
                  {asFile.name}
                </strong>
                <span className="pdf-filesize">
                  {asFile.sizeText} • {asFile.pagesText}
                </span>
              </div>
              <button
                type="button"
                className="pdf-remove-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectAS(null);
                }}
                aria-label="Remove Answer Sheet"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Button: Start Mapping */}
      <div className="mapping-action-wrapper">
        <button
          type="button"
          disabled={!isBothSelected}
          className={`start-mapping-btn ${isBothSelected ? "active" : "disabled"}`}
          onClick={handleStartMapping}
        >
          <span>Start Mapping</span>
          <ArrowRight size={18} />
        </button>

        <p className="mapping-hint-text">
          Once both files are uploaded, you&apos;ll able to map answers with questions
        </p>

        {/* Sample files quick-test shortcut */}
        <button
          type="button"
          className="sample-preload-btn"
          onClick={handleLoadSample}
        >
          <Sparkles size={13} />
          <span>Load sample Question Paper & Answer Sheet (Quick Test)</span>
        </button>

        {errorMsg && <p className="form-error">{errorMsg}</p>}
      </div>
    </section>
  );
}
