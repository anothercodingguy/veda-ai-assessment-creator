import { formatDifficulty, type QuestionPaper } from "@veda/shared";

export function downloadQuestionPaperPdf(paper: QuestionPaper) {
  const blob = new Blob([createSimplePdf(collectLines(paper))], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${paper.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "assignment"}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function collectLines(paper: QuestionPaper) {
  const lines = [
    paper.schoolName,
    `Subject: ${paper.subject}`,
    `Class: ${paper.classLevel}`,
    "",
    `Time Allowed: ${paper.timeAllowedMinutes} minutes`,
    `Maximum Marks: ${paper.maxMarks}`,
    "",
    ...paper.instructions,
    "",
    "Name: ______________________________",
    "Roll Number: ________________________",
    `Class: ${paper.classLevel} Section: ____________`,
    ""
  ];

  paper.sections.forEach((section) => {
    lines.push(section.title, section.questionType, section.instruction);
    section.questions.forEach((question, index) => {
      lines.push(
        `${index + 1}. [${formatDifficulty(question.difficulty)}] ${question.text} [${question.marks} Mark${
          question.marks === 1 ? "" : "s"
        }]`
      );
    });
    lines.push("");
  });

  lines.push("End of Question Paper", "", "Answer Key:");
  paper.answerKey.forEach((item, index) => lines.push(`${index + 1}. ${item.answer}`));
  return lines.flatMap(wrapLine);
}

function wrapLine(line: string) {
  if (line.length <= 92) return [line];
  const words = line.split(" ");
  const wrapped: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > 92) {
      wrapped.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
}

function createSimplePdf(lines: string[]) {
  const pageLines = chunk(lines, 46);
  const objects: string[] = [];
  const pageObjectNumbers: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("PAGES_PLACEHOLDER");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pageLines.forEach((page) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = pageObjectNumber + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    const content = ["BT", "/F1 10 Tf", "50 792 Td", "14 TL", ...page.map((line) => `(${escapePdfText(line)}) Tj T*`), "ET"].join("\n");
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "");
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks.length ? chunks : [[]];
}
