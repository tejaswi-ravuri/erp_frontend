import React, { useState, useEffect, useMemo } from "react";
import { feeApi, classApi } from "@/api/api";
import { toast } from "sonner";
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
import StatusBadge from "@/components/bp/StatusBadge";

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
const fmtNum = (n) => (n || 0).toLocaleString("en-IN");

// One entry per fee bucket - drives the column groups, per-row cells, and
// totals row below so all five buckets render identically. Mirrors
// FEE_BUCKETS in feeController.js/StudentFeeReportForm.jsx (field names must
// match the StudentFeeReport schema exactly).
const FEE_BUCKETS = [
  {
    key: "adm",
    flag: "has_admission_fee",
    label: "Admission Fee",
    headerBg: "bg-green-700",
    headerBorder: "border-green-600",
    gross: "adm_gross_fee",
    concession: "adm_concession",
    net: "net_adm_fee",
    paid: "paid_adm_fee",
    balance: "balance_adm_fee",
  },
  {
    key: "term",
    flag: "has_term_fee",
    label: "Term Fee",
    headerBg: "bg-amber-700",
    headerBorder: "border-amber-600",
    gross: "gross_term_fee",
    concession: "term_concession",
    net: "net_term_fee",
    paid: "paid_term_fee",
    balance: "balance_term_fee",
  },
  {
    key: "transport",
    flag: "has_transport_fee",
    label: "Transport Fee",
    headerBg: "bg-sky-700",
    headerBorder: "border-sky-600",
    gross: "transport_gross_fee",
    concession: "transport_concession",
    net: "net_transport_fee",
    paid: "paid_transport_fee",
    balance: "balance_transport_fee",
  },
  {
    key: "application",
    flag: "has_application_fee",
    label: "Application Fee",
    headerBg: "bg-purple-700",
    headerBorder: "border-purple-600",
    gross: "application_gross_fee",
    concession: "application_concession",
    net: "net_application_fee",
    paid: "paid_application_fee",
    balance: "balance_application_fee",
  },
  {
    key: "registration",
    flag: "has_registration_fee",
    label: "Registration Fee",
    headerBg: "bg-rose-700",
    headerBorder: "border-rose-600",
    gross: "registration_gross_fee",
    concession: "registration_concession",
    net: "net_registration_fee",
    paid: "paid_registration_fee",
    balance: "balance_registration_fee",
  },
];

// StudentFeeReport.class is a real Class reference now (ObjectId), not a
// plain string - see models/StudentFeeReport.js. This resolves either a
// populated {_id, grade} object (the list endpoint populates it) or a
// bare ObjectId string (fallback via classesById), so this page works
// either way.
const classIdOf = (c) => (c && typeof c === "object" ? c._id : c);
const classLabelOf = (c, classesById) => {
  if (c && typeof c === "object" && c.grade) return `Class ${c.grade}`;
  const found = classesById[c];
  return found ? `Class ${found.grade}` : "—";
};

const apiErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong";

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
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterBalance, setFilterBalance] = useState("all");
  const [filterOldFee, setFilterOldFee] = useState("all");
  const [sortBy, setSortBy] = useState("sno");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const classesById = useMemo(
    () => Object.fromEntries(classes.map((c) => [c._id, c])),
    [classes],
  );

  // `background: true` is used by the 10s poll below - it refreshes
  // `records` in place without touching `loading`, so a silent sync
  // never blanks the table out to a "Loading..." row. Only the very
  // first mount (background=false, the default) shows the spinner.
  const load = ({ background = false } = {}) => {
    if (!background) setLoading(true);
    feeApi
      .listReports({ sort: "sno" })
      .then((data) => {
        setRecords(data);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => {
        if (!background) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    classApi
      .list()
      .then((data) => {
        setClasses(data.data);
      })
      .catch((err) => toast.error(apiErrorMessage(err)));
    const interval = setInterval(() => load({ background: true }), 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleInlineUpdate = async (id, field, value) => {
    try {
      await feeApi.updateReport(id, { [field]: value });
      setRecords((prev) =>
        prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)),
      );
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
          (r.student_name || "").toLowerCase().includes(q) ||
          (r.mob_number || "").toLowerCase().includes(q);
        const matchClass =
          filterClass === "all" || classIdOf(r.class) === filterClass;
        const matchType = filterType === "all" || r.student_type === filterType;
        const bal = r.balance_term_fee || 0;
        const matchBalance =
          filterBalance === "all" ||
          (filterBalance === "pending" && bal > 0) ||
          (filterBalance === "cleared" && bal <= 0);
        const oldFee = r.old_fee || 0;
        const matchOldFee =
          filterOldFee === "all" ||
          (filterOldFee === "has" && oldFee > 0) ||
          (filterOldFee === "none" && oldFee <= 0);
        return (
          matchSearch && matchClass && matchType && matchBalance && matchOldFee
        );
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
          aVal = classLabelOf(a.class, classesById);
          bVal = classLabelOf(b.class, classesById);
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
  }, [
    records,
    search,
    filterClass,
    filterType,
    filterBalance,
    filterOldFee,
    sortBy,
    sortDir,
    classesById,
  ]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          acc.old_fee += r.old_fee || 0;
          for (const b of FEE_BUCKETS) {
            acc[b.gross] += r[b.gross] || 0;
            acc[b.concession] += r[b.concession] || 0;
            acc[b.net] += r[b.net] || 0;
            acc[b.paid] += r[b.paid] || 0;
            acc[b.balance] += r[b.balance] || 0;
          }
          return acc;
        },
        FEE_BUCKETS.reduce(
          (acc, b) => ({
            ...acc,
            [b.gross]: 0,
            [b.concession]: 0,
            [b.net]: 0,
            [b.paid]: 0,
            [b.balance]: 0,
          }),
          { old_fee: 0 },
        ),
      ),
    [filtered],
  );

  const summaryTotals = useMemo(
    () =>
      records.reduce(
        (acc, r) => ({
          net_term_fee: acc.net_term_fee + (r.net_term_fee || 0),
          paid_term_fee: acc.paid_term_fee + (r.paid_term_fee || 0),
          balance_term_fee: acc.balance_term_fee + (r.balance_term_fee || 0),
        }),
        { net_term_fee: 0, paid_term_fee: 0, balance_term_fee: 0 },
      ),
    [records],
  );

  const handleDelete = async (r) => {
    if (!confirm(`Delete record for ${r.student_name}?`)) return;
    try {
      await feeApi.removeReport(r._id);
      toast.success("Record deleted.");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleExport = () => {
    const headers = [
      "S.No",
      "Admission No",
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
      "Gross Term Fee",
      "Term Concession",
      "Net Term Fee",
      "Paid Term Fee",
      "Balance Fee",
      "Transport Gross Fee",
      "Transport Concession",
      "Net Transport Fee",
      "Paid Transport Fee",
      "Balance Transport Fee",
      "Application Gross Fee",
      "Application Concession",
      "Net Application Fee",
      "Paid Application Fee",
      "Balance Application Fee",
      "Registration Gross Fee",
      "Registration Concession",
      "Net Registration Fee",
      "Paid Registration Fee",
      "Balance Registration Fee",
      "Remarks",
      "Status",
    ];
    const rows = filtered.map((r, i) => [
      i + 1,
      r.student_id,
      r.student_name,
      r.father_name,
      r.mob_number,
      classLabelOf(r.class, classesById),
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
      r.transport_gross_fee || 0,
      r.transport_concession || 0,
      r.net_transport_fee || 0,
      r.paid_transport_fee || 0,
      r.balance_transport_fee || 0,
      r.application_gross_fee || 0,
      r.application_concession || 0,
      r.net_application_fee || 0,
      r.paid_application_fee || 0,
      r.balance_application_fee || 0,
      r.registration_gross_fee || 0,
      r.registration_concession || 0,
      r.net_registration_fee || 0,
      r.paid_registration_fee || 0,
      r.balance_registration_fee || 0,
      r.remarks || "",
      r.status || "Active",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Report");
    XLSX.writeFile(wb, "student-fee-report.xlsx");
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Student Fee Report
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
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 gap-1"
          >
            <Plus className="w-4 h-4" /> Add Student Record
          </Button>
        </div>
      </div>

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

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name or mobile..."
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
              <SelectItem key={c._id} value={c._id}>
                Class {c.grade}
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
        <Select value={filterOldFee} onValueChange={setFilterOldFee}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Old Fee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All (Old Fee)</SelectItem>
            <SelectItem value="has">Has Old Fee</SelectItem>
            <SelectItem value="none">No Old Fee</SelectItem>
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
                <th className="bg-slate-500 text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r border-slate-400">
                  Previous Due
                </th>
                {FEE_BUCKETS.map((b) => (
                  <th
                    key={b.key}
                    colSpan={6}
                    className={`${b.headerBg} text-white text-center py-2 px-3 font-semibold text-xs uppercase tracking-wide border-r ${b.headerBorder}`}
                  >
                    {b.label} Details
                  </th>
                ))}
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
                  "Admission No",
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
                <th className="text-right px-3 py-2 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">
                  Old Fee
                </th>
                {FEE_BUCKETS.map((b) => (
                  <React.Fragment key={b.key}>
                    {["Gross", "Concession", "Net", "Paid", "Balance", "Status"].map(
                      (h) => (
                        <th
                          key={`${b.key}-${h}`}
                          className="text-right px-3 py-2 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </React.Fragment>
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
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={41} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={41} className="text-center py-10 text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  return (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-500 border-r border-slate-100">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 text-indigo-600 font-medium border-r border-slate-100 whitespace-nowrap">
                        {typeof r.student_id === "object"
                          ? r.student_id?.admission_no || r.student_id?._id
                          : r.student_id}
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
                        {classLabelOf(r.class, classesById)}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-100">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.student_type === "Existing" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          {r.student_type || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600 border-r border-slate-100">
                        {r.student_type === "New" ? "—" : fmtNum(r.old_fee)}
                      </td>
                      {FEE_BUCKETS.map((b) => {
                        const has = r[b.flag];
                        const balance = r[b.balance] || 0;
                        return (
                          <React.Fragment key={b.key}>
                            <td className="px-3 py-2 text-right text-slate-700 border-r border-slate-100">
                              {has ? fmtNum(r[b.gross]) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-600 border-r border-slate-100">
                              {has ? fmtNum(r[b.concession]) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-slate-800 border-r border-slate-100">
                              {has ? fmtNum(r[b.net]) : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700 border-r border-slate-100">
                              {has ? fmtNum(r[b.paid]) : "—"}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-semibold border-r border-slate-100 ${
                                !has
                                  ? ""
                                  : balance > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                              }`}
                            >
                              {has ? fmtNum(balance) : "—"}
                            </td>
                            <td className="px-3 py-2 text-center border-r border-slate-100">
                              {has ? (
                                <StatusBadge value={balance > 0 ? "Pending" : "Paid"} />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="px-3 py-2 text-slate-500 border-r border-slate-100 max-w-[100px]">
                        <span title={r.remarks}>
                          {r.remarks && r.remarks.length > 15
                            ? r.remarks.slice(0, 15) + "…"
                            : r.remarks || "—"}
                        </span>
                      </td>
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
                    {fmtNum(totals.old_fee)}
                  </td>
                  {FEE_BUCKETS.map((b) => (
                    <React.Fragment key={b.key}>
                      <td className="px-3 py-2.5 text-right border-r border-slate-600">
                        {fmtNum(totals[b.gross])}
                      </td>
                      <td className="px-3 py-2.5 text-right border-r border-slate-600">
                        {fmtNum(totals[b.concession])}
                      </td>
                      <td className="px-3 py-2.5 text-right border-r border-slate-600">
                        {fmtNum(totals[b.net])}
                      </td>
                      <td className="px-3 py-2.5 text-right text-green-300 border-r border-slate-600">
                        {fmtNum(totals[b.paid])}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right border-r border-slate-600 ${totals[b.balance] > 0 ? "text-red-300" : "text-green-300"}`}
                      >
                        {fmtNum(totals[b.balance])}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-600"></td>
                    </React.Fragment>
                  ))}
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
        />
      )}
    </div>
  );
}
