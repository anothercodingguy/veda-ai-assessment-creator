import PDFDocument from "pdfkit";
import { formatDifficulty, type QuestionPaper } from "@veda/shared";

export function renderQuestionPaperPdf(paper: QuestionPaper): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.font("Helvetica-Bold").fontSize(18).text(paper.schoolName, { align: "center" });
    doc.fontSize(13).text(`Subject: ${paper.subject}`, { align: "center" });
    doc.text(`Class: ${paper.classLevel}`, { align: "center" });
    doc.moveDown();
    doc.font("Helvetica").fontSize(10).text(`Time Allowed: ${paper.timeAllowedMinutes} minutes`, { continued: true });
    doc.text(`Maximum Marks: ${paper.maxMarks}`, { align: "right" });
    doc.moveDown();

    for (const instruction of paper.instructions) {
      doc.text(instruction);
    }
    doc.moveDown();

    doc.text("Name: ______________________________");
    doc.text("Roll Number: ________________________");
    doc.text(`Class: ${paper.classLevel} Section: ____________`);
    doc.moveDown();

    for (const section of paper.sections) {
      doc.font("Helvetica-Bold").fontSize(13).text(section.title, { align: "center" });
      doc.moveDown(0.6);
      doc.fontSize(11).text(section.questionType);
      doc.font("Helvetica-Oblique").fontSize(10).text(section.instruction);
      doc.moveDown(0.5);

      section.questions.forEach((question, index) => {
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(
            `${index + 1}. [${formatDifficulty(question.difficulty)}] ${question.text} [${question.marks} Mark${
              question.marks === 1 ? "" : "s"
            }]`,
            { lineGap: 5 }
          );
      });
      doc.moveDown();
    }

    doc.font("Helvetica-Bold").text("End of Question Paper");
    doc.moveDown(2);
    doc.text("Answer Key:");
    doc.moveDown(0.4);
    paper.answerKey.forEach((item, index) => {
      doc.font("Helvetica").fontSize(9).text(`${index + 1}. ${item.answer}`, { lineGap: 4 });
    });

    doc.end();
  });
}
