"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  FileCheck,
  FileText,
  Search,
  Sparkles,
  Upload
} from "lucide-react";
import { AppShell } from "../../components/AppShell";

type LibraryItem = {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  questionsCount: number;
  totalMarks: number;
  type: "Extracted Assessment" | "Generated Exam Paper";
  date: string;
};

const mockLibraryItems: LibraryItem[] = [
  {
    id: "lib-1",
    title: "Class 10 Physics Unit Assessment",
    subject: "Physics",
    classLevel: "Class 10",
    questionsCount: 6,
    totalMarks: 20,
    type: "Extracted Assessment",
    date: "Aug 29, 2026"
  },
  {
    id: "lib-2",
    title: "CBSE Mathematics Mid-Term Assessment",
    subject: "Mathematics",
    classLevel: "Class 10",
    questionsCount: 15,
    totalMarks: 50,
    type: "Generated Exam Paper",
    date: "Aug 27, 2026"
  },
  {
    id: "lib-3",
    title: "Chemistry Periodic Test: Acids, Bases & Salts",
    subject: "Chemistry",
    classLevel: "Class 10",
    questionsCount: 10,
    totalMarks: 30,
    type: "Extracted Assessment",
    date: "Aug 24, 2026"
  },
  {
    id: "lib-4",
    title: "Biology Life Processes Unit Examination",
    subject: "Biology",
    classLevel: "Class 10",
    questionsCount: 12,
    totalMarks: 40,
    type: "Generated Exam Paper",
    date: "Aug 20, 2026"
  }
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");

  const filtered = mockLibraryItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "All" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <AppShell crumb="My Library" active="library">
      <div className="library-page-container">
        {/* Header Hero Banner */}
        <div className="library-hero-card">
          <div>
            <div className="library-tag-pill">
              <span>Delhi Public School • Assessment Repository</span>
            </div>
            <h1>Assessment Library & Question Bank</h1>
            <p>Access saved question papers, student answer mapping archives, and past exam blueprints.</p>
          </div>

          <div className="hero-actions-col">
            <Link className="primary-pill-compact" href="/">
              <Upload size={14} />
              <span>Map New Assessment</span>
            </Link>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="library-controls-row">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search assessment library by subject or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-chips">
            {["All", "Extracted Assessment", "Generated Exam Paper"].map((type) => (
              <button
                key={type}
                className={`filter-chip-btn ${selectedType === type ? "active" : ""}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Library Cards Grid */}
        <div className="library-cards-grid">
          {filtered.map((item) => (
            <div key={item.id} className="library-card">
              <div className="card-top-row">
                <span className={`item-type-badge ${item.type === "Extracted Assessment" ? "extracted" : "generated"}`}>
                  {item.type === "Extracted Assessment" ? <FileCheck size={12} /> : <FileText size={12} />}
                  <span>{item.type}</span>
                </span>
                <span className="card-date">{item.date}</span>
              </div>

              <h3 className="card-title">{item.title}</h3>

              <div className="card-meta-tags">
                <span className="meta-pill">{item.subject}</span>
                <span className="meta-pill">{item.classLevel}</span>
                <span className="meta-pill">{item.questionsCount} Questions</span>
                <span className="meta-pill">{item.totalMarks} Total Marks</span>
              </div>

              <div className="card-footer-actions">
                <Link className="secondary-pill-compact" href="/">
                  <Eye size={14} />
                  <span>Open Studio</span>
                </Link>
                <Link className="primary-pill-compact" href="/assignments/new">
                  <Sparkles size={14} />
                  <span>Remix</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
