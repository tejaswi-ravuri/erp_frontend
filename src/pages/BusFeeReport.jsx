import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Bus, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

const CLASSES = [
  "All",
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

export default function BusFeeReport() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [fees, studs] = await Promise.all([
        entities.FeePayment.filter({ fee_type: "Transport" }),
        entities.Student.list(),
      ]);
      setRecords(fees);
      setStudents(studs);
      setLoading(false);
    };
    load();
  }, []);

  // Build enriched rows: one per student who has at least one Transport fee, or show all transport payments
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const filtered = records.filter((r) => {
    const stu = studentMap[r.student_id];
    const stuClass = stu?.class || "";
    const matchClass = classFilter === "All" || stuClass === classFilter;
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchSearch =
      !search ||
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_id?.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchStatus && matchSearch;
  });

  const totalPaid = filtered
    .filter((r) => r.status === "Paid")
    .reduce((s, r) => s + (r.amount || 0), 0);
  const totalPending = filtered
    .filter((r) => r.status === "Pending")
    .reduce((s, r) => s + (r.amount || 0), 0);

  const exportXLSX = () => {
    const data = filtered.map((r, i) => ({
      "S.No": i + 1,
      "Student Name": r.student_name,
      Class: studentMap[r.student_id]?.class || "—",
      "Academic Year": r.academic_year,
      "Amount (₹)": r.amount,
      "Payment Date": r.payment_date || "—",
      "Payment Mode": r.payment_mode,
      "Receipt No": r.receipt_no || "—",
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bus Fee Report");
    XLSX.writeFile(wb, "BusFeeReport.xlsx");
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img src="/logo.webp" alt="The Masterminds School" className="h-9 w-auto" />
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Bus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Bus Fee Report
            </h2>
            <p className="text-sm text-slate-500">
              Transport fee collection records
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportXLSX}
            className="text-sm gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-sm gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">
            Total Records
          </p>
          <p className="text-2xl font-bold text-slate-700">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Collected</p>
          <p className="text-2xl font-bold text-emerald-600">
            ₹{totalPaid.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-500 font-medium mb-1">Pending</p>
          <p className="text-2xl font-bold text-red-500">
            ₹{totalPending.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 text-sm"
        />
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36 text-sm">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            {CLASSES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "S.No",
                  "Student Name",
                  "Class",
                  "Year",
                  "Amount",
                  "Date",
                  "Mode",
                  "Receipt No",
                  "Status",
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
                    colSpan={9}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`transition-colors ${r.status === "Pending" ? "bg-red-50 border-l-4 border-l-red-400 hover:bg-red-100" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${r.status === "Pending" ? "text-red-700" : "text-slate-800"}`}
                    >
                      {r.student_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {studentMap[r.student_id]?.class || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.academic_year}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${r.status === "Pending" ? "text-red-600" : "text-slate-700"}`}
                    >
                      ₹{Number(r.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.payment_date || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.payment_mode}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {r.receipt_no || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No bus fee records found.
                  </td>
                </tr>
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-xs font-bold text-slate-600 uppercase"
                  >
                    Total ({filtered.length} records)
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    ₹{(totalPaid + totalPending).toLocaleString("en-IN")}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
