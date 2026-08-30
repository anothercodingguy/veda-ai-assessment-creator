"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Copy,
  FileText,
  Layers,
  Sparkles
} from "lucide-react";
import { AppShell } from "../../components/AppShell";

export default function ToolkitPage() {
  const [questionInput, setQuestionInput] = useState(
    "Derive the expression for equivalent resistance of three resistors R1, R2, and R3 connected in series and state Ohm's law."
  );
  const [maxMarks, setMaxMarks] = useState<number>(5);
  const [generatedRubric, setGeneratedRubric] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateRubric = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedRubric(
        `### Grading Rubric for: "${questionInput.slice(0, 50)}..." (${maxMarks} Marks)\n\n` +
          `1. **Statement of Ohm's Law (1 Mark)**\n` +
          `   - Correct definition with constant temperature constraint (1.0 M)\n` +
          `   - Missing temperature condition: Award 0.5 M\n\n` +
          `2. **Circuit Diagram & Current Flow (1 Mark)**\n` +
          `   - Accurate series circuit with battery, ammeter, voltmeter, and resistors (1.0 M)\n\n` +
          `3. **Step-by-Step Derivation (2.5 Marks)**\n` +
          `   - Total potential difference: V = V1 + V2 + V3 (0.5 M)\n` +
          `   - Applying Ohm's law: V1 = IR1, V2 = IR2, V3 = IR3 (1.0 M)\n` +
          `   - Substitution: IR_eq = I(R1 + R2 + R3) (0.5 M)\n` +
          `   - Final formulation: R_eq = R1 + R2 + R3 (0.5 M)\n\n` +
          `4. **SI Unit & Conclusion (0.5 Mark)**\n` +
          `   - Correct unit (Ohm / Ω) and concluding statement.`
      );
      setIsGenerating(false);
    }, 600);
  };

  const handleCopy = () => {
    if (generatedRubric) {
      navigator.clipboard.writeText(generatedRubric);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AppShell crumb="AI Teacher's Toolkit" active="toolkit">
      <div className="toolkit-page-container">
        {/* Header Hero Banner */}
        <div className="toolkit-hero-card">
          <div className="toolkit-badge">
            <Sparkles size={14} />
            <span>AI Pedagogy & Assessment Accelerators</span>
          </div>
          <h1>AI Teacher&apos;s Toolkit</h1>
          <p>
            Automate rubric construction, format LaTeX formulas, and align question papers with CBSE & ICSE standards.
          </p>
        </div>

        {/* Toolkit Grid */}
        <div className="toolkit-main-grid">
          {/* Tool 1: Interactive Rubric Generator */}
          <div className="tool-card-box primary-tool">
            <div className="tool-card-top">
              <div className="tool-icon-wrapper orange">
                <Sparkles size={20} />
              </div>
              <div>
                <h2>Automated Subjective Marking Rubric Generator</h2>
                <span className="tool-sub-desc">Generates step-wise point distribution for question papers</span>
              </div>
            </div>

            <div className="tool-form-body">
              <label className="tool-input-label">Question Text</label>
              <textarea
                className="tool-textarea"
                rows={3}
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Enter subjective or numerical question..."
              />

              <div className="tool-meta-inputs">
                <div>
                  <label className="tool-input-label">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                    className="tool-number-input"
                  />
                </div>
                <button
                  className="primary-pill-compact"
                  onClick={handleGenerateRubric}
                  disabled={isGenerating}
                >
                  <Sparkles size={14} />
                  <span>{isGenerating ? "Generating Rubric..." : "Generate Rubric with AI"}</span>
                </button>
              </div>

              {generatedRubric && (
                <div className="generated-rubric-box">
                  <div className="rubric-header">
                    <strong>Generated Rubric Scheme</strong>
                    <button className="copy-btn" onClick={handleCopy}>
                      {copied ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                      <span>{copied ? "Copied!" : "Copy Rubric"}</span>
                    </button>
                  </div>
                  <pre className="rubric-pre">{generatedRubric}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Side Shortcuts */}
          <div className="toolkit-sidebar-col">
            {/* Shortcut 1 */}
            <div className="tool-mini-card">
              <div className="tool-icon-wrapper purple">
                <Layers size={18} />
              </div>
              <div>
                <h3>Sub-Part Splitter & Mapping</h3>
                <p>Ensure labelled sub-parts like 11(a) and 11(b) are mapped separately.</p>
                <Link className="mini-card-link" href="/">
                  <span>Open Mapping Studio</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Shortcut 2 */}
            <div className="tool-mini-card">
              <div className="tool-icon-wrapper blue">
                <FileText size={18} />
              </div>
              <div>
                <h3>CBSE Assignment Generator</h3>
                <p>Generate CBSE Class 10/12 blueprint compliant question papers with answer keys.</p>
                <Link className="mini-card-link" href="/assignments/new">
                  <span>Create Assignment</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Shortcut 3 */}
            <div className="tool-mini-card">
              <div className="tool-icon-wrapper green">
                <BookOpen size={18} />
              </div>
              <div>
                <h3>Exam Library & Archives</h3>
                <p>Access question banks, exported PDFs, and previously extracted assessments.</p>
                <Link className="mini-card-link" href="/library">
                  <span>Open Library</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
