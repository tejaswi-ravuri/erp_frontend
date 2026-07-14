import React, { useState, useEffect, useRef } from "react";
import { entities } from "@/api/entityClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, ChevronDown, X } from "lucide-react";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";

const FEE_FIELDS = [
  { key: "old_fee", label: "Old Fee", feeType: null },
  { key: "application_fee", label: "Application Fee", feeType: null },
  { key: "admission_fee", label: "Admission Fee", feeType: null },
  { key: "term_fee", label: "Term Fee", feeType: "Tuition" },
  { key: "transport_fee", label: "Transportation Fee", feeType: "Transport" },
  { key: "kit_fee", label: "Kit Fee", feeType: "Other" },
  { key: "textbook_fee", label: "Text Book Fee", feeType: null },
];

const PAYMENT_MODES = ["Cash", "Online", "Cheque", "Bank Transfer"];
const ACADEMIC_YEARS = ["2024-25", "2025-26", "2026-27", "2023-24"];
const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
const EMPTY_FEES = {
  old_fee: "",
  application_fee: "",
  admission_fee: "",
  term_fee: "",
  transport_fee: "",
  kit_fee: "",
  textbook_fee: "",
};

// Convert number to Indian words
const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const convertLessThanThousand = (n) => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
      );
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
    );
  };

  const billion = Math.floor(num / 1000000000);
  const crore = Math.floor((num % 1000000000) / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  let result = "";
  if (billion > 0) result += convertLessThanThousand(billion) + " Billion ";
  if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanThousand(thousand) + " Thousand ";
  if (hundred > 0) result += convertLessThanThousand(hundred) + " ";
  if (rest > 0)
    result +=
      (result ? "" : "") +
      (rest < 100 && rest >= 10
        ? teens[rest - 10]
        : (rest >= 10 ? tens[Math.floor(rest / 10)] : "") +
          (rest % 10 !== 0 && rest >= 10
            ? " " + ones[rest % 10]
            : rest < 10
              ? ones[rest]
              : ""));

  return result.trim();
};

export default function StudentReceipt() {
  const location = useLocation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fees, setFees] = useState({ ...EMPTY_FEES });
  const [paid, setPaid] = useState({ ...EMPTY_FEES });
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [receiptNo, setReceiptNo] = useState(
    `RCP-${Date.now().toString().slice(-6)}`,
  );
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loadingFees, setLoadingFees] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    entities.Student.list("full_name", 200).then((data) => {
      setStudents(data);
      setLoading(false);
      // Auto-load student if navigated from admissions
      const state = location.state;
      if (state?.studentId && state?.autoLoad) {
        const student = data.find((s) => s.id === state.studentId);
        if (student) handleSelect(student);
      }
    });
  }, [location.state]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = students.filter(
    (s) =>
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no?.toLowerCase().includes(search.toLowerCase()) ||
      s.class?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = async (s) => {
    setSelectedStudent(s);
    setSearch(s.full_name);
    setShowDropdown(false);
    setFees({ ...EMPTY_FEES });
    setPaid({ ...EMPTY_FEES });
    // Load fee payments for this student from DB
    setLoadingFees(true);
    try {
      const payments = await entities.FeePayment.filter({
        student_id: s.id,
      });
      const yearPayments = payments.filter(
        (p) => p.academic_year === academicYear,
      );
      // Map DB fee types to our fee fields
      const newPaid = { ...EMPTY_FEES };
      yearPayments.forEach((p) => {
        if (p.fee_type === "Tuition")
          newPaid.term_fee =
            (parseFloat(newPaid.term_fee) || 0) + (p.amount || 0);
        else if (p.fee_type === "Transport")
          newPaid.transport_fee =
            (parseFloat(newPaid.transport_fee) || 0) + (p.amount || 0);
        else if (p.fee_type === "Annual")
          newPaid.admission_fee =
            (parseFloat(newPaid.admission_fee) || 0) + (p.amount || 0);
        else if (p.fee_type === "Exam")
          newPaid.application_fee =
            (parseFloat(newPaid.application_fee) || 0) + (p.amount || 0);
        else if (p.fee_type === "Other")
          newPaid.kit_fee =
            (parseFloat(newPaid.kit_fee) || 0) + (p.amount || 0);
      });
      // Convert numbers back to strings for controlled inputs
      Object.keys(newPaid).forEach((k) => {
        if (newPaid[k]) newPaid[k] = String(newPaid[k]);
      });
      setPaid(newPaid);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleClear = () => {
    setSelectedStudent(null);
    setSearch("");
    setFees({ ...EMPTY_FEES });
    setPaid({ ...EMPTY_FEES });
  };

  const totalFee = FEE_FIELDS.reduce(
    (sum, f) => sum + (parseFloat(fees[f.key]) || 0),
    0,
  );
  const totalPaid = FEE_FIELDS.reduce(
    (sum, f) => sum + (parseFloat(paid[f.key]) || 0),
    0,
  );
  const totalBalance = totalFee - totalPaid;

  const handleExportPDF = async () => {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "landscape",
    });
    const pageW = 297; // A4 landscape width
    const receiptWidth = 140; // Each receipt width
    const gap = 10; // Gap between receipts
    const logoUrl = "/logo.webp";

    // Load logo image - drawn through a <canvas> and re-encoded as PNG
    // since jsPDF's own WEBP decoding is unreliable across versions;
    // every browser can already decode WEBP into a canvas natively.
    const logoImg = new Image();
    let logoDataUrl = null;
    const logoPromise = new Promise((resolve) => {
      logoImg.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = logoImg.naturalWidth;
          canvas.height = logoImg.naturalHeight;
          canvas.getContext("2d").drawImage(logoImg, 0, 0);
          logoDataUrl = canvas.toDataURL("image/png");
        } catch {
          logoDataUrl = null;
        }
        resolve(true);
      };
      logoImg.onerror = () => resolve(false);
      logoImg.src = logoUrl;
    });
    await logoPromise;

    // Define startY before drawReceipt function
    const startY = 15;

    // Helper function to draw a single receipt
    const drawReceipt = (startX, copyLabel) => {
      let y = startY;
      const centerX = startX + receiptWidth / 2;

      // Add large logo in header area (89% opacity)
      if (logoDataUrl) {
        try {
          doc.setGState(new doc.GState({ opacity: 0.89 }));
          doc.addImage(logoDataUrl, "PNG", centerX - 35, y + 5, 70, 28);
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (e) {}
      }

      // Fee Receipt title
      y += 35;
      doc.setLineWidth(0.5);
      doc.line(startX + 5, y, startX + receiptWidth - 5, y);
      y += 6;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("FEE RECEIPT", centerX, y, { align: "center" });
      y += 8;

      // Copy label
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(`${copyLabel} COPY`, startX + receiptWidth - 5, y, {
        align: "right",
      });

      // Receipt details
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Receipt No: ${receiptNo}`, startX + 5, y);
      y += 5;
      doc.text(`Date: ${receiptDate}`, startX + 5, y);
      y += 8;

      // Student information section
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Student Details:", startX + 5, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Name: ${selectedStudent?.full_name || "—"}`, startX + 5, y);
      doc.text(`Grade: ${selectedStudent?.class || "—"}`, centerX, y);
      doc.text(
        `Admission No: ${selectedStudent?.admission_no || "—"}`,
        startX + receiptWidth - 5,
        y,
        { align: "right" },
      );
      y += 5;
      doc.text(
        `Father's Name: ${selectedStudent?.parent_name || "—"}`,
        startX + 5,
        y,
      );
      doc.text(`Academic Year: ${academicYear}`, centerX, y);
      doc.text(
        `Phone: ${selectedStudent?.parent_phone || "—"}`,
        startX + receiptWidth - 5,
        y,
        { align: "right" },
      );
      y += 8;

      // Payment details header
      doc.setLineWidth(0.5);
      doc.line(startX + 5, y, startX + receiptWidth - 5, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Payment Details:", startX + 5, y);
      y += 6;

      // Fee rows - only show paid items
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      let rowY = y;
      FEE_FIELDS.forEach((f, idx) => {
        const paidAmt = parseFloat(paid[f.key]) || 0;
        if (paidAmt > 0) {
          doc.text(f.label, startX + 7, rowY + 4);
          doc.text(
            paidAmt.toLocaleString("en-IN"),
            startX + receiptWidth - 15,
            rowY + 4,
            { align: "right" },
          );
          rowY += 5;
        }
      });
      y = rowY + 3;

      // Total line
      doc.setLineWidth(0.3);
      doc.line(startX + 5, y, startX + receiptWidth - 5, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("TOTAL AMOUNT PAID", startX + 7, y);
      doc.text(
        `₹${totalPaid.toLocaleString("en-IN")}`,
        startX + receiptWidth - 15,
        y,
        { align: "right" },
      );
      y += 8;

      // Amount in words
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("Amount in Words:", startX + 5, y);
      y += 4;
      const amountWords =
        totalPaid > 0
          ? `Rupees ${numberToWords(totalPaid)} Only`
          : "________________________";
      doc.setFont("helvetica", "italic");
      doc.text(amountWords, startX + 7, y);
      y += 10;

      // Payment method
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Payment Mode: ${paymentMode}`, startX + 5, y);
      y += 8;

      // Balance due (if any)
      if (totalBalance > 0) {
        doc.setFillColor(255, 240, 240);
        doc.roundedRect(startX + 5, y, receiptWidth - 10, 7, 2, 2, "F");
        doc.setTextColor(200, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(
          `Balance Due: ₹${totalBalance.toLocaleString("en-IN")}`,
          startX + 7,
          y + 4.5,
        );
        doc.setTextColor(0, 0, 0);
        y += 10;
      }

      // Footer
      y += 5;
      doc.setLineWidth(0.5);
      doc.line(startX + 5, y, startX + receiptWidth - 5, y);
      y += 6;
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("This is a computer-generated receipt.", centerX, y, {
        align: "center",
      });
      y += 4;
      doc.text("Thank you for your payment.", centerX, y, { align: "center" });
    };

    // Draw both receipts side by side
    drawReceipt(15, "PARENT");
    drawReceipt(15 + receiptWidth + gap, "OFFICE");

    doc.save(
      `receipt-${selectedStudent?.full_name || "student"}-${receiptNo}.pdf`,
    );
  };

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Student Receipt Generation
          </h2>
          <p className="text-sm text-slate-500">
            Generate and export fee receipts as PDF
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={!selectedStudent}
          className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
        >
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>

      {/* Student Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Select Student
        </h3>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              placeholder="Search by name or admission no..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) setSelectedStudent(null);
              }}
              onFocus={() => setShowDropdown(true)}
              autoComplete="off"
            />
            {selectedStudent ? (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            )}
          </div>

          {/* Dropdown list */}
          {showDropdown && !selectedStudent && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  Loading students...
                </div>
              )}
              {!loading && filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  No students found
                </div>
              )}
              {!loading &&
                filtered.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={() => handleSelect(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 border-b border-slate-100 last:border-0 flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                        {s.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.admission_no} · {s.class} {s.section}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {s.status || "Active"}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Selected student info card */}
        {selectedStudent && (
          <div className="mt-3 bg-indigo-50 rounded-lg px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="font-semibold text-slate-800 text-sm">
                {selectedStudent.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Adm No</p>
              <p className="font-medium text-indigo-600 text-sm">
                {selectedStudent.admission_no}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Class</p>
              <p className="font-medium text-slate-700 text-sm">
                {selectedStudent.class} {selectedStudent.section}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Father / Phone</p>
              <p className="font-medium text-slate-700 text-sm">
                {selectedStudent.parent_name || "—"} ·{" "}
                {selectedStudent.parent_phone || "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Receipt Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Receipt No
            </label>
            <Input
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Date
            </label>
            <Input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Academic Year
            </label>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Payment Mode
            </label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Fee Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Fee Breakdown</h3>
            {loadingFees && (
              <span className="text-xs text-slate-400 animate-pulse">
                Loading fees...
              </span>
            )}
            {!loadingFees && selectedStudent && (
              <span className="text-xs text-emerald-400">
                AY: {academicYear}
              </span>
            )}
          </div>
          <div className="flex gap-6 text-xs text-slate-400">
            <span>
              Total:{" "}
              <span className="text-white font-medium">{fmt(totalFee)}</span>
            </span>
            <span>
              Paid:{" "}
              <span className="text-green-400 font-medium">
                {fmt(totalPaid)}
              </span>
            </span>
            <span>
              Balance:{" "}
              <span
                className={`font-medium ${totalBalance > 0 ? "text-red-400" : "text-green-400"}`}
              >
                {fmt(totalBalance)}
              </span>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 w-1/3">
                  Fee Type
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">
                  Total Fee (₹)
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">
                  Amount Paid (₹)
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 w-32">
                  Balance Left
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FEE_FIELDS.map((f) => {
                const feeAmt = parseFloat(fees[f.key]) || 0;
                const paidAmt = parseFloat(paid[f.key]) || 0;
                const bal = feeAmt - paidAmt;
                return (
                  <tr key={f.key} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      {f.label}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        type="number"
                        value={fees[f.key]}
                        onChange={(e) =>
                          setFees((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-8 text-sm text-right w-28 ml-auto"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        type="number"
                        value={paid[f.key]}
                        onChange={(e) =>
                          setPaid((prev) => ({
                            ...prev,
                            [f.key]: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-8 text-sm text-right w-28 ml-auto"
                      />
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-semibold ${feeAmt > 0 ? (bal > 0 ? "text-red-600" : bal < 0 ? "text-amber-600" : "text-green-600") : "text-slate-300"}`}
                    >
                      {feeAmt > 0 ? fmt(bal) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-sm">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right">{fmt(totalFee)}</td>
                <td className="px-4 py-3 text-right text-green-300">
                  {fmt(totalPaid)}
                </td>
                <td
                  className={`px-4 py-3 text-right ${totalBalance > 0 ? "text-red-300" : "text-green-300"}`}
                >
                  {fmt(totalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center pb-4">
        Enter total fee and amount paid per category — balance is
        auto-calculated.
      </p>
    </div>
  );
}
