"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Search,
  Upload,
  Users
} from "lucide-react";
import { AppShell } from "../../components/AppShell";

type StudentRecord = {
  id: string;
  rollNo: string;
  name: string;
  section: string;
  status: "Mapped & Graded" | "Mapped (Pending Review)" | "Upload Pending";
  score: string;
  percentage: string;
  answeredCount: string;
  submissionDate: string;
};

const mockStudents: StudentRecord[] = [
  {
    id: "s1",
    rollNo: "10-A-01",
    name: "Aarav Sharma",
    section: "Class 10-A",
    status: "Mapped & Graded",
    score: "16 / 20",
    percentage: "80%",
    answeredCount: "5 / 6 Questions",
    submissionDate: "Today, 10:30 AM"
  },
  {
    id: "s2",
    rollNo: "10-A-02",
    name: "Ananya Iyer",
    section: "Class 10-A",
    status: "Mapped & Graded",
    score: "19 / 20",
    percentage: "95%",
    answeredCount: "6 / 6 Questions",
    submissionDate: "Today, 11:15 AM"
  },
  {
    id: "s3",
    rollNo: "10-A-03",
    name: "Rohan Verma",
    section: "Class 10-A",
    status: "Mapped (Pending Review)",
    score: "14 / 20",
    percentage: "70%",
    answeredCount: "5 / 6 Questions",
    submissionDate: "Today, 11:45 AM"
  },
  {
    id: "s4",
    rollNo: "10-A-04",
    name: "Priya Nair",
    section: "Class 10-A",
    status: "Mapped & Graded",
    score: "18 / 20",
    percentage: "90%",
    answeredCount: "6 / 6 Questions",
    submissionDate: "Today, 12:00 PM"
  },
  {
    id: "s5",
    rollNo: "10-A-05",
    name: "Vikram Malhotra",
    section: "Class 10-A",
    status: "Upload Pending",
    score: "-",
    percentage: "-",
    answeredCount: "0 / 6 Questions",
    submissionDate: "Pending Upload"
  }
];

export default function ClassroomPage() {
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("All");

  const filtered = mockStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search);
    return matchesSearch;
  });

  return (
    <AppShell crumb="My Classroom" active="groups">
      <div className="classroom-page-container">
        {/* Header summary banner */}
        <div className="classroom-hero-card">
          <div className="hero-text-col">
            <div className="school-tag-pill">
              <span>Delhi Public School • Bokaro Steel City</span>
            </div>
            <h1>Class 10 Physics Assessment Batch</h1>
            <p>
              Unit Test 1: Electricity & Circuits • <strong>32 Enrolled Students</strong> • 4 Answer Sheets Mapped & Evaluated
            </p>
          </div>

          <div className="hero-actions-col">
            <Link className="primary-pill-compact" href="/">
              <Upload size={15} />
              <span>Upload New Answer Sheet</span>
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="classroom-stats-grid">
          <div className="classroom-stat-card">
            <span className="c-stat-num">32</span>
            <span className="c-stat-label">Total Students</span>
          </div>
          <div className="classroom-stat-card">
            <span className="c-stat-num">84%</span>
            <span className="c-stat-label">Class Average Score</span>
          </div>
          <div className="classroom-stat-card">
            <span className="c-stat-num">4 / 5</span>
            <span className="c-stat-label">Mapped Submissions</span>
          </div>
          <div className="classroom-stat-card">
            <span className="c-stat-num">100%</span>
            <span className="c-stat-label">Sub-Part Accuracy</span>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="classroom-filter-row">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="classroom-table-wrapper">
          <table className="classroom-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Section</th>
                <th>Mapping Status</th>
                <th>Score</th>
                <th>Answered</th>
                <th>Submission Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.rollNo}</strong></td>
                  <td>
                    <div className="student-name-cell">
                      <div className="student-avatar">{s.name.charAt(0)}</div>
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td>{s.section}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        s.status === "Mapped & Graded"
                          ? "graded"
                          : s.status === "Mapped (Pending Review)"
                          ? "review"
                          : "pending"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>
                    {s.score !== "-" ? (
                      <strong>{s.score} ({s.percentage})</strong>
                    ) : (
                      <span className="muted-dash">-</span>
                    )}
                  </td>
                  <td>{s.answeredCount}</td>
                  <td><small>{s.submissionDate}</small></td>
                  <td>
                    <span className="table-view-link">
                      <span>View Highlights</span>
                      <Eye size={13} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
