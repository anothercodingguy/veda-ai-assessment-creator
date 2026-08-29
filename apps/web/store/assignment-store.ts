"use client";

import { create } from "zustand";
import type { AssignmentEvent, AssignmentInput, AssignmentRecord } from "@veda/shared";
import { createAssignment, deleteAssignment, getAssignment, listAssignments, regenerateAssignment, WS_URL, type CreateAssignmentFiles } from "../lib/api";

const LOCAL_ASSIGNMENTS_KEY = "veda.assignments";

type AssignmentState = {
  assignments: AssignmentRecord[];
  activeAssignment?: AssignmentRecord;
  events: Record<string, AssignmentEvent>;
  loading: boolean;
  saving: boolean;
  error: string;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<AssignmentRecord | undefined>;
  createAssignment: (input: AssignmentInput, files?: CreateAssignmentFiles) => Promise<string>;
  regenerate: (id: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  subscribe: (id: string) => () => void;
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  events: {},
  loading: false,
  saving: false,
  error: "",

  fetchAssignments: async () => {
    set({ loading: true, error: "" });
    try {
      const data = await listAssignments();
      const assignments = mergeAssignments(data.assignments, loadLocalAssignments());
      persistAssignments(assignments);
      set({ assignments, loading: false });
    } catch (error) {
      const assignments = loadLocalAssignments();
      set({
        assignments,
        error: assignments.length ? "" : error instanceof Error ? error.message : "Could not load assignments",
        loading: false
      });
    }
  },

  fetchAssignment: async (id) => {
    set({ loading: true, error: "" });
    try {
      const data = await getAssignment(id);
      persistAssignments(upsertAssignment(get().assignments, data.assignment));
      set((state) => ({
        activeAssignment: data.assignment,
        assignments: upsertAssignment(state.assignments, data.assignment),
        loading: false
      }));
      return data.assignment;
    } catch (error) {
      const localAssignment = loadLocalAssignments().find((assignment) => assignment.id === id);
      set({
        activeAssignment: localAssignment,
        error: localAssignment ? "" : error instanceof Error ? error.message : "Could not load assignment",
        loading: false
      });
      return localAssignment;
    }
  },

  createAssignment: async (input, file) => {
    set({ saving: true, error: "" });
    try {
      const data = await createAssignment(input, file);
      persistAssignments(upsertAssignment(get().assignments, data.assignment));
      set((state) => ({
        assignments: upsertAssignment(state.assignments, data.assignment),
        activeAssignment: data.assignment,
        saving: false
      }));
      return data.assignmentId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not create assignment", saving: false });
      throw error;
    }
  },

  regenerate: async (id) => {
    set({ saving: true, error: "" });
    try {
      const data = await regenerateAssignment(id);
      persistAssignments(upsertAssignment(get().assignments, data.assignment));
      set((state) => ({
        assignments: upsertAssignment(state.assignments, data.assignment),
        activeAssignment: data.assignment,
        saving: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not regenerate assignment", saving: false });
    }
  },

  deleteAssignment: async (id) => {
    set({ saving: true, error: "" });
    try {
      await deleteAssignment(id);
      persistAssignments(get().assignments.filter((item) => item.id !== id));
      set((state) => ({
        assignments: state.assignments.filter((item) => item.id !== id),
        activeAssignment: state.activeAssignment?.id === id ? undefined : state.activeAssignment,
        saving: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Could not delete assignment", saving: false });
      throw error;
    }
  },

  subscribe: (id) => {
    if (!WS_URL) return () => undefined;

    const socket = new WebSocket(WS_URL);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "subscribe", assignmentId: id }));
    });
    socket.addEventListener("message", async (message) => {
      const event = JSON.parse(message.data) as AssignmentEvent;
      if (event.assignmentId !== id) return;

      set((state) => ({
        events: { ...state.events, [id]: event },
        activeAssignment:
          event.result && state.activeAssignment?.id === id
            ? { ...state.activeAssignment, status: event.status, result: event.result }
            : state.activeAssignment
      }));

      if (event.status === "completed" || event.status === "failed") {
        await get().fetchAssignment(id);
      }
    });
    return () => socket.close();
  }
}));

function upsertAssignment(assignments: AssignmentRecord[], assignment: AssignmentRecord) {
  const without = assignments.filter((item) => item.id !== assignment.id);
  return [assignment, ...without].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function mergeAssignments(primary: AssignmentRecord[], secondary: AssignmentRecord[]) {
  return secondary.reduce((assignments, assignment) => upsertAssignment(assignments, assignment), primary);
}

function loadLocalAssignments() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_ASSIGNMENTS_KEY) ?? "[]") as AssignmentRecord[];
  } catch {
    return [];
  }
}

function persistAssignments(assignments: AssignmentRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments.slice(0, 25)));
}
