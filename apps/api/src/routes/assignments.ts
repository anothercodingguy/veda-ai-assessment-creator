import { Router } from "express";
import multer from "multer";
import { assignmentInputSchema } from "@veda/shared";
import { AssignmentModel, type AssignmentDocument } from "../models/Assignment.js";
import { addGenerationJob } from "../queue.js";
import { publishAssignmentEvent } from "../services/events.js";
import { extractUploadText } from "../services/files.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export const assignmentsRouter = Router();

function toRecord(doc: AssignmentDocument | null) {
  if (!doc) return null;
  return {
    id: doc.id,
    input: doc.input,
    status: doc.status,
    result: doc.result,
    error: doc.error,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

function parseQuestionTypes(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  return JSON.parse(value);
}

const uploadFields = upload.fields([
  { name: "questionPaper", maxCount: 1 },
  { name: "answerSheet", maxCount: 1 },
  { name: "material", maxCount: 1 }
]);

assignmentsRouter.get("/", async (_req, res, next) => {
  try {
    const docs = await AssignmentModel.find().sort({ createdAt: -1 }).limit(100);
    res.json({ assignments: docs.map((doc) => toRecord(doc)) });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.post("/", uploadFields, async (req, res, next) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const qpFile = files?.questionPaper?.[0] || files?.material?.[0];
    const asFile = files?.answerSheet?.[0];

    const qpText = await extractUploadText(qpFile);
    const asText = await extractUploadText(asFile);

    const payload = {
      ...req.body,
      timeAllowedMinutes: Number(req.body.timeAllowedMinutes),
      questionTypes: parseQuestionTypes(req.body.questionTypes),
      sourceText: qpText || req.body.sourceText || "",
      uploadedFileName: qpFile?.originalname ?? req.body.uploadedFileName ?? "",
      questionPaperFileName: qpFile?.originalname ?? req.body.questionPaperFileName ?? "",
      questionPaperText: qpText,
      answerSheetFileName: asFile?.originalname ?? req.body.answerSheetFileName ?? "",
      answerSheetText: asText
    };
    const input = assignmentInputSchema.parse(payload);
    const assignment = await AssignmentModel.create({ input, status: "queued" });
    const job = await addGenerationJob(assignment.id);

    await publishAssignmentEvent({
      assignmentId: assignment.id,
      status: "queued",
      message: "Assignment queued for AI generation"
    });

    res.status(201).json({ assignmentId: assignment.id, jobId: job.id, assignment: toRecord(assignment) });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.get("/:id", async (req, res, next) => {
  try {
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json({ assignment: toRecord(assignment) });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.post("/:id/regenerate", async (req, res, next) => {
  try {
    const assignment = await AssignmentModel.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "queued" }, $unset: { result: 1, error: 1, pdf: 1 } },
      { new: true }
    );

    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const job = await addGenerationJob(assignment.id);
    await publishAssignmentEvent({
      assignmentId: assignment.id,
      status: "queued",
      message: "Regeneration queued"
    });

    res.json({ assignmentId: assignment.id, jobId: job.id, assignment: toRecord(assignment) });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const assignment = await AssignmentModel.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    if (!assignment.pdf) return res.status(202).json({ status: assignment.status, message: "PDF is not ready yet" });

    const safeTitle = assignment.input.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle || "assignment"}.pdf"`);
    res.send(assignment.pdf);
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.delete("/:id", async (req, res, next) => {
  try {
    const assignment = await AssignmentModel.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json({ ok: true, message: "Assignment deleted successfully" });
  } catch (error) {
    next(error);
  }
});

