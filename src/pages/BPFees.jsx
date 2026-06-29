import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import {
  Plus,
  AlertCircle,
  CheckCircle,
  Printer,
  Bell,
  BellRing,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const EMPTY = {
  student_id: "",
  student_name: "",
  academic_year: "2024-25",
  fee_type: "Tuition",
  amount: "",
  payment_date: new Date().toISOString().split("T")[0],
  payment_mode: "Cash",
  receipt_no: "",
  status: "Paid",
};

const CLASSES = [
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

export default function BPFees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [yearFilter, setYearFilter] = useState("2024-25");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [remindedIds, setRemindedIds] = useState(new Set());
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [f, s] = await Promise.all([
      entities.FeePayment.list("-payment_date"),
      entities.Student.list(),
    ]);
    setFees(f);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const save = async () => {
    await entities.FeePayment.create({
      ...form,
      amount: Number(form.amount),
    });
    setShowForm(false);
    setForm(EMPTY);
    setSelectedClass("");
    load();
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY);
    setSelectedClass("");
  };

  const filtered = fees.filter((f) => {
    const my = yearFilter === "All" || f.academic_year === yearFilter;
    const ms = statusFilter === "All" || f.status === statusFilter;
    return my && ms;
  });

  const sendReminder = (fee, bulk = false) => {
    setRemindedIds((prev) => new Set([...prev, fee.id]));
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
  const pendingStudents = fees.filter(
    (f) => f.status === "Pending" && f.academic_year === "2024-25",
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
            Pending Students (2024-25)
          </p>
          <div className="space-y-1 mt-2">
            {pendingStudents.slice(0, 5).map((f) => (
              <div
                key={f.id}
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
          {["All", "2023-24", "2024-25"].map((y) => (
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
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
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
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((f) => (
                  <tr
                    key={f.id}
                    className={`hover:bg-red-50 transition-colors ${f.status === "Pending" ? "bg-red-50 border-l-4 border-l-red-400" : ""}`}
                  >
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
                      {f.payment_date}
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
                          className={`p-1 rounded transition-colors ${remindedIds.has(f.id) ? "text-amber-500 bg-amber-50" : "text-red-400 hover:text-red-600 hover:bg-red-50"}`}
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
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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

      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Fee Payment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Class
              </label>
              <Select
                value={selectedClass}
                onValueChange={(v) => {
                  setSelectedClass(v);
                  setForm({ ...form, student_id: "", student_name: "" });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select class first" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Student
              </label>
              <Select
                value={form.student_id}
                onValueChange={(v) => {
                  const s = students.find((st) => st.id === v);
                  setForm({
                    ...form,
                    student_id: v,
                    student_name: s?.full_name || "",
                  });
                }}
                disabled={!selectedClass}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue
                    placeholder={
                      selectedClass ? "Select student" : "Select class first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter((s) => s.class === selectedClass)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "Receipt No", key: "receipt_no" },
              { label: "Amount (₹)", key: "amount", type: "number" },
              { label: "Payment Date", key: "payment_date", type: "date" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  {f.label}
                </label>
                <Input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
            ))}
            {[
              {
                label: "Academic Year",
                key: "academic_year",
                opts: ["2023-24", "2024-25"],
              },
              {
                label: "Fee Type",
                key: "fee_type",
                opts: ["Tuition", "Annual", "Transport", "Exam", "Other"],
              },
              {
                label: "Payment Mode",
                key: "payment_mode",
                opts: ["Cash", "Online", "Cheque"],
              },
              { label: "Status", key: "status", opts: ["Paid", "Pending"] },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  {f.label}
                </label>
                <Select
                  value={form[f.key]}
                  onValueChange={(v) => setForm({ ...form, [f.key]: v })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {f.opts.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              onClick={save}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
