"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import type { AssignmentRecord } from "@veda/shared";
import { formatDate } from "../lib/format";
import { useAssignmentStore } from "../store/assignment-store";

export function AssignmentCard({ assignment }: { assignment: AssignmentRecord }) {
  const { deleteAssignment, saving } = useAssignmentStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${assignment.input.title}"?`)) {
      try {
        await deleteAssignment(assignment.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete assignment");
      }
    }
  };

  return (
    <article className="assignment-card" onMouseLeave={() => setIsMenuOpen(false)}>
      <div className="card-header">
        <Link href={`/assignments/${assignment.id}`}>{assignment.input.title}</Link>
        <button 
          className="dots-button" 
          aria-label="More options"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          <MoreVertical size={22} />
        </button>
      </div>
      <div className={`card-menu ${isMenuOpen ? "show" : ""}`}>
        <Link href={`/assignments/${assignment.id}`}>View Assignment</Link>
        <button onClick={handleDelete} disabled={saving}>
          Delete
        </button>
      </div>
      <div className="assignment-meta">
        <span>
          <strong>Assigned on :</strong> {formatDate(assignment.createdAt)}
        </span>
        <span>
          <strong>Due :</strong> {formatDate(assignment.input.dueDate)}
        </span>
      </div>
    </article>
  );
}

