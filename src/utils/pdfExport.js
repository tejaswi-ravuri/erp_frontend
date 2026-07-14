import jsPDF from "jspdf";
import { studentApi, classApi, feeApi } from "@/api/api";

const SCHOOL = "MasterMinds ERP";
const BRAND = "Dominare Group";
const LOGO_URL = "/logo.webp";

// ── helpers ──────────────────────────────────────────────────────────────
const fmtINR = (n) => `Rs. ${Math.abs(Number(n) || 0).toLocaleString("en-IN")}`;
const today = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// Loads /logo.webp once and caches it as a PNG data URL (jsPDF's own WEBP
// decoding is unreliable across versions/browsers - converting through a
// <canvas>, which every browser can already decode WEBP into, sidesteps
// that entirely). Resolves to null on any failure so callers can just
// fall back to the text-only header instead of throwing.
let logoPromise = null;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext("2d").drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL("image/png"),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = LOGO_URL;
    });
  }
  return logoPromise;
}

function header(doc, title, logo) {
  // Banner
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 28, "F");

  if (logo) {
    // White card behind the logo so its white background doesn't clash
    // with the indigo banner, sized to the logo's real aspect ratio so
    // it's never stretched.
    const maxW = 62;
    const maxH = 18;
    let w = maxW;
    let h = (w * logo.height) / logo.width;
    if (h > maxH) {
      h = maxH;
      w = (h * logo.width) / logo.height;
    }
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 4, w + 4, h + 4, 2, 2, "F");
    try {
      doc.addImage(logo.dataUrl, "PNG", 12, 6, w, h);
    } catch {
      // fall through to text below if addImage still rejects it
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(SCHOOL, 14, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(BRAND, 14, 19);
  }

  doc.setTextColor(255, 255, 255);
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

// ── Indian-numbering amount-in-words (Crore/Lakh/Thousand) ────────────────
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];
function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}
function threeDigitsToWords(n) {
  if (n < 100) return twoDigitsToWords(n);
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " + twoDigitsToWords(n % 100) : ""}`;
}
function numberToWords(amount) {
  let n = Math.round(Number(amount) || 0);
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const parts = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (n) parts.push(threeDigitsToWords(n));
  return parts.join(" ");
}

// ── Student/class enrichment for receipts ──────────────────────────────
// FeePayment only carries student_name/student_id - Grade, Admission No,
// Father's Name and Phone live on the Student (and, for grade, the Class)
// record, so receipts fetch and cache them once per student rather than
// requiring every print call site to look this up itself.
let classesPromise = null;
function loadClasses() {
  if (!classesPromise) {
    classesPromise = classApi
      .list()
      .then((data) => data?.data || data || [])
      .catch(() => []);
  }
  return classesPromise;
}

const studentInfoCache = new Map();
function resolveStudentInfo(studentId) {
  if (!studentId) return Promise.resolve(null);
  if (studentInfoCache.has(studentId)) return studentInfoCache.get(studentId);
  const promise = Promise.all([studentApi.getById(studentId), loadClasses()])
    .then(([student, classes]) => {
      const doc = student?.data ?? student;
      if (!doc) return null;
      const classId =
        typeof doc.class === "object" ? doc.class?._id : doc.class;
      const cls = classes.find((c) => c._id === classId);
      return {
        admission_no: doc.admission_no || "",
        grade: cls
          ? ["LKG", "UKG"].includes(cls.grade)
            ? cls.grade
            : `Class ${cls.grade}`
          : "",
        parent_name: doc.parent_name || "",
        parent_phone: doc.parent_phone || "",
      };
    })
    .catch(() => null);
  studentInfoCache.set(studentId, promise);
  return promise;
}

// What else this student still owes, as of right now - deliberately NOT
// cached like resolveStudentInfo above, since a fee report's balances
// change with every payment (including the one that was just collected
// right before this receipt prints), so a stale read here would show the
// wrong dues.
function resolveDueFees(studentId) {
  if (!studentId) return Promise.resolve([]);
  return feeApi
    .listReports({ student_id: studentId, status: "Active" })
    .then((reports) => {
      const report = (reports || [])[0];
      if (!report) return [];
      const due = [];
      const add = (label, amount) => {
        if (Number(amount) > 0) due.push({ label, amount: Number(amount) });
      };
      add("Term Fee", report.balance_term_fee);
      add("Admission Fee", report.balance_adm_fee);
      add("Previous Due", report.old_fee);
      if (report.has_transport_fee)
        add("Transport Fee", report.balance_transport_fee);
      if (report.has_application_fee)
        add("Application Fee", report.balance_application_fee);
      if (report.has_registration_fee)
        add("Registration Fee", report.balance_registration_fee);
      return due;
    })
    .catch(() => []);
}

// ── FEE RECEIPT ──────────────────────────────────────────────────────────
// `feeOrFees` is either a single FeePayment-like object or an array of
// them for a combined multi-fee-type receipt (the common case - one
// receipt_no often spans several fee_type rows from one collectPayment()
// call). `oldFeePayments` is an optional second array - payments from a
// prior academic year, rendered in their own "Previous Year Dues" section
// instead of being mixed into the current year's line items.
// `options.copies` - an array of copy labels (e.g. ["Parent Copy", "Office
// Copy"]) to render the exact same receipt once per label, each on its own
// full page. Defaults to a single unlabeled copy.
export async function printFeeReceipt(
  feeOrFees,
  oldFeePayments = [],
  options = {},
) {
  const { copies = [null] } = options;
  const currentYearPayments = Array.isArray(feeOrFees)
    ? feeOrFees
    : [feeOrFees];
  const first = currentYearPayments[0] || oldFeePayments[0] || {};

  const [logo, student, dueFees] = await Promise.all([
    loadLogo(),
    resolveStudentInfo(first.student_id),
    resolveDueFees(first.student_id),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const rightX = 190;
  const centerX = 105;

  const feeRow = (label, value, y) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), rightX, y, { align: "right" });
    return y + 7;
  };

  const renderCopy = (copyLabel) => {
    let y = 12;

    // Centered logo, sized to its real aspect ratio.
    if (logo) {
      const maxW = 70;
      const maxH = 24;
      let w = maxW;
      let h = (w * logo.height) / logo.width;
      if (h > maxH) {
        h = maxH;
        w = (h * logo.width) / logo.height;
      }
      try {
        doc.addImage(logo.dataUrl, "PNG", centerX - w / 2, y, w, h);
      } catch {
        // ignore - fall through without a logo
      }
      y += h + 8;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(SCHOOL, centerX, y + 8, { align: "center" });
      y += 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(30, 30, 30);
    doc.text("FEE RECEIPT", centerX, y, { align: "center" });
    y += 6;

    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.4);
    doc.line(marginX, y, rightX, y);
    y += 7;

    // Receipt meta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(`Receipt No: ${first.receipt_no || "N/A"}`, marginX, y);
    if (copyLabel) {
      doc.setFont("helvetica", "bold");
      doc.text(copyLabel.toUpperCase(), rightX, y, { align: "right" });
    }
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${first.payment_date || today()}`, marginX, y);
    y += 9;

    // Student details - 3-column grid, 2 rows.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Student Details:", marginX, y);
    y += 7;
    const col2 = marginX + 68;
    const col3 = marginX + 118;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Name: ${first.student_name || "—"}`, marginX, y);
    doc.text(`Grade: ${student?.grade || "—"}`, col2, y);
    doc.text(`Admission No: ${student?.admission_no || "—"}`, col3, y);
    y += 6;
    doc.text(`Father's Name: ${student?.parent_name || "—"}`, marginX, y);
    doc.text(`Academic Year: ${first.academic_year || "—"}`, col2, y);
    doc.text(`Phone: ${student?.parent_phone || "—"}`, col3, y);
    y += 9;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, rightX, y);
    y += 8;

    // Payment details - current year.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text("Payment Details:", marginX, y);
    y += 8;
    let currentTotal = 0;
    currentYearPayments.forEach((p) => {
      y = feeRow(p.fee_type || "Fee", fmtINR(p.amount), y);
      currentTotal += Number(p.amount) || 0;
    });

    // Previous-year dues, only when there are any.
    let oldTotal = 0;
    if (oldFeePayments.length > 0) {
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("Previous Year Dues:", marginX, y);
      y += 7;
      oldFeePayments.forEach((p) => {
        y = feeRow(
          `${p.fee_type || "Fee"} (${p.academic_year || "—"})`,
          fmtINR(p.amount),
          y,
        );
        oldTotal += Number(p.amount) || 0;
      });
    }
    y += 2;

    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, rightX, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("TOTAL AMOUNT PAID", marginX, y);
    doc.text(fmtINR(currentTotal + oldTotal), rightX, y, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Amount in Words:", marginX, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.text(
      `Rupees ${numberToWords(currentTotal + oldTotal)} Only`,
      marginX,
      y,
    );
    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Payment Mode: ${first.payment_mode || "—"}`, marginX, y);
    y += 10;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, rightX, y);
    y += 8;

    // Other fees still outstanding for this student, as of right now
    // (i.e. after this payment has already been applied) - so partially
    // paid buckets and anything untouched by this receipt both show up
    // correctly, and anything just fully paid off drops out on its own.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text("Other Fees Due:", marginX, y);
    y += 7;
    if (dueFees.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("No other fees due.", marginX, y);
      doc.setTextColor(30, 30, 30);
      y += 6;
    } else {
      let dueTotal = 0;
      dueFees.forEach((d) => {
        y = feeRow(d.label, fmtINR(d.amount), y);
        dueTotal += d.amount;
      });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Total Due", marginX, y);
      doc.text(fmtINR(dueTotal), rightX, y, { align: "right" });
      y += 6;
    }
    y += 4;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, y, rightX, y);
    y += 20;

    // Signature space.
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.3);
    doc.line(rightX - 55, y, rightX, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text("Accounts Manager Signature", rightX, y, { align: "right" });
    doc.setTextColor(30, 30, 30);
    y += 10;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("This is a computer-generated receipt.", centerX, y, {
      align: "center",
    });
    y += 5;
    doc.text("Thank you for your payment.", centerX, y, { align: "center" });
    doc.setTextColor(30, 30, 30);
  };

  copies.forEach((copyLabel, i) => {
    if (i > 0) doc.addPage();
    renderCopy(copyLabel);
  });

  const filenameBase = first.student_name || first.receipt_no || "Fee";
  doc.save(`Receipt_${filenameBase}.pdf`);
}

// ── TRACKING EXPENSES EXPORT ─────────────────────────────────────────────
// `studentFeeIncome`/`otherIncome`/`expenditureRows` are arrays of
// { label, value } - real backend category/fee_type breakdowns (only the
// ones with actual amounts in range), not a fixed frontend-invented list.
export async function exportTrackingExpenses({
  fromDate,
  toDate,
  periodLabel,
  branchLabel,
  studentFeeIncome = [],
  otherIncome = [],
  expenditureRows = [],
}) {
  const logo = await loadLogo();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "EXPENSE TRACKER REPORT", logo);

  const sum = (rows) => rows.reduce((a, r) => a + (Number(r.value) || 0), 0);
  const totalInc = sum(studentFeeIncome) + sum(otherIncome);
  const totalExp = sum(expenditureRows);
  const balance = totalInc - totalExp;

  let y = 36;
  doc.setFontSize(8);
  doc.setTextColor(100);
  const range =
    periodLabel || (fromDate === toDate ? fromDate : `${fromDate}  to  ${toDate}`);
  doc.text(`Period: ${range}`, 14, y);
  if (branchLabel) {
    doc.text(`Branch: ${branchLabel}`, 196, y, { align: "right" });
  }
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

  const ensureRoom = (limit = 270) => {
    if (y > limit) {
      doc.addPage();
      header(doc, "EXPENSE TRACKER REPORT", logo);
      y = 36;
    }
  };

  const section = (title, rows, color, totalLabel, total) => {
    y = sectionTitle(doc, title, y, color);
    if (rows.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("No records for this period.", 17, y);
      doc.setTextColor(30, 30, 30);
      y += 8;
    } else {
      rows.forEach((r, i) => {
        y = row(doc, r.label, fmtINR(r.value), y, i % 2 === 0);
        ensureRoom();
      });
    }
    doc.setFillColor(...color);
    doc.rect(14, y - 4, 182, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(totalLabel, 17, y + 1);
    doc.text(fmtINR(total), 196, y + 1, { align: "right" });
    doc.setTextColor(30, 30, 30);
    y += 12;
    ensureRoom(230);
  };

  section(
    "Student Fee Income",
    studentFeeIncome,
    [16, 185, 129],
    "TOTAL STUDENT FEE INCOME",
    sum(studentFeeIncome),
  );
  section(
    "Other Income Sources",
    otherIncome,
    [5, 150, 105],
    "TOTAL OTHER INCOME",
    sum(otherIncome),
  );
  section(
    "Expenditure",
    expenditureRows,
    [220, 38, 38],
    "TOTAL EXPENDITURE",
    totalExp,
  );

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
