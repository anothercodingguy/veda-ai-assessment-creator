"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  Key,
  Save,
  School,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  User
} from "lucide-react";
import { AppShell } from "../../components/AppShell";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
  const [schoolName, setSchoolName] = useState("Delhi Public School");
  const [branch, setBranch] = useState("Bokaro Steel City");
  const [board, setBoard] = useState("CBSE (Central Board of Secondary Education)");
  const [gradingBias, setGradingBias] = useState("Standard (Balanced Rubric)");
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("veda_groq_api_key") || "";
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && apiKey) {
      localStorage.setItem("veda_groq_api_key", apiKey.trim());
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AppShell crumb="Settings" active="home">
      <div className="settings-page-container">
        <div className="settings-hero-card">
          <div className="settings-tag-pill">
            <Settings size={13} />
            <span>Teacher Preferences & System Configuration</span>
          </div>
          <h1>Platform Settings</h1>
          <p>Configure your AI provider keys, school affiliation details, and default grading preferences.</p>
        </div>

        <form onSubmit={handleSave} className="settings-form-grid">
          {/* Section 1: Teacher Profile & School */}
          <div className="settings-card">
            <div className="settings-card-header">
              <User size={18} />
              <h2>Teacher & School Profile</h2>
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Teacher Name</label>
              <input
                type="text"
                defaultValue="Madhur Rastogi"
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Email Address</label>
              <input
                type="email"
                defaultValue="madhur.rastogi@dps.edu.in"
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-label">School Affiliation</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Campus / Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="settings-input"
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Examination Board</label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                className="settings-select"
              >
                <option>CBSE (Central Board of Secondary Education)</option>
                <option>ICSE (Indian Certificate of Secondary Education)</option>
                <option>State Board / International</option>
              </select>
            </div>
          </div>

          {/* Section 2: AI Model & API Keys */}
          <div className="settings-card">
            <div className="settings-card-header">
              <Key size={18} />
              <h2>AI Extraction & Vision Provider</h2>
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Primary AI LLM & Vision Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="settings-select"
              >
                <option value="llama-3.3-70b-versatile">Groq: Llama 3.3 70B Versatile (Fastest)</option>
                <option value="gpt-4o">OpenAI: GPT-4o (Vision Multimodal)</option>
                <option value="claude-3-7-sonnet">Anthropic: Claude 3.7 Sonnet</option>
              </select>
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Groq API Key (Optional Override)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="settings-input"
                placeholder="gsk_..."
              />
              <small className="settings-hint">System uses environment key by default.</small>
            </div>

            <div className="settings-field-group">
              <label className="settings-label">Grading Evaluation Strictness</label>
              <select
                value={gradingBias}
                onChange={(e) => setGradingBias(e.target.value)}
                className="settings-select"
              >
                <option>Standard (Balanced Rubric)</option>
                <option>Lenient (Encouraging Partial Steps)</option>
                <option>Strict (Board Exam Standard Marking)</option>
              </select>
            </div>

            <div className="settings-save-row">
              <button type="submit" className="primary-pill-compact">
                <Save size={15} />
                <span>{saved ? "Preferences Saved!" : "Save Preferences"}</span>
              </button>
              {saved && (
                <span className="save-confirm-badge">
                  <CheckCircle2 size={14} /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
