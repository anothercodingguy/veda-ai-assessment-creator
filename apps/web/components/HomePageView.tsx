"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  Layers,
  RotateCcw,
  ScrollText,
  Sparkles,
  Upload,
  Users
} from "lucide-react";
import { ExamUploadStudio } from "./ExamUploadStudio";
import { TeacherIllustration } from "./TeacherIllustration";

export function HomePageView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "studio">("overview");

  return (
    <div className="home-dashboard-container">
      {/* Top Tab Switcher */}
      <div className="home-tabs-bar">
        <button
          className={`home-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <Sparkles size={16} />
          <span>Platform Overview & Features</span>
        </button>

        <button
          className={`home-tab-btn ${activeTab === "studio" ? "active" : ""}`}
          onClick={() => setActiveTab("studio")}
        >
          <ScrollText size={16} />
          <span>Exams Upload & Mapping Studio</span>
        </button>
      </div>

      {activeTab === "studio" ? (
        <ExamUploadStudio />
      ) : (
        <section className="overview-content">
          {/* Hero Banner */}
          <div className="hero-feature-card">
            <div className="hero-content-left">
              <div className="hero-badge">
                <Sparkles size={14} />
                <span>Next-Gen AI Assessment Intelligence • DPS Bokaro</span>
              </div>

              <h1 className="hero-main-title">
                AI Assessment Extraction & <span className="highlight-text-pill">Answer Mapping</span> Studio
              </h1>

              <p className="hero-description">
                Extract questions in printed order, transcribe handwritten student answers,
                highlight exact answer regions with <strong>interactive green bounding boxes</strong>,
                and generate instant rubric-backed grading.
              </p>

              {/* Quick Action Buttons */}
              <div className="hero-actions-row">
                <button
                  className="primary-hero-btn"
                  onClick={() => setActiveTab("studio")}
                >
                  <Upload size={17} />
                  <span>Open Upload & Mapping Studio</span>
                  <ArrowRight size={16} />
                </button>




                <Link className="ghost-hero-btn" href="/assignments/new">
                  <FileText size={16} />
                  <span>Create Question Paper</span>
                </Link>
              </div>
            </div>

            <div className="hero-graphic-right">
              <TeacherIllustration />
            </div>
          </div>

          {/* Key Metrics / Highlights Strip */}
          <div className="system-metrics-grid">
            <div className="metric-box">
              <div className="metric-icon-box orange">
                <Layers size={18} />
              </div>
              <div>
                <strong>Sub-Part Splitting</strong>
                <span>11 (a) & 11 (b) treated as separate entries</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-box green">
                <Eye size={18} />
              </div>
              <div>
                <strong>Visual Bounding Box</strong>
                <span>Interactive green highlighter overlay</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-box purple">
                <RotateCcw size={18} />
              </div>
              <div>
                <strong>Out-of-Order Engine</strong>
                <span>Auto-matches answers written out of sequence</span>
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-icon-box blue">
                <Award size={18} />
              </div>
              <div>
                <strong>AI Rubric Grading</strong>
                <span>Question-by-question scoring & feedback</span>
              </div>
            </div>
          </div>

          {/* Feature Showcase Grid */}
          <div className="features-section-header">
            <div>
              <h2>All Assessment Intelligence Features</h2>
              <p>Everything built into VedaAI to automate exam evaluation and question extraction.</p>
            </div>
          </div>

          <div className="features-showcase-grid">
            {/* Feature 1: Dual Upload */}
            <div className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper orange">
                  <Upload size={22} />
                </div>
                <span className="feature-status-pill">Active</span>
              </div>
              <h3>Dual Upload Pipeline</h3>
              <p>
                Upload both the <strong>Question Paper</strong> and <strong>Student Handwritten Answer Sheet</strong> in PDF or image formats (up to 10MB each) with live OCR progress tracking.
              </p>
              <button
                className="feature-action-link"
                onClick={() => setActiveTab("studio")}
              >
                <span>Launch Dual Upload Studio</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Feature 2: Sub-Part Splitting */}
            <div className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper purple">
                  <Layers size={22} />
                </div>
                <span className="feature-status-pill">Requirement #2</span>
              </div>
              <h3>Sub-Part Splitting & Order</h3>
              <p>
                Extracts questions in the exact printed order while automatically identifying labelled sub-parts like <code>11 (a)</code> and <code>11 (b)</code> as independent selectable entries.
              </p>
              <button
                className="feature-action-link"
                onClick={() => setActiveTab("studio")}
              >
                <span>Inspect Sub-Parts (11a & 11b)</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Feature 3: Visual Bounding-Box Highlighter */}
            <div className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper green">
                  <Eye size={22} />
                </div>
                <span className="feature-status-pill">Interactive</span>
              </div>
              <h3>Visual Bounding Box Highlighter</h3>
              <p>
                Click any question to pan to the student answer sheet canvas and draw <strong>glowing green bounding box highlights</strong> over the mapped response region.
              </p>
              <button
                className="feature-action-link"
                onClick={() => setActiveTab("studio")}
              >
                <span>View Bounding-Box Studio</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Feature 4: Multi-Page & Out-of-Order */}
            <div className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper red">
                  <RotateCcw size={22} />
                </div>
                <span className="feature-status-pill">AI Mapping</span>
              </div>
              <h3>Multi-Page Spans & Out-of-Order</h3>
              <p>
                Handles multi-page answer spans (e.g. <code>Q11 (b)</code> spanning Page 1 and 2), questions answered out of order (Q3 before Q2), and unattempted/skipped questions.
              </p>
              <button
                className="feature-action-link"
                onClick={() => setActiveTab("studio")}
              >
                <span>Test Multi-Page Mapping</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Feature 5: AI Grading & Diagnostic Feedback */}
            <div className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper gold">
                  <Sparkles size={22} />
                </div>
                <span className="feature-status-pill">Evaluation</span>
              </div>
              <h3>AI Grading & Rubric Scoring</h3>
              <p>
                Generates instant step-by-step scoring, diagnostic feedback highlighting missing conditions, and interactive teacher mark adjusters with total recalculation.
              </p>
              <button
                className="feature-action-link"
                onClick={() => setActiveTab("studio")}
              >
                <span>Review Grading Inspector</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Feature 6: Question Paper Generator */}
            <div className="feature-card">
              <div className="feature-card-header">
                <div className="feature-icon-wrapper blue">
                  <FileText size={22} />
                </div>
                <span className="feature-status-pill">Creator</span>
              </div>
              <h3>CBSE & ICSE Paper Generator</h3>
              <p>
                Create standard exam papers with blueprints, difficulty breakdown (Easy / Moderate / Hard), detailed answer keys, and vector PDF exports.
              </p>
              <Link className="feature-action-link" href="/assignments/new">
                <span>Create New Exam Paper</span>
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>

          {/* Teacher Toolkit & Classroom Quick Access */}
          <div className="bottom-shortcuts-grid">
            <div className="shortcut-card classroom-shortcut">
              <div className="shortcut-text">
                <Users size={22} className="shortcut-icon" />
                <div>
                  <strong>Delhi Public School Classroom Roster</strong>
                  <p>Manage student batches, imported answer sheets, and grade records.</p>
                </div>
              </div>
              <Link className="secondary-pill-compact" href="/groups">
                <span>Open Classroom</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="shortcut-card toolkit-shortcut">
              <div className="shortcut-text">
                <BookOpen size={22} className="shortcut-icon" />
                <div>
                  <strong>AI Teacher&apos;s Toolkit</strong>
                  <p>Access automated rubric builders, LaTeX converters, and difficulty estimators.</p>
                </div>
              </div>
              <Link className="secondary-pill-compact" href="/toolkit">
                <span>Open Toolkit</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
