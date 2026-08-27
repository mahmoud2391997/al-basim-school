import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";

export type EntityType = "students" | "teachers" | "employees" | "books";

export interface EntitySchema {
  label: string;
  labelAr: string;
  columns: ColumnDef[];
}

export interface ColumnDef {
  key: string;
  header: string;
  headerAr: string;
  required: boolean;
  type?: "string" | "number" | "date";
}

const SCHEMAS: Record<EntityType, EntitySchema> = {
  students: {
    label: "Students",
    labelAr: "الطلاب",
    columns: [
      { key: "fullName", header: "Full Name", headerAr: "الاسم الكامل", required: true },
      { key: "fullNameArabic", header: "Arabic Name", headerAr: "الاسم بالعربية", required: true },
      { key: "studentNumber", header: "Student No", headerAr: "رقم الطالب", required: true },
      { key: "nationalId", header: "National ID", headerAr: "الهوية الوطنية", required: true },
      { key: "grade", header: "Grade", headerAr: "الصف", required: true },
      { key: "className", header: "Class", headerAr: "الفصل", required: true },
      { key: "guardianName", header: "Guardian Name", headerAr: "اسم ولي الأمر", required: false },
      { key: "guardianPhone", header: "Guardian Phone", headerAr: "هاتف ولي الأمر", required: false },
      { key: "enrollmentDate", header: "Enrollment Date", headerAr: "تاريخ الالتحاق", required: false, type: "date" },
      { key: "status", header: "Status", headerAr: "الحالة", required: false },
    ],
  },
  teachers: {
    label: "Teachers",
    labelAr: "المعلمون",
    columns: [
      { key: "name", header: "First Name", headerAr: "الاسم الأول", required: true },
      { key: "surname", header: "Last Name", headerAr: "اسم العائلة", required: true },
      { key: "employeeCode", header: "Employee Code", headerAr: "الرقم الوظيفي", required: true },
      { key: "nationalId", header: "National ID", headerAr: "الهوية الوطنية", required: false },
      { key: "gender", header: "Gender", headerAr: "الجنس", required: false },
      { key: "nationality", header: "Nationality", headerAr: "الجنسية", required: false },
      { key: "phone", header: "Phone", headerAr: "الهاتف", required: false },
      { key: "email", header: "Email", headerAr: "البريد الإلكتروني", required: false },
      { key: "subject", header: "Subject", headerAr: "المادة", required: false },
      { key: "branch", header: "Branch", headerAr: "الفرع", required: false },
      { key: "academicLevel", header: "Academic Level", headerAr: "المستوى الدراسي", required: false },
      { key: "weeklyClasses", header: "Weekly Classes", headerAr: "الحصص الأسبوعية", required: false, type: "number" },
      { key: "status", header: "Status", headerAr: "الحالة", required: false },
    ],
  },
  employees: {
    label: "Employees",
    labelAr: "الموظفون",
    columns: [
      { key: "fullName", header: "Full Name", headerAr: "الاسم الكامل", required: true },
      { key: "fullNameArabic", header: "Arabic Name", headerAr: "الاسم بالعربية", required: true },
      { key: "employeeNumber", header: "Employee No", headerAr: "الرقم الوظيفي", required: true },
      { key: "nationalId", header: "National ID", headerAr: "الهوية الوطنية", required: true },
      { key: "jobTitle", header: "Job Title", headerAr: "المسمى الوظيفي", required: true },
      { key: "phone", header: "Phone", headerAr: "الهاتف", required: true },
      { key: "status", header: "Status", headerAr: "الحالة", required: false },
    ],
  },
  books: {
    label: "Books",
    labelAr: "الكتب",
    columns: [
      { key: "title", header: "Title", headerAr: "العنوان", required: true },
      { key: "author", header: "Author", headerAr: "المؤلف", required: false },
      { key: "isbn", header: "ISBN", headerAr: "ردمك", required: false },
      { key: "category", header: "Category", headerAr: "التصنيف", required: false },
      { key: "language", header: "Language", headerAr: "اللغة", required: false },
      { key: "volume", header: "Volume", headerAr: "المجلد", required: false },
      { key: "copies", header: "Copies", headerAr: "عدد النسخ", required: false, type: "number" },
      { key: "publicationPlace", header: "Publication Place", headerAr: "مكان النشر", required: false },
      { key: "publicationDate", header: "Publication Date", headerAr: "تاريخ النشر", required: false },
      { key: "shelf", header: "Shelf", headerAr: "الرف", required: false },
      { key: "depositNumber", header: "Deposit No", headerAr: "رقم الإيداع", required: false },
      { key: "generalNumber", header: "General No", headerAr: "الرقم العام", required: false },
    ],
  },
};

export function getSchema(type: EntityType): EntitySchema {
  return SCHEMAS[type];
}

function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

function generateFilename(type: EntityType, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${SCHEMAS[type].label.toLowerCase()}_${date}.${ext}`;
}

// ─── TEMPLATE DOWNLOAD ───────────────────────────────────────────────

export function downloadTemplate(type: EntityType) {
  const schema = SCHEMAS[type];
  const headers = schema.columns.map((c) => c.header);
  const headersAr = schema.columns.map((c) => c.headerAr);
  const required = schema.columns.map((c) => (c.required ? "Required" : "Optional"));
  const example = schema.columns.map((c) => {
    if (c.key === "status") return "active";
    if (c.key === "grade") return "Grade 8";
    if (c.key === "gender") return "male";
    if (c.key === "language") return "English";
    if (c.type === "number") return "1";
    if (c.type === "date") return "2025-01-01";
    return "";
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, headersAr, required, [], example]);
  ws["!cols"] = schema.columns.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, schema.label);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${schema.label.toLowerCase()}_template.xlsx`,
  );
}

// ─── IMPORT (PARSE + VALIDATE) ──────────────────────────────────────

export interface ImportRow {
  raw: Record<string, any>;
  errors: string[];
  index: number;
}

export interface ImportResult {
  rows: ImportRow[];
  validCount: number;
  errorCount: number;
}

export function parseImportFile(file: File, type: EntityType): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        const schema = SCHEMAS[type];
        const colMap = new Map<string, ColumnDef>();
        for (const col of schema.columns) {
          colMap.set(col.header.toLowerCase(), col);
        }
        const rows: ImportRow[] = json.map((row, index) => {
          const errors: string[] = [];
          const normalized: Record<string, any> = {};
          for (const [header, value] of Object.entries(row)) {
            const col = colMap.get(header.toLowerCase().trim());
            if (col) {
              normalized[col.key] = col.type === "number" ? Number(value) || 0 : String(value ?? "");
            }
          }
          for (const col of schema.columns) {
            if (col.required && !normalized[col.key] && normalized[col.key] !== 0) {
              errors.push(`${col.header} is required`);
            }
          }
          if (type === "students" && normalized.grade && !/^Grade \d+$/i.test(normalized.grade)) {
            normalized.grade = `Grade ${normalized.grade}`;
          }
          return { raw: normalized, errors, index };
        });
        resolve({
          rows,
          validCount: rows.filter((r) => r.errors.length === 0).length,
          errorCount: rows.filter((r) => r.errors.length > 0).length,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// ─── EXPORT TO EXCEL ────────────────────────────────────────────────

export function exportToExcel(data: Record<string, any>[], type: EntityType) {
  const schema = SCHEMAS[type];
  const headers = schema.columns.map((c) => c.header);
  const rows = data.map((row) => schema.columns.map((c) => row[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = schema.columns.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, schema.label);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    generateFilename(type, "xlsx"),
  );
}

// ─── EXPORT TO PDF (html2canvas approach for full Unicode/Arabic) ───

function buildExportTableHTML(schema: EntitySchema, data: Record<string, any>[]): string {
  const headerCells = schema.columns
    .map((c) => `<th style="background:#263064;color:#FCFBF0;padding:8px 12px;text-align:left;font-size:11px;white-space:nowrap;border:1px solid #ddd;font-family:Arial,sans-serif;">${c.header}<br/><span style="font-size:9px;font-weight:normal;opacity:0.8;">${c.headerAr}</span></th>`)
    .join("");
  const bodyRows = data
    .map((row, i) => {
      const bg = i % 2 === 0 ? "#ffffff" : "#f5f3eb";
      const cells = schema.columns
        .map((c) => {
          const val = String(row[c.key] ?? "");
          return `<td style="padding:6px 10px;font-size:10px;border:1px solid #e5e5e5;background:${bg};font-family:Arial,sans-serif;">${val}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; direction:ltr; }
    table { border-collapse:collapse; width:100%; }
    .title { font-size:22px; font-weight:bold; color:#263064; margin-bottom:4px; }
    .subtitle { font-size:11px; color:#888; margin-bottom:16px; }
  </style></head><body>
    <div class="title">Al-Bassam School - ${schema.label} <span style="font-size:16px;color:#666;">${schema.labelAr}</span></div>
    <div class="subtitle">Generated: ${new Date().toLocaleDateString("en-GB")} · ${data.length} records</div>
    <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
  </body></html>`;
}

export async function exportToPDF(data: Record<string, any>[], type: EntityType) {
  const schema = SCHEMAS[type];
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:1200px;background:#fff;padding:32px;font-family:Arial,sans-serif;";
  container.innerHTML = buildExportTableHTML(schema, data);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageHeight = 210;
    let yOffset = 0;
    while (yOffset < imgHeight) {
      if (yOffset > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -yOffset, imgWidth, imgHeight);
      yOffset += pageHeight;
    }
    pdf.save(generateFilename(type, "pdf"));
  } finally {
    document.body.removeChild(container);
  }
}

// ─── EXPORT TO DOCX ─────────────────────────────────────────────────

const DOCX_FONT = "Arial";

function docxTextRun(text: string, opts?: { bold?: boolean; size?: number }): TextRun {
  return new TextRun({
    text,
    font: DOCX_FONT,
    bold: opts?.bold,
    size: opts?.size ?? 18,
  });
}

export async function exportToDOCX(data: Record<string, any>[], type: EntityType) {
  const schema = SCHEMAS[type];
  const headerRow = new TableRow({
    tableHeader: true,
    children: schema.columns.map((c) => {
      return new TableCell({
        children: [
          new Paragraph({
            children: [
              docxTextRun(c.header, { bold: true, size: 18 }),
              docxTextRun(`\n${c.headerAr}`, { size: 14 }),
            ],
          }),
        ],
        width: {
          size: 100 / schema.columns.length,
          type: WidthType.PERCENTAGE,
        },
      });
    }),
  });
  const dataRows = data.map((row) => {
    return new TableRow({
      children: schema.columns.map((c) => {
        return new TableCell({
          children: [
            new Paragraph({
              children: [docxTextRun(String(row[c.key] ?? ""))],
            }),
          ],
          width: {
            size: 100 / schema.columns.length,
            type: WidthType.PERCENTAGE,
          },
        });
      }),
    });
  });
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              docxTextRun(`Al-Bassam School - ${schema.label} `, { bold: true, size: 28 }),
              docxTextRun(schema.labelAr, { bold: true, size: 28 }),
            ],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              docxTextRun(`Generated: ${new Date().toLocaleDateString("en-GB")} · ${data.length} records`),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, generateFilename(type, "docx"));
}

// ─── SAMPLE DATA ─────────────────────────────────────────────────────

const SAMPLE_DATA: Record<EntityType, Record<string, string>[]> = {
  students: [
    { fullName: "Ahmed Al-Rashid", fullNameArabic: "أحمد الراشد", studentNumber: "STU-001", nationalId: "1098765432", grade: "Grade 5", className: "A", guardianName: "Mohammed Al-Rashid", guardianPhone: "0501234567", enrollmentDate: "2023-09-01", status: "active" },
    { fullName: "Fatima Al-Saud", fullNameArabic: "فاطمة آل سعود", studentNumber: "STU-002", nationalId: "1098765433", grade: "Grade 6", className: "B", guardianName: "Khalid Al-Saud", guardianPhone: "0501234568", enrollmentDate: "2022-09-01", status: "active" },
    { fullName: "Omar Al-Harbi", fullNameArabic: "عمر الحربي", studentNumber: "STU-003", nationalId: "1098765434", grade: "Grade 4", className: "A", guardianName: "Ali Al-Harbi", guardianPhone: "0501234569", enrollmentDate: "2024-01-10", status: "active" },
    { fullName: "Noura Al-Zahrani", fullNameArabic: "نورة الزهراني", studentNumber: "STU-004", nationalId: "1098765435", grade: "Grade 7", className: "A", guardianName: "Saeed Al-Zahrani", guardianPhone: "0501234570", enrollmentDate: "2021-09-01", status: "active" },
    { fullName: "Youssef Al-Qahtani", fullNameArabic: "يوسف القحطاني", studentNumber: "STU-005", nationalId: "1098765436", grade: "Grade 3", className: "B", guardianName: "Abdulrahman Al-Qahtani", guardianPhone: "0501234571", enrollmentDate: "2024-09-01", status: "active" },
  ],
  teachers: [
    { name: "Khalid", nameArabic: "خالد", subject: "Mathematics", subjectAr: "الرياضيات", email: "khalid@albassam.edu", phone: "0551112233", hireDate: "2019-08-15", status: "active" },
    { name: "Maryam", nameArabic: "مريم", subject: "Arabic", subjectAr: "اللغة العربية", email: "maryam@albassam.edu", phone: "0552223344", hireDate: "2020-01-10", status: "active" },
    { name: "Abdullah", nameArabic: "عبدالله", subject: "Science", subjectAr: "العلوم", email: "abdullah@albassam.edu", phone: "0553334455", hireDate: "2018-09-01", status: "active" },
    { name: "Sara", nameArabic: "سارة", subject: "English", subjectAr: "اللغة الإنجليزية", email: "sara@albassam.edu", phone: "0554445566", hireDate: "2021-02-20", status: "active" },
    { name: "Faisal", nameArabic: "فيصل", subject: "Islamic Studies", subjectAr: "التربية الإسلامية", email: "faisal@albassam.edu", phone: "0555556677", hireDate: "2017-08-01", status: "active" },
  ],
  employees: [
    { name: "Hassan", nameArabic: "حسن", role: "Librarian", roleAr: "أمين المكتبة", department: "Library", departmentAr: "المكتبة", email: "hassan@albassam.edu", phone: "0561112233", hireDate: "2020-03-01", status: "active" },
    { name: "Layla", nameArabic: "ليلى", role: "Admin Assistant", roleAr: "مساعد إداري", department: "Admin", departmentAr: "الإدارة", email: "layla@albassam.edu", phone: "0562223344", hireDate: "2021-06-15", status: "active" },
    { name: "Tariq", nameArabic: "طارق", role: "Janitor", roleAr: "عميل صيانة", department: "Maintenance", departmentAr: "الصيانة", email: "tariq@albassam.edu", phone: "0563334455", hireDate: "2019-01-10", status: "active" },
  ],
  books: [
    { title: "مختارات من القرآن الكريم", titleAr: "مختارات من القرآن الكريم", author: "Anonymous", authorAr: "مجهول", isbn: "978-603-123456-1", category: "Religion", categoryAr: "الدين", language: "Arabic", copies: "5", shelf: "A1", status: "available" },
    { title: "The Prophet", titleAr: "النبي", author: "Kahlil Gibran", authorAr: "خليل جبران", isbn: "978-603-123456-2", category: "Literature", categoryAr: "الأدب", language: "English", copies: "3", shelf: "B2", status: "available" },
    { title: "رياض الأطفال", titleAr: "رياض الأطفال", author: "Muhammad Ali", authorAr: "محمد علي", isbn: "978-603-123456-3", category: "Education", categoryAr: "تعليم", language: "Arabic", copies: "8", shelf: "C3", status: "available" },
    { title: " Chemistry Fundamentals", titleAr: "أساسيات الكيمياء", author: "Ahmad Hassan", authorAr: "أحمد حسن", isbn: "978-603-123456-4", category: "Science", categoryAr: "علوم", language: "Arabic", copies: "4", shelf: "D4", status: "available" },
    { title: "Math Made Easy", titleAr: "الرياضيات بسهولة", author: "Sara Ali", authorAr: "سارة علي", isbn: "978-603-123456-5", category: "Mathematics", categoryAr: "رياضيات", language: "English", copies: "6", shelf: "E5", status: "available" },
  ],
};

export function downloadSampleData(type: EntityType) {
  const schema = SCHEMAS[type];
  const headers = schema.columns.map((c) => c.header);
  const headersAr = schema.columns.map((c) => c.headerAr);
  const rows = SAMPLE_DATA[type].map((row) =>
    schema.columns.map((c) => row[c.key] ?? ""),
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, headersAr, [], ...rows]);
  ws["!cols"] = schema.columns.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, schema.label);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `sample_${schema.label.toLowerCase()}.xlsx`);
}
