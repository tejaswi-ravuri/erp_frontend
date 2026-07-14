import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  Download,
  Building2,
} from "lucide-react";
import { exportTrackingExpenses } from "@/utils/pdfExport";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { incomeApi, expenditureApi, feeApi, branchApi } from "@/api/api";
import { toast } from "sonner";

const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const todayStr = () => ymd(new Date());
const firstOfMonthStr = () => {
  const d = new Date();
  return ymd(new Date(d.getFullYear(), d.getMonth(), 1));
};
const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

// "YYYY-MM" -> the first/last calendar day of that month.
const monthRangeFor = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
};
// Calendar year -> Jan 1 / Dec 31 of that year.
const yearRangeFor = (year) => ({
  from: ymd(new Date(year, 0, 1)),
  to: ymd(new Date(year, 11, 31)),
});

const apiErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong";

const fmt = (val) => Number(val) || 0;

// Groups a list of records by a real backend field (fee_type / category)
// into sorted [{label, value}] rows - zero-amount buckets are skipped so
// the report only shows what actually happened in the selected period,
// not every possible enum value.
function aggregateByKey(records, keyField) {
  const map = {};
  records.forEach((r) => {
    const key = r[keyField] || "Uncategorized";
    map[key] = fmt(map[key]) + fmt(r.amount);
  });
  return Object.entries(map)
    .filter(([, value]) => value !== 0)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

const sumRows = (rows) => rows.reduce((a, r) => a + fmt(r.value), 0);
const rup = (n) => `₹ ${Math.abs(n).toLocaleString("en-IN")}`;

function BreakdownGroup({ title, rows, total, loading, tone = "emerald" }) {
  const [open, setOpen] = useState(true);
  const toneText = tone === "emerald" ? "text-emerald-700" : "text-red-700";
  const toneHeaderText =
    tone === "emerald" ? "text-emerald-800" : "text-red-800";
  const toneHeaderBg =
    tone === "emerald"
      ? "bg-emerald-50 hover:bg-emerald-100"
      : "bg-red-50 hover:bg-red-100";
  const toneIcon = tone === "emerald" ? "text-emerald-600" : "text-red-600";

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-2.5 transition-colors ${toneHeaderBg}`}
      >
        <span
          className={`text-xs font-bold uppercase tracking-wide ${toneHeaderText}`}
        >
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${toneText}`}>
            {rup(total)}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${toneIcon} ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="px-5 py-4 text-sm text-slate-400">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400">
              No records for this period.
            </p>
          ) : (
            rows.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
              >
                <span className="text-sm text-slate-700 font-medium">
                  {r.label}
                </span>
                <span className={`text-sm font-semibold ${toneText}`}>
                  {rup(r.value)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function BPTrackingExpenses() {
  const { user } = useAuth();
  const isMultiBranch = user?.role === "admin_officer";

  // "range" = pick From/To manually, "month" = whole calendar month,
  // "year" = whole calendar year. All three ultimately just resolve to a
  // fromDate/toDate pair - the fetch/aggregation pipeline below never
  // needs to know which mode produced them.
  const [reportMode, setReportMode] = useState("range");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - i);
  }, []);

  const [fromDate, setFromDate] = useState(firstOfMonthStr());
  const [toDate, setToDate] = useState(todayStr());
  const [pendingFrom, setPendingFrom] = useState(fromDate);
  const [pendingTo, setPendingTo] = useState(toDate);

  // Monthly/Yearly modes apply immediately on selection (like the branch
  // filter) rather than waiting for the "Apply" button, which stays
  // reserved for the free-typing Custom Range date inputs.
  useEffect(() => {
    if (reportMode === "month") {
      const { from, to } = monthRangeFor(selectedMonth);
      setFromDate(from);
      setToDate(to);
      setPendingFrom(from);
      setPendingTo(to);
    } else if (reportMode === "year") {
      const { from, to } = yearRangeFor(selectedYear);
      setFromDate(from);
      setToDate(to);
      setPendingFrom(from);
      setPendingTo(to);
    }
  }, [reportMode, selectedMonth, selectedYear]);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");

  const [loading, setLoading] = useState(true);
  const [feePayments, setFeePayments] = useState([]);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [expenditureRecords, setExpenditureRecords] = useState([]);

  const [showIncome, setShowIncome] = useState(true);
  const [showExp, setShowExp] = useState(true);

  // Admin officers pick which of their assigned branches to view (or all
  // of them combined) - GET /api/branches already only returns branches
  // they're actually assigned to, so no client-side trimming is needed.
  useEffect(() => {
    if (!isMultiBranch) return;
    branchApi
      .list()
      .then((data) => setBranches(data || []))
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, [isMultiBranch]);

  useEffect(() => {
    setLoading(true);
    const branchParam =
      isMultiBranch && selectedBranch !== "all" ? selectedBranch : undefined;
    const params = { from: fromDate, to: toDate, branch: branchParam };

    Promise.all([
      // Only actually-collected fee payments count as income.
      feeApi.listPayments({ ...params, status: "Paid" }),
      incomeApi.list(params),
      expenditureApi.list(params),
    ])
      .then(([fps, incRes, expRes]) => {
        setFeePayments(fps || []);
        setIncomeRecords(incRes?.data || []);
        setExpenditureRecords(expRes?.data || []);
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [fromDate, toDate, selectedBranch, isMultiBranch]);

  const handleApply = () => {
    if (pendingFrom > pendingTo) {
      toast.error("From date must be on or before To date.");
      return;
    }
    setFromDate(pendingFrom);
    setToDate(pendingTo);
  };

  const studentFeeIncome = useMemo(
    () => aggregateByKey(feePayments, "fee_type"),
    [feePayments],
  );
  const otherIncome = useMemo(
    () => aggregateByKey(incomeRecords, "category"),
    [incomeRecords],
  );
  const expenditureBreakdown = useMemo(
    () => aggregateByKey(expenditureRecords, "category"),
    [expenditureRecords],
  );

  const totalStudentFeeIncome = sumRows(studentFeeIncome);
  const totalOtherIncome = sumRows(otherIncome);
  const totalIncome = totalStudentFeeIncome + totalOtherIncome;
  const totalExpenditure = sumRows(expenditureBreakdown);
  const closingBalance = totalIncome - totalExpenditure;
  const isProfit = closingBalance >= 0;

  const branchLabel = !isMultiBranch
    ? undefined
    : selectedBranch === "all"
      ? "All Branches"
      : branches.find((b) => b._id === selectedBranch)?.name ||
        "Selected Branch";

  const periodLabel = useMemo(() => {
    if (reportMode === "month") {
      const [y, m] = selectedMonth.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    }
    if (reportMode === "year") return `Year ${selectedYear}`;
    return fromDate === toDate
      ? new Date(fromDate + "T00:00:00").toLocaleDateString("en-IN", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : `${new Date(fromDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} to ${new Date(toDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
  }, [reportMode, selectedMonth, selectedYear, fromDate, toDate]);

  const handleExport = () => {
    exportTrackingExpenses({
      fromDate,
      toDate,
      periodLabel,
      branchLabel,
      studentFeeIncome,
      otherIncome,
      expenditureRows: expenditureBreakdown,
    });
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Tracking Expenses
          </h2>
          <p className="text-sm text-slate-500">
            Income vs expenditure report — live from Fee Payments, Income and
            Expenditure records
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={loading}
          className="gap-1.5 text-sm border-indigo-300 text-indigo-600 hover:bg-indigo-50"
        >
          <Download className="w-4 h-4" /> Print / Export PDF
        </Button>
      </div>

      {/* ── FILTERS ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0" />

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { key: "range", label: "Custom Range" },
            { key: "month", label: "Monthly" },
            { key: "year", label: "Yearly" },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setReportMode(m.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                reportMode === m.key
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {reportMode === "range" && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                From
              </label>
              <input
                type="date"
                value={pendingFrom}
                onChange={(e) => setPendingFrom(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1 outline-none"
              />
            </div>
            <span className="text-slate-400">→</span>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                To
              </label>
              <input
                type="date"
                value={pendingTo}
                onChange={(e) => setPendingTo(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1 outline-none"
              />
            </div>
          </>
        )}

        {reportMode === "month" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm font-medium text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1 outline-none"
            />
          </div>
        )}

        {reportMode === "year" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Year
            </label>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger className="h-8 text-sm w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isMultiBranch && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-8 text-sm w-48">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {reportMode === "range" ? (
          <Button
            onClick={handleApply}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-sm ml-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Apply"}
          </Button>
        ) : (
          loading && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
            </span>
          )
        )}
      </div>

      {/* ══ TALLY SUMMARY ══ */}
      <div
        className={`rounded-xl border-2 shadow-sm p-5 ${isProfit ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300"}`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          Tally Summary —&nbsp;{periodLabel}
          {branchLabel ? ` · ${branchLabel}` : ""}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Total Income
            </p>
            <p className="text-2xl font-black text-emerald-600">
              {rup(totalIncome)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Total Expenditure
            </p>
            <p className="text-2xl font-black text-red-600">
              {rup(totalExpenditure)}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Closing Balance
            </p>
            <p
              className={`text-2xl font-black ${isProfit ? "text-emerald-700" : "text-red-700"}`}
            >
              {closingBalance < 0 ? "−" : ""}
              {rup(closingBalance)}
            </p>
            <p
              className={`text-[11px] font-bold mt-1 ${isProfit ? "text-emerald-500" : "text-red-500"}`}
            >
              {isProfit ? "▲ Surplus" : "▼ Deficit"}
            </p>
          </div>
        </div>
      </div>

      {/* ── INCOME + EXPENDITURE COLUMNS (collapsible) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* INCOME — split into Student Fee Income and Other Income Sources */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowIncome((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <h3 className="font-semibold text-sm tracking-wide uppercase">
                Income
              </h3>
              <span className="text-xs bg-emerald-500 px-2 py-0.5 rounded-full">
                {rup(totalIncome)}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showIncome ? "rotate-180" : ""}`}
            />
          </button>
          {showIncome && (
            <div className="divide-y divide-slate-200">
              <BreakdownGroup
                title="Student Fee Income"
                rows={studentFeeIncome}
                total={totalStudentFeeIncome}
                loading={loading}
                tone="emerald"
              />
              <BreakdownGroup
                title="Other Income Sources"
                rows={otherIncome}
                total={totalOtherIncome}
                loading={loading}
                tone="emerald"
              />
              <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-t-2 border-emerald-300">
                <span className="font-bold text-emerald-800 text-sm uppercase tracking-wide">
                  Total Income
                </span>
                <span className="font-black text-emerald-700 text-xl">
                  {rup(totalIncome)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* EXPENDITURE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowExp((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <h3 className="font-semibold text-sm tracking-wide uppercase">
                Expenditure
              </h3>
              <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">
                {rup(totalExpenditure)}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showExp ? "rotate-180" : ""}`}
            />
          </button>
          {showExp && (
            <>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <p className="px-5 py-4 text-sm text-slate-400">
                    Loading…
                  </p>
                ) : expenditureBreakdown.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400">
                    No expenditure for this period.
                  </p>
                ) : (
                  expenditureBreakdown.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                    >
                      <span className="text-sm text-slate-700 font-medium">
                        {r.label}
                      </span>
                      <span className="text-sm font-semibold text-red-700">
                        {rup(r.value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-red-50 border-t-2 border-red-300">
                <span className="font-bold text-red-800 text-sm uppercase tracking-wide">
                  Total Expenditure
                </span>
                <span className="font-black text-red-700 text-xl">
                  {rup(totalExpenditure)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
