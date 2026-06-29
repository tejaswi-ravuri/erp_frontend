import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import {
  Plus,
  Pencil,
  Trash2,
  Printer,
  Download,
  Search,
  ArrowUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudentFeeReportForm from "@/components/fees/StudentFeeReportForm";

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtNum = (n) => (n || 0).toLocaleString("en-IN");

function SummaryCard({ label, value, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`${colors[color]} border rounded-xl px-5 py-4`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function StudentFeeReportPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterBalance, setFilterBalance] = useState("all");
  const [sortBy, setSortBy] = useState("sno");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await entities.StudentFeeReport.list("sno");
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Inline update for type or status dropdowns
  const handleInlineUpdate = async (id, field, value) => {
    await entities.StudentFeeReport.update(id, { [field]: value });
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const filtered = records
    .filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        (r.student_name || "").toLowerCase().includes(q) ||
        (r.student_id || "").toLowerCase().includes(q);
      const matchClass = filterClass === "all" || r.class === filterClass;
      const matchType = filterType === "all" || r.student_type === filterType;
      const bal = r.balance_term_fee || 0;
      const matchBalance =
        filterBalance === "all" ||
        (filterBalance === "pending" && bal > 0) ||
        (filterBalance === "cleared" && bal <= 0);
      return matchSearch && matchClass && matchType && matchBalance;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === "sno") {
        aVal = a.sno || 0;
        bVal = b.sno || 0;
      } else if (sortBy === "name") {
        aVal = a.student_name || "";
        bVal = b.student_name || "";
      } else if (sortBy === "class") {
        aVal = a.class || "";
        bVal = b.class || "";
      } else if (sortBy === "paid") {
        aVal = a.paid_term_fee || 0;
        bVal = b.paid_term_fee || 0;
      } else if (sortBy === "balance") {
        aVal = a.balance_term_fee || 0;
        bVal = b.balance_term_fee || 0;
      } else if (sortBy === "net_fee") {
        aVal = a.net_term_fee || 0;
        bVal = b.net_term_fee || 0;
      }
      if (typeof aVal === "string")
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const totals = filtered.reduce(
    (acc, r) => ({
      old_fee: acc.old_fee + (r.old_fee || 0),
      adm_gross_fee: acc.adm_gross_fee + (r.adm_gross_fee || 0),
      adm_concession: acc.adm_concession + (r.adm_concession || 0),
      net_adm_fee: acc.net_adm_fee + (r.net_adm_fee || 0),
      paid_adm_fee: acc.paid_adm_fee + (r.paid_adm_fee || 0),
      balance_adm_fee: acc.balance_adm_fee + (r.balance_adm_fee || 0),
      gross_term_fee: acc.gross_term_fee + (r.gross_term_fee || 0),
      term_concession: acc.term_concession + (r.term_concession || 0),
      net_term_fee: acc.net_term_fee + (r.net_term_fee || 0),
      paid_term_fee: acc.paid_term_fee + (r.paid_term_fee || 0),
      balance_term_fee: acc.balance_term_fee + (r.balance_term_fee || 0),
    }),
    {
      old_fee: 0,
      adm_gross_fee: 0,
      adm_concession: 0,
      net_adm_fee: 0,
      paid_adm_fee: 0,
      balance_adm_fee: 0,
      gross_term_fee: 0,
      term_concession: 0,
      net_term_fee: 0,
      paid_term_fee: 0,
      balance_term_fee: 0,
    },
  );

  const summaryTotals = records.reduce(
    (acc, r) => ({
      net_term_fee: acc.net_term_fee + (r.net_term_fee || 0),
      paid_term_fee: acc.paid_term_fee + (r.paid_term_fee || 0),
      balance_term_fee: acc.balance_term_fee + (r.balance_term_fee || 0),
    }),
    { net_term_fee: 0, paid_term_fee: 0, balance_term_fee: 0 },
  );

  const classes = [
    ...new Set(records.map((r) => r.class).filter(Boolean)),
  ].sort();

  const handleDelete = async (r) => {
    if (!confirm(`Delete record for ${r.student_name}?`)) return;
    await entities.StudentFeeReport.delete(r.id);
    load();
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleExport = () => {
    const headers = [
      "S.No",
      "Student ID",
      "Student Name",
      "Father Name",
      "Mob Number",
      "Class",
      "Type",
      "Adm Gross Fee",
      "Adm Concession",
      "Net Adm Fee",
      "Paid Adm Fee",
      "Balance Adm Fee",
      "Old Fee",
      "Gross Term Fee 26-27",
      "Term Concession",
      "Net Term Fee",
      "Paid Term Fee",
      "Balance Fee",
      "Remarks",
      "Status",
    ];
    const rows = filtered.map((r, i) => [
      i + 1,
      r.student_id,
      r.student_name,
      r.father_name,
      r.mob_number,
      r.class,
      r.student_type,
      r.adm_gross_fee || 0,
      r.adm_concession || 0,
      r.net_adm_fee || 0,
      r.paid_adm_fee || 0,
      r.balance_adm_fee || 0,
      r.old_fee || 0,
      r.gross_term_fee || 0,
      r.term_concession || 0,
      r.net_term_fee || 0,
      r.paid_term_fee || 0,
      r.balance_term_fee || 0,
      r.remarks || "",
      r.status || "Active",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      6, 12, 22, 20, 14, 10, 10, 14, 14, 14, 14, 16, 10, 16, 14, 14, 14, 14, 20,
      10,
    ].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Report 2026-27");
    XLSX.writeFile(wb, "student-fee-report-2026-27.xlsx");
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Student Fee Report — 2026-27
          </h2>
          <p className="text-sm text-slate-500">
            Complete fee collection status for all students
          </p>
        </div>
        <div className="flex items-center gap-2 no-print flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Student Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          label="Total Students"
          value={records.length}
          color="indigo"
        />
        <SummaryCard
          label="Total Net Term Fee"
          value={fmt(summaryTotals.net_term_fee)}
          color="blue"
        />
        <SummaryCard
          label="Total Paid Term Fee"
          value={fmt(summaryTotals.paid_term_fee)}
          color="green"
        />
        <SummaryCard
          label="Total Balance Fee"
          value={fmt(summaryTotals.balance_term_fee)}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name or ID..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Existing">Existing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBalance} onValueChange={setFilterBalance}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Balance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Balance</SelectItem>
            <SelectItem value="pending">Pending Balance</SelectItem>
            <SelectItem value="cleared">Fully Cleared</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sno">Sort: S.No</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="class">Sort: Class</SelectItem>
            <SelectItem value="net_fee">Sort: Net Fee</SelectItem>
            <SelectItem value="paid">Sort: Paid</SelectItem>
            <SelectItem value="balance">Sort: Balance</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-sm"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortDir === "asc" ? "A→Z" : "Z→A"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th
                  colSpan={7}
                  className="bg-blue-600 text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r border-blue-500"
                >
                  Student Information
                </th>
                <th
                  colSpan={5}
                  className="bg-green-700 text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r border-green-600"
                >
                  Admission Fee Details
                </th>
                <th
                  colSpan={6}
                  className="bg-amber-700 text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r border-amber-600"
                >
                  Term Fee 2026-27
                </th>
                <th className="bg-slate-600 text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r border-slate-500">
                  Remarks
                </th>
                <th className="bg-purple-700 text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r border-purple-600">
                  Status
                </th>
                <th className="bg-slate-700 text-white text-center py-2 px-2 font-semibold text-xs uppercase tracking-wide no-print">
                  Actions
                </th>
              </tr>
              <tr className="bg-slate-100 border-b border-slate-300">
                {[
                  "S.No",
                  "Student ID",
                  "Student Name",
                  "Father Name",
                  "Mob Number",
                  "Class",
                  "Type",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200"
                  >
                    {h}
                  </th>
                ))}
                {[
                  "Adm Gross Fee",
                  "Concession",
                  "Net Adm Fee",
                  "Paid Adm Fee",
                  "Balance Adm Fee",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-right px-3 py-2 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200"
                  >
                    {h}
                  </th>
                ))}
                {[
                  "Old Fee",
                  "Gross Term Fee 26-27",
                  "Concession",
                  "Net Term Fee",
                  "Paid Term Fee",
                  "Balance Fee",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-right px-3 py-2 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200"
                  >
                    {h}
                  </th>
                ))}
                <th className="text-left px-3 py-2 font-semibold text-slate-600 border-r border-slate-200">
                  Remarks
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-600 border-r border-slate-200">
                  Status
                </th>
                <th className="text-center px-2 py-2 font-semibold text-slate-600 no-print">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={21} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={21} className="text-center py-10 text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const admBal = r.balance_adm_fee || 0;
                  const termBal = r.balance_term_fee || 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-500 border-r border-slate-100">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 text-indigo-600 font-medium border-r border-slate-100 whitespace-nowrap">
                        {r.student_id}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                        {r.student_name}
                      </td>
                      <td className="px-3 py-2 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                        {r.father_name}
                      </td>
                      <td className="px-3 py-2 text-slate-600 border-r border-slate-100">
                        {r.mob_number}
                      </td>
                      <td className="px-3 py-2 text-slate-700 font-medium border-r border-slate-100">
                        {r.class}
                      </td>
                      {/* Type badge */}
                      <td className="px-3 py-2 border-r border-slate-100">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.student_type === "Existing" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          {r.student_type || "—"}
                        </span>
                      </td>
                      {/* Admission Fee */}
                      <td className="px-3 py-2 text-right text-slate-700 border-r border-slate-100">
                        {fmtNum(r.adm_gross_fee)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 border-r border-slate-100">
                        {fmtNum(r.adm_concession)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800 border-r border-slate-100">
                        {fmtNum(r.net_adm_fee)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 border-r border-slate-100">
                        {fmtNum(r.paid_adm_fee)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold border-r border-slate-100 ${admBal > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {admBal > 0 ? fmtNum(admBal) : "₹0"}
                      </td>
                      {/* Term Fee */}
                      <td className="px-3 py-2 text-right text-slate-600 border-r border-slate-100">
                        {r.student_type === "New" ? "—" : fmtNum(r.old_fee)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 border-r border-slate-100">
                        {fmtNum(r.gross_term_fee)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 border-r border-slate-100">
                        {fmtNum(r.term_concession)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800 border-r border-slate-100">
                        {fmtNum(r.net_term_fee)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-medium border-r border-slate-100 ${(r.paid_term_fee || 0) >= (r.net_term_fee || 0) && (r.net_term_fee || 0) > 0 ? "text-green-600" : "text-amber-600"}`}
                      >
                        {fmtNum(r.paid_term_fee)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold border-r border-slate-100 ${termBal > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {termBal > 0 ? fmtNum(termBal) : "₹0"}
                      </td>
                      <td className="px-3 py-2 text-slate-500 border-r border-slate-100 max-w-[100px]">
                        <span title={r.remarks}>
                          {r.remarks && r.remarks.length > 15
                            ? r.remarks.slice(0, 15) + "…"
                            : r.remarks || "—"}
                        </span>
                      </td>
                      {/* Status badge */}
                      <td className="px-3 py-2 border-r border-slate-100">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === "Active" || !r.status ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                        >
                          {r.status || "Active"}
                        </span>
                      </td>
                      <td className="px-2 py-2 no-print">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditing(r);
                              setShowForm(true);
                            }}
                            className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Totals row */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-800 text-white font-bold text-xs">
                  <td
                    colSpan={7}
                    className="px-3 py-2.5 text-right text-slate-300 border-r border-slate-600"
                  >
                    TOTALS ({filtered.length} students)
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.adm_gross_fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.adm_concession)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.net_adm_fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.paid_adm_fee)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right border-r border-slate-600 ${totals.balance_adm_fee > 0 ? "text-red-300" : "text-green-300"}`}
                  >
                    {fmtNum(totals.balance_adm_fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.old_fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.gross_term_fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.term_concession)}
                  </td>
                  <td className="px-3 py-2.5 text-right border-r border-slate-600">
                    {fmtNum(totals.net_term_fee)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-green-300 border-r border-slate-600">
                    {fmtNum(totals.paid_term_fee)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right border-r border-slate-600 ${totals.balance_term_fee > 0 ? "text-red-300" : "text-green-300"}`}
                  >
                    {fmtNum(totals.balance_term_fee)}
                  </td>
                  <td colSpan={3} className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showForm && (
        <StudentFeeReportForm
          record={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
          nextSno={records.length + 1}
        />
      )}
    </div>
  );
}
