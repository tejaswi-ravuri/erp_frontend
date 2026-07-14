import React, { useState, useEffect } from "react";
import { feeApi, classApi } from "@/api/api";
import { useAuth } from "@/lib/AuthContext";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Printer,
  Receipt,
  Bell,
  BellRing,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/bp/StatusBadge";
import { printFeeReceipt } from "@/utils/pdfExport";

// Indian school-year convention: April -> next March.
function getCurrentAcademicYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return month >= 4
    ? `${year}-${String(year + 1).slice(-2)}`
    : `${year - 1}-${String(year).slice(-2)}`;
}

const apiErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong";

// Matches FEE_PAYMENT_MODES in models/FeePayment.js.
const PAYMENT_MODES = [
  "Cash",
  "Cheque",
  "Swipe machine",
  "Paytm",
  "GooglePay",
  "PhonePay",
  "OnlineTransfer",
  "Others",
];

// Modes where bank routing details are meaningful proof (as opposed to
// POS/wallet transaction IDs, which don't have a bank_name/bank_branch).
const BANK_MODES = ["Cheque", "OnlineTransfer"];

const EMPTY_FORM = {
  student_id: "",
  student_name: "",
  academic_year: getCurrentAcademicYear(),
  // Itemized rows, matching collectPayment()'s rows: [{key, amount}]
  // contract - each maps 1:1 to a StudentFeeReport bucket (paid_term_fee /
  // paid_adm_fee / old_fee / paid_transport_fee / paid_application_fee /
  // paid_registration_fee). "School Fee" is the only input for the Term
  // Fee bucket - a separate "Term Fee" input used to exist here but paid
  // into the exact same balance, so it was folded into this one. Left
  // blank = that row is skipped entirely.
  schoolFeeAmount: "",
  admissionFeeAmount: "",
  previousDueAmount: "",
  applicationFeeAmount: "",
  transportFeeAmount: "",
  registrationFeeAmount: "",
  payment_date: new Date().toISOString().split("T")[0],
  payment_mode: "Cash",
  voucher_type: "MvNo",
  transaction_no: "",
  cheque_date: "",
  bank_name: "",
  bank_branch: "",
};

export default function BPFees() {
  const { user } = useAuth();
  const { toast } = useToast();

  const resolvedBranchId =
    typeof user?.branch === "object" ? user?.branch?._id : user?.branch;

  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [feeReport, setFeeReport] = useState(null);

  const [yearFilter, setYearFilter] = useState(getCurrentAcademicYear());
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remindedIds, setRemindedIds] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Set right after a successful collectPayment() - while truthy, the Add
  // Payment dialog shows a "Print Receipt" confirmation instead of the
  // input form, so staff can print an Office+Parent copy before closing.
  const [justCollected, setJustCollected] = useState(null);

  // `background: true` is used by the 10s poll below - it refreshes
  // `fees` in place without touching `loading`, so a silent sync never
  // blanks the table to a "Loading..." row. Only the first mount shows
  // the spinner.
  const load = ({ background = false } = {}) => {
    if (!background) setLoading(true);
    feeApi
      .listPayments()
      .then((data) => setFees(data?.data || data || []))
      .catch((err) =>
        toast({
          title: "Failed to load fee payments",
          description: apiErrorMessage(err),
          variant: "destructive",
        }),
      )
      .finally(() => {
        if (!background) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ background: true }), 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Classes scoped to the accounts manager's own branch + current
  // academic year - no branch picker, since this role only ever
  // operates within their own branch.
  useEffect(() => {
    if (!resolvedBranchId) return;
    classApi
      .list()
      .then((data) => setClasses(data?.data || data || []))
      .catch((err) =>
        toast({
          title: "Failed to load classes",
          description: apiErrorMessage(err),
          variant: "destructive",
        }),
      );
  }, [resolvedBranchId]);

  useEffect(() => {
    if (!selectedClassId) {
      setEligibleStudents([]);
      return;
    }
    feeApi
      .listEligibleStudents({ class: selectedClassId })
      .then((data) => setEligibleStudents(data?.data || data || []))
      .catch((err) =>
        toast({
          title: "Failed to load students",
          description: apiErrorMessage(err),
          variant: "destructive",
        }),
      );
  }, [selectedClassId]);

  const needsProof = form.payment_mode !== "Cash";
  const needsBankDetails = BANK_MODES.includes(form.payment_mode);

  const totalRowsAmount =
    (Number(form.schoolFeeAmount) || 0) +
    (Number(form.admissionFeeAmount) || 0) +
    (Number(form.previousDueAmount) || 0) +
    (Number(form.applicationFeeAmount) || 0) +
    (Number(form.transportFeeAmount) || 0) +
    (Number(form.registrationFeeAmount) || 0);

  // collectPayment() requires an existing StudentFeeReport id, so unlike
  // an earlier draft of this page, this is a hard block, not just a
  // warning - there's nothing to collect a payment against otherwise.
  const canSave =
    !!form.student_id &&
    !!feeReport &&
    totalRowsAmount > 0 &&
    (!needsProof || !!form.transaction_no) &&
    !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const rows = [];
      if (Number(form.schoolFeeAmount) > 0)
        rows.push({ key: "school_fee", amount: Number(form.schoolFeeAmount) });
      if (Number(form.admissionFeeAmount) > 0)
        rows.push({
          key: "admission_fee",
          amount: Number(form.admissionFeeAmount),
        });
      if (Number(form.previousDueAmount) > 0)
        rows.push({
          key: "previous_due",
          amount: Number(form.previousDueAmount),
        });
      if (Number(form.applicationFeeAmount) > 0)
        rows.push({
          key: "application_fee",
          amount: Number(form.applicationFeeAmount),
        });
      if (Number(form.transportFeeAmount) > 0)
        rows.push({
          key: "transport_fee",
          amount: Number(form.transportFeeAmount),
        });
      if (Number(form.registrationFeeAmount) > 0)
        rows.push({
          key: "registration_fee",
          amount: Number(form.registrationFeeAmount),
        });

      const payload = {
        student_fee_report_id: feeReport._id,
        student_id: form.student_id,
        student_name: form.student_name,
        academic_year: form.academic_year,
        payment_date: form.payment_date,
        voucher_type: form.voucher_type,
        payment_mode: form.payment_mode,
        rows,
      };
      if (needsProof) payload.transaction_no = form.transaction_no;
      if (form.payment_mode === "Cheque")
        payload.cheque_date = form.cheque_date;
      if (needsBankDetails) {
        payload.bank_name = form.bank_name;
        payload.bank_branch = form.bank_branch;
      }

      const { payments } = await feeApi.collectPayment(payload);
      toast({
        title: "Payment recorded",
        description: `₹${totalRowsAmount.toLocaleString("en-IN")} recorded for ${form.student_name}.`,
      });
      setJustCollected({
        payments: payments || [],
        student_name: form.student_name,
        total: totalRowsAmount,
      });
      load();
    } catch (err) {
      toast({
        title: "Failed to save payment",
        description: apiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setSelectedClassId("");
    setEligibleStudents([]);
    setFeeReport(null);
    setJustCollected(null);
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const filtered = fees.filter((f) => {
    const my = yearFilter === "All" || f.academic_year === yearFilter;
    const ms = statusFilter === "All" || f.status === statusFilter;
    return my && ms;
  });

  // Splits a set of payments into "this academic year" vs everything else,
  // so a printed receipt can call out older dues as "Old Fee" - see
  // printFeeReceipt in pdfExport.js, which renders whatever two groups
  // it's given without knowing anything about academic years itself.
  const splitByCurrentYear = (payments) => ({
    current: payments.filter((p) => p.academic_year === currentYear),
    old: payments.filter((p) => p.academic_year !== currentYear),
  });

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      filtered.length > 0 && prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map((f) => f._id)),
    );
  };

  const printSelected = () => {
    const selected = filtered.filter((f) => selectedIds.has(f._id));
    if (selected.length === 0) return;
    const { current, old } = splitByCurrentYear(selected);
    printFeeReceipt(current, old);
    setSelectedIds(new Set());
  };

  // One-click "this student's full receipt" - every payment they've made
  // this academic year, with anything from an older year broken out into
  // its own "Old Fee" section on the same PDF.
  const printStudentReceipt = (fee) => {
    const studentPayments = fees.filter(
      (f) => f.student_id === fee.student_id && f.status !== "Cancelled",
    );
    const { current, old } = splitByCurrentYear(studentPayments);
    printFeeReceipt(current, old);
  };

  const sendReminder = (fee, bulk = false) => {
    setRemindedIds((prev) => new Set([...prev, fee._id]));
    if (!bulk) {
      toast({
        title: "📢 Reminder Sent",
        description: `Fee reminder sent to ${fee.student_name} for ₹${Number(fee.amount || 0).toLocaleString("en-IN")} (${fee.fee_type}).`,
      });
    }
  };

  const remindAllPending = () => {
    const pending = filtered.filter((f) => f.status === "Pending");
    if (pending.length === 0) return;
    pending.forEach((f) => sendReminder(f, true));
    toast({
      title: "📢 Reminders Sent",
      description: `Fee reminders sent to ${pending.length} student${pending.length > 1 ? "s" : ""} with pending fees.`,
    });
  };

  const totalCollected = fees
    .filter((f) => f.status === "Paid")
    .reduce((s, f) => s + (f.amount || 0), 0);
  const totalPending = fees
    .filter((f) => f.status === "Pending")
    .reduce((s, f) => s + (f.amount || 0), 0);
  const currentYear = getCurrentAcademicYear();
  const pendingStudents = fees.filter(
    (f) => f.status === "Pending" && f.academic_year === currentYear,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Fee / Income</h2>
          <p className="text-sm text-slate-500">Fee collection records</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={remindAllPending}
            className="text-sm gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          >
            <BellRing className="w-4 h-4" /> Remind All Pending
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Payment
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 font-medium">
              Total Collected
            </span>
          </div>
          <p className="text-xl font-bold text-emerald-600">
            ₹{totalCollected.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-slate-500 font-medium">
              Total Pending
            </span>
          </div>
          <p className="text-xl font-bold text-red-500">
            ₹{totalPending.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-500 font-medium mb-1">
            Pending Students ({currentYear})
          </p>
          <div className="space-y-1 mt-2">
            {pendingStudents.slice(0, 5).map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-700">{f.student_name}</span>
                <span className="text-red-500 font-medium">
                  ₹{Number(f.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            {pendingStudents.length === 0 && (
              <p className="text-xs text-slate-400">All fees paid!</p>
            )}
          </div>
        </div>
      </div>

      {/* Year toggle + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {["All", currentYear].map((y) => (
            <button
              key={y}
              onClick={() => setYearFilter(y)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${yearFilter === y ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
            >
              {y}
            </button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={printSelected}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Printer className="w-3.5 h-3.5" /> Print Selected (
            {selectedIds.size})
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={
                      filtered.length > 0 && selectedIds.size === filtered.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                {[
                  "Receipt No",
                  "Student",
                  "Year",
                  "Fee Type",
                  "Amount",
                  "Date",
                  "Mode",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && fees.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {(!loading || fees.length > 0) &&
                filtered.map((f) => (
                  <tr
                    key={f._id}
                    className={`hover:bg-red-50 transition-colors ${f.status === "Pending" ? "bg-red-50 border-l-4 border-l-red-400" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(f._id)}
                        onCheckedChange={() => toggleSelected(f._id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {f.receipt_no || "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${f.status === "Pending" ? "text-red-700" : "text-slate-800"}`}
                    >
                      {f.student_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.academic_year}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{f.fee_type}</td>
                    <td
                      className={`px-4 py-3 font-medium ${f.status === "Pending" ? "text-red-600" : "text-slate-700"}`}
                    >
                      ₹{Number(f.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {f.payment_date
                        ? String(f.payment_date).split("T")[0]
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.payment_mode}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={f.status} />
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1">
                      {f.status === "Pending" && (
                        <button
                          onClick={() => sendReminder(f)}
                          title="Send fee reminder"
                          className={`p-1 rounded transition-colors ${remindedIds.has(f._id) ? "text-amber-500 bg-amber-50" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => printFeeReceipt(f)}
                        title="Print Receipt PDF"
                        className="text-indigo-500 hover:text-indigo-700 transition-colors p-1 rounded hover:bg-indigo-50"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printStudentReceipt(f)}
                        title="Print full receipt for this student (this academic year, old fee separated)"
                        className="text-teal-500 hover:text-teal-700 transition-colors p-1 rounded hover:bg-teal-50"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent
          className="max-w-lg max-h-[85vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Add Fee Payment</DialogTitle>
          </DialogHeader>
          {justCollected ? (
            <div className="mt-2 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Payment of ₹{justCollected.total.toLocaleString("en-IN")}{" "}
                recorded for {justCollected.student_name}.
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeForm}>
                  Done
                </Button>
                <Button
                  onClick={() =>
                    printFeeReceipt(justCollected.payments, [], {
                      copies: ["Parent Copy", "Office Copy"],
                    })
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </Button>
              </div>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Step 1 - Class */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Class
              </label>
              <Select
                value={selectedClassId}
                onValueChange={(v) => {
                  setSelectedClassId(v);
                  setForm((f) => ({ ...f, student_id: "", student_name: "" }));
                  setFeeReport(null);
                }}
              >
                <SelectTrigger className="text-sm w-full">
                  <SelectValue placeholder="Select class first" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {["LKG", "UKG"].includes(c.grade)
                        ? c.grade
                        : `Class ${c.grade}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2 - Student, via listEligibleStudents (Active only,
                each annotated with whether it already has a fee report) */}
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Student
              </label>
              <Select
                value={form.student_id}
                onValueChange={(v) => {
                  const s = eligibleStudents.find((e) => e.student_id === v);
                  setForm((f) => ({
                    ...f,
                    student_id: v,
                    student_name: s?.name || "",
                  }));
                  setFeeReport(s?.existing_report || null);
                }}
                disabled={!selectedClassId}
              >
                <SelectTrigger className="text-sm w-full">
                  <SelectValue
                    placeholder={
                      selectedClassId ? "Select student" : "Select class first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eligibleStudents.map((s) => (
                    <SelectItem key={s.student_id} value={s.student_id}>
                      {s.name}
                      {!s.has_report ? " (no fee report)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3 - blocked if this student has no fee report yet,
                since collectPayment() requires student_fee_report_id */}
            {form.student_id && !feeReport && (
              <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                No fee report found for this student - assign one on the Student
                Fee Report page before collecting payment.
              </div>
            )}

            {form.student_id && feeReport && (
              <>
                {/* Step 4 - itemized amount per bucket, matching
                    collectPayment()'s rows contract exactly */}
                <div className="col-span-2 space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount Being Paid Now (leave a row blank to skip it)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        School Fee
                      </label>
                      <p className="text-[11px] text-slate-400 mb-1">
                        Balance ₹
                        {(feeReport.balance_term_fee || 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                      <Input
                        type="number"
                        value={form.schoolFeeAmount}
                        onChange={(e) =>
                          setField("schoolFeeAmount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Admission Fee
                      </label>
                      <p className="text-[11px] text-slate-400 mb-1">
                        Balance ₹
                        {(feeReport.balance_adm_fee || 0).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                      <Input
                        type="number"
                        value={form.admissionFeeAmount}
                        onChange={(e) =>
                          setField("admissionFeeAmount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Previous Due
                      </label>
                      <p className="text-[11px] text-slate-400 mb-1">
                        ₹{(feeReport.old_fee || 0).toLocaleString("en-IN")}
                      </p>
                      <Input
                        type="number"
                        value={form.previousDueAmount}
                        onChange={(e) =>
                          setField("previousDueAmount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Application Fee
                      </label>
                      {feeReport.has_application_fee && (
                        <p className="text-[11px] text-slate-400 mb-1">
                          Balance ₹
                          {(
                            feeReport.balance_application_fee || 0
                          ).toLocaleString("en-IN")}
                        </p>
                      )}
                      <Input
                        type="number"
                        value={form.applicationFeeAmount}
                        onChange={(e) =>
                          setField("applicationFeeAmount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Transport Fee
                      </label>
                      {feeReport.has_transport_fee && (
                        <p className="text-[11px] text-slate-400 mb-1">
                          Balance ₹
                          {(
                            feeReport.balance_transport_fee || 0
                          ).toLocaleString("en-IN")}
                        </p>
                      )}
                      <Input
                        type="number"
                        value={form.transportFeeAmount}
                        onChange={(e) =>
                          setField("transportFeeAmount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Registration Fee
                      </label>
                      {feeReport.has_registration_fee && (
                        <p className="text-[11px] text-slate-400 mb-1">
                          Balance ₹
                          {(
                            feeReport.balance_registration_fee || 0
                          ).toLocaleString("en-IN")}
                        </p>
                      )}
                      <Input
                        type="number"
                        value={form.registrationFeeAmount}
                        onChange={(e) =>
                          setField("registrationFeeAmount", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 5 - Voucher type */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Voucher Type
                  </label>
                  <Select
                    value={form.voucher_type}
                    onValueChange={(v) => setField("voucher_type", v)}
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MvNo">MV No.</SelectItem>
                      <SelectItem value="CvNo">CV No.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 6 - Payment mode */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Payment Mode
                  </label>
                  <Select
                    value={form.payment_mode}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        payment_mode: v,
                        transaction_no: "",
                        cheque_date: "",
                        bank_name: "",
                        bank_branch: "",
                      }))
                    }
                  >
                    <SelectTrigger className="text-sm w-full">
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

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Payment Date
                  </label>
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setField("payment_date", e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Step 7 - proof, conditional on mode */}
                {form.payment_mode === "Cheque" && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Cheque Number
                      </label>
                      <Input
                        value={form.transaction_no}
                        onChange={(e) =>
                          setField("transaction_no", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Cheque Date
                      </label>
                      <Input
                        type="date"
                        value={form.cheque_date}
                        onChange={(e) =>
                          setField("cheque_date", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Bank Name
                      </label>
                      <Input
                        value={form.bank_name}
                        onChange={(e) => setField("bank_name", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Bank Branch
                      </label>
                      <Input
                        value={form.bank_branch}
                        onChange={(e) =>
                          setField("bank_branch", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </>
                )}

                {form.payment_mode === "OnlineTransfer" && (
                  <>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Transaction ID
                      </label>
                      <Input
                        value={form.transaction_no}
                        onChange={(e) =>
                          setField("transaction_no", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Bank Name
                      </label>
                      <Input
                        value={form.bank_name}
                        onChange={(e) => setField("bank_name", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">
                        Bank Branch
                      </label>
                      <Input
                        value={form.bank_branch}
                        onChange={(e) =>
                          setField("bank_branch", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>
                  </>
                )}

                {[
                  "Swipe machine",
                  "Paytm",
                  "GooglePay",
                  "PhonePay",
                  "Others",
                ].includes(form.payment_mode) && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Transaction ID / Reference No.
                    </label>
                    <Input
                      value={form.transaction_no}
                      onChange={(e) =>
                        setField("transaction_no", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!canSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
