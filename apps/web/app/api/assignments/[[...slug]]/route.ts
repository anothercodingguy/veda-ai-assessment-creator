import { NextResponse } from "next/server";
import { assignmentInputSchema } from "@veda/shared";
import {
  createStoredAssignment,
  deleteStoredAssignment,
  getStoredAssignment,
  listStoredAssignments,
  regenerateStoredAssignment,
  stripPdf
} from "../../../../lib/server-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const slug = (await context.params).slug ?? [];

  if (slug.length === 0) {
    return NextResponse.json({ assignments: listStoredAssignments() });
  }

  const [id, action] = slug;
  const assignment = getStoredAssignment(id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  if (action === "pdf") {
    if (!assignment.pdf) {
      return NextResponse.json({ status: assignment.status, message: "PDF is not ready yet" }, { status: 202 });
    }

    const safeTitle = assignment.input.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return new NextResponse(new Uint8Array(assignment.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle || "assignment"}.pdf"`
      }
    });
  }

  return NextResponse.json({ assignment: stripPdf(assignment) });
}

export async function POST(request: Request, context: RouteContext) {
  const slug = (await context.params).slug ?? [];

  if (slug.length === 2 && slug[1] === "regenerate") {
    const assignment = await regenerateStoredAssignment(slug[0]);
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    return NextResponse.json({
      assignmentId: assignment.id,
      jobId: `vercel:${assignment.id}`,
      assignment: stripPdf(assignment)
    });
  }

  if (slug.length > 0) {
    return NextResponse.json({ error: "Unsupported assignment action" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const material = formData.get("material");
    const qpFile = formData.get("questionPaper") || material;
    const asFile = formData.get("answerSheet");

    const qpText =
      qpFile instanceof File && (qpFile.type === "text/plain" || qpFile.name.endsWith(".txt"))
        ? (await qpFile.text()).slice(0, 24000)
        : "";
    const asText =
      asFile instanceof File && (asFile.type === "text/plain" || asFile.name.endsWith(".txt"))
        ? (await asFile.text()).slice(0, 24000)
        : "";

    const input = assignmentInputSchema.parse({
      title: formData.get("title"),
      schoolName: formData.get("schoolName"),
      subject: formData.get("subject"),
      classLevel: formData.get("classLevel"),
      timeAllowedMinutes: formData.get("timeAllowedMinutes"),
      dueDate: formData.get("dueDate"),
      questionTypes: JSON.parse(String(formData.get("questionTypes") ?? "[]")),
      additionalInstructions: formData.get("additionalInstructions") ?? "",
      sourceText: qpText,
      uploadedFileName: qpFile instanceof File ? qpFile.name : "",
      questionPaperFileName: qpFile instanceof File ? qpFile.name : "",
      questionPaperText: qpText,
      answerSheetFileName: asFile instanceof File ? asFile.name : "",
      answerSheetText: asText
    });

    const assignment = await createStoredAssignment(input);
    return NextResponse.json(
      { assignmentId: assignment.id, jobId: `vercel:${assignment.id}`, assignment: stripPdf(assignment) },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const slug = (await context.params).slug ?? [];
  if (slug.length !== 1) {
    return NextResponse.json({ error: "Unsupported assignment action" }, { status: 404 });
  }

  deleteStoredAssignment(slug[0]);
  return NextResponse.json({ ok: true, message: "Assignment deleted" });
}
