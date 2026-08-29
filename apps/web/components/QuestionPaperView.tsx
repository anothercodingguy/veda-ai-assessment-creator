"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { formatDifficulty, type QuestionPaper } from "@veda/shared";

export function QuestionPaperView({ paper }: { paper: QuestionPaper }) {
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  return (
    <article className="paper">
      <header className="paper-header">
        <h1>{paper.schoolName}</h1>
        <h2>Subject: {paper.subject}</h2>
        <h2>Class: {paper.classLevel}</h2>
      </header>

      <div className="paper-meta-row">
        <strong>Time Allowed: {paper.timeAllowedMinutes} minutes</strong>
        <strong>Maximum Marks: {paper.maxMarks}</strong>
      </div>

      <div className="paper-instructions">
        {paper.instructions.map((instruction) => (
          <p key={instruction}>{instruction}</p>
        ))}
      </div>

      <section className="student-info">
        <p>
          <strong>Name:</strong>
          <input 
            type="text" 
            className="student-input" 
            placeholder="........................................................................" 
          />
        </p>
        <p>
          <strong>Roll Number:</strong>
          <input 
            type="text" 
            className="student-input" 
            placeholder="............................................................" 
          />
        </p>
        <p>
          <strong>Class:</strong>
          <span>{paper.classLevel}</span>
          <strong>Section:</strong>
          <input 
            type="text" 
            className="student-input" 
            style={{ flex: "0 0 100px" }} 
            placeholder="...................." 
          />
        </p>
      </section>

      {paper.sections.map((section) => (
        <section className="paper-section" key={section.title}>
          <h3>{section.title}</h3>
          <h4>{section.questionType}</h4>
          <p>{section.instruction}</p>
          <ol>
            {section.questions.map((question) => (
              <li key={question.id}>
                <span className={`difficulty-badge ${question.difficulty}`}>{formatDifficulty(question.difficulty)}</span>
                <span className="question-text">{question.text}</span>
                <span className="marks-badge">
                  {question.marks} Mark{question.marks === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <strong className="end-paper">End of Question Paper</strong>

      {paper.answerKey.length > 0 && (
        <section className="answer-key">
          <div className="answer-key-header">
            <h3>Answer Key</h3>
            <button 
              type="button"
              className="toggle-answers-btn"
              onClick={() => setShowAnswerKey(!showAnswerKey)}
            >
              {showAnswerKey ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showAnswerKey ? "Hide Answer Key" : "Show Answer Key"}</span>
            </button>
          </div>
          {showAnswerKey && (
            <ol>
              {paper.answerKey.map((item) => (
                <li key={item.questionId}>
                  <strong>{item.questionId}:</strong> {item.answer}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </article>
  );
}

