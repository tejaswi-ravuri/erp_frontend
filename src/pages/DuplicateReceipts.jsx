import React, { useState, useEffect, useMemo } from "react";
import { classApi, studentApi, feeApi } from "@/api/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, FileText } from "lucide-react";
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

export default function DuplicateReceipts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const resolvedBranchId =
    typeof user?.branch === "object" ? user?.branch?._id : user?.branch;

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Classes scoped to the accounts manager's own branch - same pattern as
  // the Add Payment dialog in BPFees.jsx.
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

  // Plain student list (not feeApi.listEligibleStudents, which only
  // returns Active students) - a student who's left should still be
  // reachable here to reprint an old receipt.
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    studentApi
      .list({ class: selectedClassId })
      .then((data) => setStudents(data || []))
      .catch((err) =>
        toast({
          title: "Failed to load students",
          description: apiErrorMessage(err),
          variant: "destructive",
        }),
      );
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedStudentId) {
      setPayments([]);
      return;
    }
    setLoadingPayments(true);
    feeApi
      .listPayments({ student_id: selectedStudentId })
      .then((data) => setPayments(data?.data || data || []))
      .catch((err) =>
        toast({
          title: "Failed to load payment history",
          description: apiErrorMessage(err),
          variant: "destructive",
        }),
      )
      .finally(() => setLoadingPayments(false));
  }, [selectedStudentId]);

  const selectedStudent = students.find((s) => s._id === selectedStudentId);
  const currentYear = getCurrentAcademicYear();

  // One printed receipt can span several FeePayment docs sharing one
  // receipt_no (collectPayment() creates one doc per fee-type row) - group
  // them back together so a reprint matches what was originally handed
  // over, rather than listing every fee-type row as its own line.
  const receiptGroups = useMemo(() => {
    const map = new Map();
    payments.forEach((p) => {
      const key = p.receipt_no || p._id;
      if (!map.has(key)) {
        map.set(key, {
          receipt_no: p.receipt_no,
          payment_date: p.payment_date,
          academic_year: p.academic_year,
          status: p.status,
          items: [],
          total: 0,
        });
      }
      const group = map.get(key);
      group.items.push(p);
      group.total += Number(p.amount) || 0;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.payment_date) - new Date(a.payment_date),
    );
  }, [payments]);

  const printGroup = (group) => printFeeReceipt(group.items);

  // Full-history reprint - same current-vs-old-year split already used by
  // "printStudentReceipt" in BPFees.jsx, excluding Cancelled entries.
  const printFullHistory = () => {
    const active = payments.filter((p) => p.status !== "Cancelled");
    const current = active.filter((p) => p.academic_year === currentYear);
    const old = active.filter((p) => p.academic_year !== currentYear);
    printFeeReceipt(current, old);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Duplicate Receipts
        </h2>
        <p className="text-sm text-slate-500">
          Look up a student's full fee payment history and reprint any
          receipt.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Class
          </label>
          <Select
            value={selectedClassId}
            onValueChange={(v) => {
              setSelectedClassId(v);
              setSelectedStudentId("");
              setPayments([]);
            }}
          >
            <SelectTrigger className="text-sm w-full">
              <SelectValue placeholder="Select class" />
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
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            Student
          </label>
          <Select
            value={selectedStudentId}
            onValueChange={setSelectedStudentId}
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
              {students.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.full_name}
                  {s.admission_no ? ` (${s.admission_no})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedStudentId && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div>
              <p className="font-semibold text-slate-800">
                {selectedStudent?.full_name || "—"}
              </p>
              <p className="text-xs text-slate-500">
                Admission No: {selectedStudent?.admission_no || "—"}
                {selectedStudent?.status
                  ? ` · ${selectedStudent.status}`
                  : ""}
              </p>
            </div>
            <Button
              size="sm"
              onClick={printFullHistory}
              disabled={receiptGroups.length === 0}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FileText className="w-3.5 h-3.5" /> Print Full History
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Receipt No",
                    "Date",
                    "Academic Year",
                    "Items",
                    "Total",
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
                {loadingPayments && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!loadingPayments && receiptGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No payments found for this student.
                    </td>
                  </tr>
                )}
                {!loadingPayments &&
                  receiptGroups.map((group) => (
                    <tr
                      key={group.receipt_no || group.items[0]?._id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {group.receipt_no || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {group.payment_date
                          ? String(group.payment_date).split("T")[0]
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {group.academic_year}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {group.items.map((p) => p.fee_type).join(", ")}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        ₹{group.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={group.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => printGroup(group)}
                          title="Print this receipt"
                          className="text-indigo-500 hover:text-indigo-700 transition-colors p-1 rounded hover:bg-indigo-50"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
