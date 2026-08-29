"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, RotateCcw, Sparkles } from "lucide-react";
import { AppShell } from "../../../components/AppShell";
import { QuestionPaperView } from "../../../components/QuestionPaperView";
import { downloadQuestionPaperPdf } from "../../../lib/client-pdf";
import { useAssignmentStore } from "../../../store/assignment-store";

export default function AssignmentOutputPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { activeAssignment, events, fetchAssignment, subscribe, regenerate, loading, saving, error } = useAssignmentStore();
  const event = events[id];

  useEffect(() => {
    void fetchAssignment(id);
    const unsubscribe = subscribe(id);
    return unsubscribe;
  }, [fetchAssignment, id, subscribe]);

  const assignment = activeAssignment?.id === id ? activeAssignment : undefined;
  const paper = assignment?.result;
  const status = event?.status ?? assignment?.status;
  const teacherName = "Lakshya";

  return (
    <AppShell crumb="Create New" active="toolkit" backHref="/">
      <section className="output-view">
        <div className="ai-banner">
          <div>
            <Sparkles size={18} />
            <strong>
              {paper
                ? `Certainly, ${teacherName}! Here are customized Question Paper for your ${paper.classLevel} ${paper.subject} classes.`
                : "Preparing your customized question paper with AI."}
            </strong>
          </div>
          <div className="output-actions">
            <button className="secondary-pill" disabled={!paper} onClick={() => paper && downloadQuestionPaperPdf(paper)}>
              <Download size={17} />
              Download as PDF
            </button>
            <button className="secondary-pill dark-safe" disabled={saving} onClick={() => regenerate(id)}>
              <RotateCcw size={17} />
              Regenerate
            </button>
          </div>
        </div>

        {!paper && (
          <div className="generation-state">
            <span className="loader-ring" />
            <h1>{status === "failed" ? "Generation failed" : "Generating assignment..."}</h1>
            <p>{event?.message || assignment?.error || "The worker will update this page as soon as the paper is ready."}</p>
            {loading && <p>Loading assignment details...</p>}
            {error && <p className="form-error">{error}</p>}
          </div>
        )}

        {paper && <QuestionPaperView paper={paper} />}
      </section>
    </AppShell>
  );
}
