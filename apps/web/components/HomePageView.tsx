"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Layers,
  ScrollText,
  Settings,
  Sparkles,
  Upload,
  Users
} from "lucide-react";
import { ExamUploadStudio } from "./ExamUploadStudio";

export function HomePageView() {
  const [activeTab, setActiveTab] = useState<"studio" | "tools">("studio");

  return (
    <div className="home-dashboard-container">
      {/* Top Tab Switcher */}
      <div className="home-tabs-bar">
        <button
          type="button"
          className={`home-tab-btn ${activeTab === "studio" ? "active" : ""}`}
          onClick={() => setActiveTab("studio")}
        >
          <Upload size={16} />
          <span>Upload & Mapping Studio</span>
        </button>

        <button
          type="button"
          className={`home-tab-btn ${activeTab === "tools" ? "active" : ""}`}
          onClick={() => setActiveTab("tools")}
        >
          <Sparkles size={16} />
          <span>AI Tools Suite</span>
        </button>
      </div>

      {activeTab === "studio" ? (
        <div className="studio-tab-content">
          <ExamUploadStudio />

          {/* Quick Tools Access Strip Below Studio */}
          <div className="quick-tools-strip">
            <h3 className="quick-tools-title">Platform Tools</h3>
            <div className="quick-tools-grid">
              <Link className="quick-tool-card" href="/assignments/new">
                <div className="quick-tool-icon orange">
                  <FileText size={18} />
                </div>
                <div className="quick-tool-info">
                  <strong>Create Exam Paper</strong>
                  <span>CBSE & ICSE blueprint paper generator</span>
                </div>
                <ArrowRight size={15} className="quick-tool-arrow" />
              </Link>

              <Link className="quick-tool-card" href="/toolkit">
                <div className="quick-tool-icon purple">
                  <Sparkles size={18} />
                </div>
                <div className="quick-tool-info">
                  <strong>AI Teacher&apos;s Toolkit</strong>
                  <span>Automated rubrics & formula formatter</span>
                </div>
                <ArrowRight size={15} className="quick-tool-arrow" />
              </Link>

              <Link className="quick-tool-card" href="/groups">
                <div className="quick-tool-icon green">
                  <Users size={18} />
                </div>
                <div className="quick-tool-info">
                  <strong>My Classroom</strong>
                  <span>Batch answer sheets & grade records</span>
                </div>
                <ArrowRight size={15} className="quick-tool-arrow" />
              </Link>

              <Link className="quick-tool-card" href="/library">
                <div className="quick-tool-icon blue">
                  <BookOpen size={18} />
                </div>
                <div className="quick-tool-info">
                  <strong>My Library</strong>
                  <span>Question banks & past assessments</span>
                </div>
                <ArrowRight size={15} className="quick-tool-arrow" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Tools Suite Directory */
        <div className="tools-suite-directory">
          <div className="tools-suite-header">
            <h2>VedaAI Teacher Tools</h2>
            <p>Select a tool to launch and streamline your academic workflow.</p>
          </div>

          <div className="tools-suite-grid">
            <div className="tool-suite-card primary-highlight">
              <div className="tool-suite-icon orange">
                <Upload size={24} />
              </div>
              <div className="tool-suite-details">
                <h3>Assessment Extraction & Mapping Studio</h3>
                <p>
                  Upload Question Papers and Student Answer Sheets to extract questions in printed order, transcribe handwritten responses, and generate rubric-backed evaluations with Groq.
                </p>
                <button
                  type="button"
                  className="primary-pill-compact"
                  onClick={() => setActiveTab("studio")}
                >
                  <span>Open Mapping Studio</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className="tool-suite-card">
              <div className="tool-suite-icon blue">
                <FileText size={24} />
              </div>
              <div className="tool-suite-details">
                <h3>CBSE & ICSE Question Paper Generator</h3>
                <p>
                  Create balanced examination papers with question type distribution, difficulty breakdown (Easy / Moderate / Hard), detailed answer keys, and vector PDF exports.
                </p>
                <Link className="secondary-pill-compact" href="/assignments/new">
                  <span>Create Question Paper</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="tool-suite-card">
              <div className="tool-suite-icon purple">
                <Sparkles size={24} />
              </div>
              <div className="tool-suite-details">
                <h3>AI Teacher&apos;s Toolkit</h3>
                <p>
                  Generate subjective grading rubrics with step-wise point distribution, LaTeX equations, and pedagogy accelerators.
                </p>
                <Link className="secondary-pill-compact" href="/toolkit">
                  <span>Open Toolkit</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="tool-suite-card">
              <div className="tool-suite-icon green">
                <Users size={24} />
              </div>
              <div className="tool-suite-details">
                <h3>My Classroom & Student Roster</h3>
                <p>
                  Manage class batches, track student submission statuses, view average scores, and inspect individual answer sheet mappings.
                </p>
                <Link className="secondary-pill-compact" href="/groups">
                  <span>Open Classroom</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="tool-suite-card">
              <div className="tool-suite-icon orange">
                <BookOpen size={24} />
              </div>
              <div className="tool-suite-details">
                <h3>Exam Library & Archives</h3>
                <p>
                  Access your repository of created question papers, extracted assessments, and exported answer keys.
                </p>
                <Link className="secondary-pill-compact" href="/library">
                  <span>Open Library</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="tool-suite-card">
              <div className="tool-suite-icon dark">
                <Settings size={24} />
              </div>
              <div className="tool-suite-details">
                <h3>System Settings & Groq API Config</h3>
                <p>
                  Configure your Groq API key, default AI evaluation models, school affiliation details, and grading strictness.
                </p>
                <Link className="secondary-pill-compact" href="/settings">
                  <span>Open Settings</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
