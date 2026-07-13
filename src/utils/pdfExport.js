import jsPDF from "jspdf";

const SCHOOL = "MasterMinds ERP";
const BRAND = "Dominare Group";

// ── helpers ──────────────────────────────────────────────────────────────
const fmtINR = (n) => `Rs. ${Math.abs(Number(n) || 0).toLocaleString("en-IN")}`;
const today = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

function header(doc, title) {
  // Banner
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(SCHOOL, 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(BRAND, 14, 19);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 210 - 14, 15, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${today()}`, 210 - 14, 22, { align: "right" });
  doc.setTextColor(30, 30, 30);
}

function footer(doc) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${SCHOOL} · ${BRAND}`, 14, 290);
    doc.text(`Page ${i} of ${pages}`, 196, 290, { align: "right" });
    doc.setTextColor(30, 30, 30);
  }
}

function sectionTitle(doc, text, y, color = [79, 70, 229]) {
  doc.setFillColor(...color);
  doc.rect(14, y, 182, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 17, y + 5);
  doc.setTextColor(30, 30, 30);
  return y + 10;
}

function row(doc, label, value, y, shade = false) {
  if (shade) {
    doc.setFillColor(247, 248, 250);
    doc.rect(14, y - 4, 182, 7, "F");
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, 17, y);
  doc.setFont("helvetica", "bold");
  doc.text(String(value), 196, y, { align: "right" });
  return y + 8;
}

// ── FEE RECEIPT ──────────────────────────────────────────────────────────
// `feeOrFees` is either a single FeePayment-like object (original,
// unchanged behavior - one receipt, one fee type) or an array of them for
// a combined multi-payment receipt. `oldFeePayments` is an optional second
// array - payments from a prior academic year, rendered in their own
// "Old Fee / Previous Year" section instead of being mixed in with the
// current year's line items. The caller (BPFees.jsx) decides what counts
// as "old" (it already knows the current academic year); this function
// just renders whatever two groups it's given.
export function printFeeReceipt(feeOrFees, oldFeePayments = []) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "FEE RECEIPT");

  let y = 36;
  const isMultiple = Array.isArray(feeOrFees);
  const currentYearPayments = isMultiple ? feeOrFees : [feeOrFees];
  const first = currentYearPayments[0] || oldFeePayments[0] || {};

  // Receipt meta
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(
    `Receipt No: ${isMultiple ? `${currentYearPayments.length + oldFeePayments.length} payments` : first.receipt_no || "N/A"}`,
    14,
    y,
  );
  doc.text(`Date: ${first.payment_date || today()}`, 196, y, {
    align: "right",
  });
  doc.setTextColor(30, 30, 30);
  y += 8;

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 8;

  y = sectionTitle(doc, "Student Details", y, [16, 185, 129]);
  y = row(doc, "Student Name", first.student_name || "—", y, false);
  y = row(doc, "Student ID", first.student_id || "—", y, true);
  y = row(doc, "Academic Year", first.academic_year || "—", y, false);
  y += 4;

  if (!isMultiple) {
    // Original single-payment layout, unchanged.
    y = sectionTitle(doc, "Payment Details", y, [79, 70, 229]);
    y = row(doc, "Fee Type", first.fee_type || "—", y, false);
    y = row(doc, "Amount Paid", fmtINR(first.amount), y, true);
    y = row(doc, "Payment Mode", first.payment_mode || "—", y, false);
    y = row(doc, "Payment Date", first.payment_date || "—", y, true);
    y = row(doc, "Status", first.status || "—", y, false);
    y += 6;

    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, y, 182, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Amount Received: ${fmtINR(first.amount)}`, 105, y + 10, {
      align: "center",
    });
    doc.setTextColor(30, 30, 30);
    y += 24;
  } else {
    let currentTotal = 0;
    if (currentYearPayments.length > 0) {
      y = sectionTitle(doc, "This Academic Year", y, [79, 70, 229]);
      currentYearPayments.forEach((p, i) => {
        y = row(
          doc,
          `${p.fee_type || "Fee"} (${p.payment_mode || "—"})`,
          fmtINR(p.amount),
          y,
          i % 2 === 0,
        );
        currentTotal += Number(p.amount) || 0;
      });
      y = row(doc, "Subtotal", fmtINR(currentTotal), y, false);
      y += 4;
    }

    let oldTotal = 0;
    if (oldFeePayments.length > 0) {
      y = sectionTitle(doc, "Old Fee / Previous Year", y, [217, 119, 6]);
      oldFeePayments.forEach((p, i) => {
        y = row(
          doc,
          `${p.fee_type || "Fee"} · ${p.academic_year || "—"}`,
          fmtINR(p.amount),
          y,
          i % 2 === 0,
        );
        oldTotal += Number(p.amount) || 0;
      });
      y = row(doc, "Subtotal", fmtINR(oldTotal), y, false);
      y += 4;
    }

    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, y, 182, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Amount Received: ${fmtINR(currentTotal + oldTotal)}`,
      105,
      y + 10,
      { align: "center" },
    );
    doc.setTextColor(30, 30, 30);
    y += 24;
  }

  // Signature line
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Authorised Signatory", 196, y + 10, { align: "right" });
  doc.line(140, y + 11, 196, y + 11);

  footer(doc);
  const filenameBase = isMultiple
    ? first.student_name || "Fee"
    : first.receipt_no || first.student_name || "Fee";
  doc.save(`Receipt_${filenameBase}.pdf`);
}

// ── TRACKING EXPENSES EXPORT ─────────────────────────────────────────────
export function exportTrackingExpenses({
  fromDate,
  toDate,
  income,
  expenditure,
  incomeLabels,
  expLabels,
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "EXPENSE TRACKER REPORT");

  const totalInc = Object.values(income).reduce(
    (a, b) => a + (Number(b) || 0),
    0,
  );
  const totalExp = Object.values(expenditure).reduce(
    (a, b) => a + (Number(b) || 0),
    0,
  );
  const balance = totalInc - totalExp;

  let y = 36;
  doc.setFontSize(8);
  doc.setTextColor(100);
  const range = fromDate === toDate ? fromDate : `${fromDate}  to  ${toDate}`;
  doc.text(`Period: ${range}`, 14, y);
  doc.setTextColor(30, 30, 30);
  y += 8;

  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, 196, y);
  y += 8;

  // Tally summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 22, 3, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(`Income: ${fmtINR(totalInc)}`, 30, y + 9);
  doc.setTextColor(220, 38, 38);
  doc.text(`Expenditure: ${fmtINR(totalExp)}`, 105, y + 9, { align: "center" });
  const balColor = balance >= 0 ? [16, 185, 129] : [220, 38, 38];
  doc.setTextColor(...balColor);
  doc.text(
    `Balance: ${fmtINR(balance)} (${balance >= 0 ? "Surplus" : "Deficit"})`,
    185,
    y + 9,
    { align: "right" },
  );
  doc.setTextColor(30, 30, 30);
  y += 28;

  // Income section
  y = sectionTitle(doc, "Income Stream", y, [16, 185, 129]);
  Object.entries(incomeLabels).forEach(([key, label], i) => {
    const val = Number(income[key]) || 0;
    y = row(doc, label, fmtINR(val), y, i % 2 === 0);
    if (y > 270) {
      doc.addPage();
      header(doc, "EXPENSE TRACKER REPORT");
      y = 36;
    }
  });

  // Total income row
  doc.setFillColor(16, 185, 129);
  doc.rect(14, y - 4, 182, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL INCOME", 17, y + 1);
  doc.text(fmtINR(totalInc), 196, y + 1, { align: "right" });
  doc.setTextColor(30, 30, 30);
  y += 12;

  if (y > 230) {
    doc.addPage();
    header(doc, "EXPENSE TRACKER REPORT");
    y = 36;
  }

  // Expenditure section
  y = sectionTitle(doc, "Daily Expenditure", y, [220, 38, 38]);
  Object.entries(expLabels).forEach(([key, label], i) => {
    const val = Number(expenditure[key]) || 0;
    y = row(doc, label, fmtINR(val), y, i % 2 === 0);
    if (y > 270) {
      doc.addPage();
      header(doc, "EXPENSE TRACKER REPORT");
      y = 36;
    }
  });

  // Total expenditure row
  doc.setFillColor(220, 38, 38);
  doc.rect(14, y - 4, 182, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL EXPENDITURE", 17, y + 1);
  doc.text(fmtINR(totalExp), 196, y + 1, { align: "right" });
  doc.setTextColor(30, 30, 30);
  y += 14;

  // Closing balance box
  doc.setFillColor(...balColor);
  doc.roundedRect(14, y, 182, 14, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Closing Balance: ${fmtINR(balance)}  (${balance >= 0 ? "▲ Surplus" : "▼ Deficit"})`,
    105,
    y + 9,
    { align: "center" },
  );
  doc.setTextColor(30, 30, 30);

  footer(doc);
  doc.save(`TrackingExpenses_${fromDate}_${toDate}.pdf`);
}
