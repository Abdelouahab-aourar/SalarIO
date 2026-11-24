import type { RowInput, Styles, UserOptions } from "jspdf-autotable";
import type { jsPDF } from "jspdf";
import { round2, resolveBonusAmount, type SalaryResult } from "@/lib/payroll/salary";
import { formatAmount, formatDate, formatPercent } from "@/lib/payroll/format";

const BLACK: [number, number, number] = [0, 0, 0];
const LINE: [number, number, number] = [45, 45, 45];
const MUTED: [number, number, number] = [110, 110, 110];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type AutoTableDocument = jsPDF & {
  lastAutoTable?: { finalY?: number };
};

function lastTableY(doc: jsPDF, fallback: number): number {
  return (doc as AutoTableDocument).lastAutoTable?.finalY ?? fallback;
}

function upper(value: string): string {
  return value.toUpperCase();
}

function gridStyles(): Partial<Styles> {
  return {
    font: "helvetica",
    fontSize: 8,
    textColor: BLACK,
    cellPadding: { top: 1.6, bottom: 1.6, left: 2.5, right: 2.5 },
    lineColor: LINE,
    lineWidth: 0.35,
    overflow: "linebreak",
  };
}

function gridHead(): Partial<Styles> {
  return {
    fillColor: WHITE,
    textColor: BLACK,
    fontStyle: "bold",
    fontSize: 7.5,
    halign: "center",
    valign: "middle",
    lineColor: LINE,
    lineWidth: 0.35,
  };
}

function buildEmployeeTables(result: SalaryResult): {
  tableA: UserOptions;
  tableB: UserOptions;
} {
  const { info } = result.input;

  const tableA: UserOptions = {
    startY: 46,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: 20 },
    tableWidth: CONTENT_WIDTH,
    theme: "plain",
    styles: gridStyles(),
    headStyles: gridHead(),
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 52 },
      2: { cellWidth: 52 },
      3: { cellWidth: 24 },
      4: { cellWidth: 24 },
    },
    head: [["Employee No.", "Last name", "First name", "Payment", "Account"]],
    body: [
      [
        info.matricule,
        upper(info.lastName),
        upper(info.firstName),
        info.paymentMethod,
        info.account,
      ],
    ],
  };

  const tableB: UserOptions = {
    startY: 0,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: 20 },
    tableWidth: CONTENT_WIDTH,
    theme: "plain",
    styles: gridStyles(),
    headStyles: gridHead(),
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 44 },
      2: { cellWidth: 24 },
      3: { cellWidth: 18 },
      4: { cellWidth: 62 },
    },
    head: [["Hire date", "SS No.", "Category", "Grade", "Position"]],
    body: [
      [
        info.hireDate,
        info.socialSecurityNumber,
        info.category,
        info.echelon,
        upper(info.position),
      ],
    ],
  };

  return { tableA, tableB };
}

function buildMainTable(result: SalaryResult): UserOptions {
  const totalStyles: Partial<Styles> = {
    fontStyle: "bold",
    textColor: BLACK,
    lineWidth: { top: 0.35, bottom: 0.35, left: 0.35, right: 0.35 },
    lineColor: LINE,
  };

  const netStyles: Partial<Styles> = {
    fontStyle: "bold",
    fontSize: 10,
    textColor: BLACK,
    lineWidth: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
    lineColor: BLACK,
  };

  const row = (
    code: string,
    label: string,
    base: string,
    nombre: string,
    taux: string,
    gain: string,
    retenue: string,
  ): RowInput => [code, label, base, nombre, taux, gain, retenue];

  const gainRow = (
    code: string,
    label: string,
    basis: string,
    value: number,
  ): RowInput => [
    code,
    label,
    "",
    "",
    basis,
    formatAmount(value),
    "",
  ];

  const retenueRow = (
    code: string,
    label: string,
    base: number,
    taux: string,
    value: number,
  ): RowInput =>
    row(
      code,
      label,
      formatAmount(base),
      "",
      taux,
      "",
      formatAmount(value),
    );

  const totalRow = (label: string, gains: number, retenues: number): RowInput => [
    { content: label, colSpan: 5, styles: totalStyles },
    { content: formatAmount(gains), styles: { ...totalStyles, halign: "right" } },
    {
      content: formatAmount(retenues),
      styles: { ...totalStyles, halign: "right" },
    },
  ];

  const { input, irg } = result;
  const body: RowInput[] = [];

  const dailyRate = input.baseSalary > 0 ? round2(input.baseSalary / 30) : 0;
  body.push(
    row(
      "101",
      "BASIC SALARY",
      "",
      formatAmount(30),
      formatAmount(dailyRate),
      formatAmount(input.baseSalary),
      "",
    ),
  );

  if (result.iepAmount > 0) {
    body.push(
      row(
        "102",
        "EXPERIENCE BONUS (IEP)",
        formatAmount(input.baseSalary),
        "",
        formatPercent(input.iepRate / 100),
        formatAmount(result.iepAmount),
        "",
      ),
    );
  }

  if (result.overtimeAmount > 0 && input.overtimeHours > 0) {
    body.push(
      row(
        "110",
        "OVERTIME",
        "",
        formatAmount(input.overtimeHours),
        formatAmount(round2(result.overtimeAmount / input.overtimeHours)),
        formatAmount(result.overtimeAmount),
        "",
      ),
    );
  }

  if (result.absenceDeduction > 0) {
    body.push(
      row(
        "300",
        "UNJUSTIFIED ABSENCE",
        formatAmount(input.baseSalary),
        formatAmount(input.absenceDays),
        formatAmount(round2(input.baseSalary / 30)),
        "",
        formatAmount(result.absenceDeduction),
      ),
    );
  }

  input.bonuses
    .filter((bonus) => bonus.taxable)
    .forEach((bonus, index) => {
      body.push(
        gainRow(
          String(200 + index),
          upper(bonus.label || "Bonus"),
          bonus.mode === "percent" ? `${bonus.amount}% of base` : "",
          resolveBonusAmount(bonus, input.baseSalary),
        ),
      );
    });

  body.push(
    retenueRow("401", "I.R.G", result.taxableSalary, "", irg.irg),
    retenueRow("404", "SOCIAL SECURITY", result.gross, formatAmount(9), result.cnas),
  );

  input.bonuses
    .filter((bonus) => !bonus.taxable)
    .forEach((bonus, index) => {
      body.push(
        gainRow(
          String(210 + index),
          upper(bonus.label || "Allowance"),
          bonus.mode === "percent" ? `${bonus.amount}% of base` : "",
          resolveBonusAmount(bonus, input.baseSalary),
        ),
      );
    });

  const totalGains = round2(result.gross + result.nonTaxableBonuses);
  const totalDeductions = round2(
    result.cnas + result.irg.irg + result.otherDeductions,
  );

  input.deductions.forEach((item, index) => {
    body.push(
      row(
        String(490 + index),
        upper(item.label || "Deduction"),
        "",
        "",
        "",
        "",
        formatAmount(Math.max(0, item.amount)),
      ),
    );
  });

  body.push(
    totalRow("Totals...", totalGains, totalDeductions),
    totalRow("To pay...", totalGains, totalDeductions),
    [
      { content: "NET PAY", colSpan: 5, styles: netStyles },
      { content: "", styles: netStyles },
      {
        content: formatAmount(result.net),
        styles: { ...netStyles, halign: "right" },
      },
    ],
  );

  return {
    startY: 0,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: 20 },
    tableWidth: CONTENT_WIDTH,
    theme: "plain",
    styles: gridStyles(),
    headStyles: gridHead(),
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 54 },
      2: { cellWidth: 26, halign: "right" },
      3: { cellWidth: 18, halign: "right" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
    },
    head: [["Code", "DESCRIPTION", "Base", "Qty", "Rate", "Earnings", "Deductions"]],
    body,
  };
}

export async function createSalaryPdf(
  result: SalaryResult,
): Promise<jsPDF> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const { info } = result.input;

  doc.setProperties({
    title: "Pay slip - Algeria 2026",
    subject: "Monthly pay slip, 2026 IRG scale",
    author: "Salaire DZ",
    creator: "Salaire DZ",
  });

  // Company box.
  const boxX = MARGIN;
  const boxY = 10;
  const boxW = 68;
  const boxH = 12;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.rect(boxX, boxY, boxW, boxH);
  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(upper(info.companyName) || "COMPANY NAME", boxX + 3, boxY + 7.5, {
    maxWidth: boxW - 6,
  });

  // Title + month box.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("PAYSLIP", PAGE_WIDTH - MARGIN, 17, { align: "right" });
  const monthW = 74;
  const monthX = PAGE_WIDTH - MARGIN - monthW;
  const monthY = 21;
  doc.setLineWidth(0.4);
  doc.rect(monthX, monthY, monthW, 7.5);
  doc.setFontSize(8.5);
  doc.text(`MONTH OF: ${upper(info.payMonth) || "—"}`, monthX + 3, monthY + 5.2, {
    maxWidth: monthW - 6,
  });

  // Contributor number.
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text(`Contributor No.: ${info.cotisantNumber}`, MARGIN + 24, 42);

  // Employee tables.
  const { tableA, tableB } = buildEmployeeTables(result);
  autoTable(doc, tableA);
  let cursor = lastTableY(doc, 60);

  if (info.department) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`DEPARTMENT: ${upper(info.department)}`, MARGIN + 3, cursor + 5);
    doc.setFont("helvetica", "normal");
    cursor += 6;
  }

  const familyLine = [info.maritalStatus, info.childrenCount > 0 ? String(info.childrenCount) : ""]
    .filter(Boolean)
    .join("   ");
  if (familyLine) {
    doc.setFontSize(8.5);
    doc.text(familyLine, PAGE_WIDTH / 2, cursor + 6, { align: "center" });
    cursor += 8;
  } else {
    cursor += 3;
  }

  autoTable(doc, { ...tableB, startY: cursor });
  cursor = lastTableY(doc, cursor + 20);

  // Main earnings/deductions table.
  autoTable(doc, { ...buildMainTable(result), startY: cursor + 6 });
  cursor = lastTableY(doc, cursor + 60);

  // Signatures.
  const sigY = Math.min(cursor + 8, 244);
  const sigW = (CONTENT_WIDTH - 6) / 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.rect(MARGIN, sigY, sigW, 20);
  doc.text("Employer signature", MARGIN + 3, sigY + 5);
  doc.rect(MARGIN + sigW + 6, sigY, sigW, 20);
  doc.text("Employee signature", MARGIN + sigW + 9, sigY + 5);

  // Footnote.
  const footnoteY = Math.min(sigY + 28, 272);
  doc.setFontSize(6.2);
  doc.setTextColor(...MUTED);
  const footnote = doc.splitTextToSize(
    `Employee CNAS is 9% of gross, deducted before IRG. Employer CNAS (25.5%: ${formatAmount(result.employerCnas)} DA, total cost ${formatAmount(result.employerCost)} DA) is paid on top of gross with no effect on net pay.${result.input.specialRegime ? " Special regime (disabled worker or general-scheme retiree) applied." : ""} 2026 IRG scale, article 104 CIDTA (Finance Law 2022).`,
    CONTENT_WIDTH,
  );
  doc.text(footnote, MARGIN, footnoteY);

  // Footer.
  doc.setFontSize(6.2);
  doc.text(
    `Salaire DZ  ·  Generated on ${formatDate(new Date())}`,
    MARGIN,
    PAGE_HEIGHT - 8,
  );
  doc.text(
    `Page ${doc.getNumberOfPages()} of ${doc.getNumberOfPages()}`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 8,
    { align: "right" },
  );

  return doc;
}

export function salaryPdfFilename(result: SalaryResult): string {
  const net = Math.round(result.net);
  const amount = net < 0 ? `negative-${Math.abs(net)}` : String(net);
  return `salary-statement-${amount}-da.pdf`;
}
