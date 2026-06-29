import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Save,
  RotateCcw,
  RefreshCw,
  ChevronDown,
  BarChart2,
  Download,
} from "lucide-react";
import { exportTrackingExpenses } from "@/utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { entities } from "@/api/entityClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = (val) => Number(val) || 0;
const sumObj = (obj) => Object.values(obj).reduce((a, b) => a + fmt(b), 0);

const MONTHS = [
  { label: "January 2026", from: "2026-01-01", to: "2026-01-31" },
  { label: "February 2026", from: "2026-02-01", to: "2026-02-28" },
  { label: "March 2026", from: "2026-03-01", to: "2026-03-31" },
  { label: "April 2026", from: "2026-04-01", to: "2026-04-30" },
  { label: "May 2026", from: "2026-05-01", to: "2026-05-31" },
  { label: "June 2026", from: "2026-06-01", to: "2026-06-30" },
  { label: "July 2026", from: "2026-07-01", to: "2026-07-31" },
  { label: "August 2026", from: "2026-08-01", to: "2026-08-31" },
  { label: "September 2026", from: "2026-09-01", to: "2026-09-30" },
  { label: "October 2026", from: "2026-10-01", to: "2026-10-31" },
  { label: "November 2026", from: "2026-11-01", to: "2026-11-30" },
  { label: "December 2026", from: "2026-12-01", to: "2026-12-31" },
];

const INCOME_LABELS = {
  school_fee: "School Fee",
  admission_fee: "Admission Fee",
  old_fee: "Old Fee",
  transport_fee: "Transport Fee",
  text_book_fee: "Text Book Fee",
  study_material_fee: "Study Material Fee",
  iit_material_fee: "IIT Material Fee",
};

const EXP_LABELS = {
  salaries: "Salaries",
  rent: "Rent",
  bus_emi: "Bus EMI",
  diesel: "Diesel",
  electricity_bill: "Electricity Bill",
  maintenance: "Maintenance",
  supplies: "Supplies",
  events: "Events",
  misc: "Misc",
};

const FEE_TYPE_MAP = {
  Tuition: "school_fee",
  Annual: "school_fee",
  Transport: "transport_fee",
  Exam: "school_fee",
  Other: "school_fee",
};

const EXP_CAT_MAP = {
  Salaries: "salaries",
  Utilities: "electricity_bill",
  Maintenance: "maintenance",
  Supplies: "supplies",
  Events: "events",
  Misc: "misc",
};

const BLANK_INCOME = () =>
  Object.fromEntries(Object.keys(INCOME_LABELS).map((k) => [k, ""]));
const BLANK_EXP = () =>
  Object.fromEntries(Object.keys(EXP_LABELS).map((k) => [k, ""]));

const storageKey = (from, to) => `tracking_v3_${from}_${to}`;
const loadSaved = (from, to) => {
  try {
    const r = localStorage.getItem(storageKey(from, to));
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};
const persistSave = (from, to, inc, exp) =>
  localStorage.setItem(
    storageKey(from, to),
    JSON.stringify({ income: inc, expenditure: exp }),
  );

export default function BPTrackingExpenses() {
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());
  const [income, setIncome] = useState(BLANK_INCOME());
  const [expenditure, setExpenditure] = useState(BLANK_EXP());
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [dbLoaded, setDbLoaded] = useState(false);

  // Monthly report state
  const [showMonthly, setShowMonthly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [allFeePayments, setAllFeePayments] = useState([]);
  const [allExpenditures, setAllExpenditures] = useState([]);
  const [masterLoaded, setMasterLoaded] = useState(false);

  // Load all data once on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [fps, exps] = await Promise.all([
          entities.FeePayment.list(),
          entities.Expenditure.list(),
        ]);
        setAllFeePayments(fps);
        setAllExpenditures(exps);
        setMasterLoaded(true);
        applyDateFilter(todayStr(), todayStr(), fps, exps);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const aggregateForRange = (from, to, fps, exps) => {
    const inRange = (d) => d && d >= from && d <= to;
    const incAgg = BLANK_INCOME();
    fps.forEach((fp) => {
      if (!inRange(fp.payment_date)) return;
      const key = FEE_TYPE_MAP[fp.fee_type] || "school_fee";
      incAgg[key] = fmt(incAgg[key]) + fmt(fp.amount);
    });
    const expAgg = BLANK_EXP();
    exps.forEach((ex) => {
      if (!inRange(ex.date)) return;
      const key = EXP_CAT_MAP[ex.category] || "misc";
      // Also detect rent/bus emi/diesel from description
      const desc = (ex.description || "").toLowerCase();
      const cat = (ex.category || "").toLowerCase();
      let finalKey = EXP_CAT_MAP[ex.category] || "misc";
      if (desc.includes("rent")) finalKey = "rent";
      else if (desc.includes("bus emi") || desc.includes("emi"))
        finalKey = "bus_emi";
      else if (desc.includes("diesel")) finalKey = "diesel";
      expAgg[finalKey] = fmt(expAgg[finalKey]) + fmt(ex.amount);
    });
    return { incAgg, expAgg };
  };

  const applyDateFilter = (from, to, fps, exps) => {
    const saved = loadSaved(from, to);
    if (saved) {
      setIncome(saved.income);
      setExpenditure(saved.expenditure);
      setDbLoaded(true);
      return;
    }
    const { incAgg, expAgg } = aggregateForRange(from, to, fps, exps);
    setIncome(
      Object.fromEntries(
        Object.entries(incAgg).map(([k, v]) => [k, v === 0 ? "" : v]),
      ),
    );
    setExpenditure(
      Object.fromEntries(
        Object.entries(expAgg).map(([k, v]) => [k, v === 0 ? "" : v]),
      ),
    );
    setDbLoaded(true);
  };

  const handleApply = () => {
    if (!masterLoaded || fromDate > toDate) return;
    setSavedMsg("");
    applyDateFilter(fromDate, toDate, allFeePayments, allExpenditures);
  };

  const handleSave = () => {
    persistSave(fromDate, toDate, income, expenditure);
    setSavedMsg(
      `Saved for ${fromDate === toDate ? fromDate : `${fromDate} → ${toDate}`}`,
    );
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const handleReset = () => {
    setIncome(BLANK_INCOME());
    setExpenditure(BLANK_EXP());
    setSavedMsg("");
    localStorage.removeItem(storageKey(fromDate, toDate));
  };

  // Monthly report loader
  const loadMonthlyReport = (month) => {
    setSelectedMonth(month);
    setMonthlyLoading(true);
    setTimeout(() => {
      const { incAgg, expAgg } = aggregateForRange(
        month.from,
        month.to,
        allFeePayments,
        allExpenditures,
      );
      const totalInc = sumObj(incAgg);
      const totalExp = sumObj(expAgg);
      setMonthlyData({
        income: incAgg,
        expenditure: expAgg,
        totalIncome: totalInc,
        totalExpenditure: totalExp,
        balance: totalInc - totalExp,
      });
      setMonthlyLoading(false);
    }, 100);
  };

  const totalIncome = sumObj(income);
  const totalExpenditure = sumObj(expenditure);
  const closingBalance = totalIncome - totalExpenditure;
  const isProfit = closingBalance >= 0;

  const rup = (n) => `₹ ${Math.abs(n).toLocaleString("en-IN")}`;

  // Build monthly cash flow chart data (all 12 months from DB)
  const cashFlowChartData = masterLoaded
    ? MONTHS.map((m) => {
        const { incAgg, expAgg } = aggregateForRange(
          m.from,
          m.to,
          allFeePayments,
          allExpenditures,
        );
        const inc = sumObj(incAgg);
        const exp = sumObj(expAgg);
        return {
          month: m.label.split(" ")[0].slice(0, 3),
          Income: inc,
          Expenditure: exp,
          "Net Balance": inc - exp,
        };
      })
    : [];

  // Collapsible state for income & expenditure panels
  const [showIncome, setShowIncome] = useState(true);
  const [showExp, setShowExp] = useState(true);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-slate-700 mb-2">{label} 2026</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-6">
            <span style={{ color: p.color }} className="font-medium">
              {p.name}
            </span>
            <span className="font-bold">
              ₹ {Math.abs(p.value).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    );
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
            Daily income vs expenditure ledger — auto-populated from live data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm"
          >
            <Save className="w-4 h-4" /> Save
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-1.5 text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportTrackingExpenses({
                fromDate,
                toDate,
                income,
                expenditure,
                incomeLabels: INCOME_LABELS,
                expLabels: EXP_LABELS,
              })
            }
            className="gap-1.5 text-sm border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          >
            <Download className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* ── DATE RANGE FILTER ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0" />
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
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
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-sm font-medium text-slate-700 bg-transparent border border-slate-200 rounded-md px-2 py-1 outline-none"
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={loading || !masterLoaded}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-sm ml-1"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Apply"}
        </Button>
        {dbLoaded && (
          <span className="text-xs text-emerald-600 ml-1">
            ✓ Loaded from database — editable
          </span>
        )}
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2 rounded-lg">
          ✅ {savedMsg}
        </div>
      )}

      {/* ══ TALLY SUMMARY (TOP) ══ */}
      <div
        className={`rounded-xl border-2 shadow-sm p-5 ${isProfit ? "bg-emerald-50 border-emerald-300" : "bg-red-50 border-red-300"}`}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          Tally Summary —&nbsp;
          {fromDate === toDate
            ? new Date(fromDate + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : `${new Date(fromDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} to ${new Date(toDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Total Income
            </p>
            <p className="text-2xl font-black text-emerald-600">
              {rup(totalIncome)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {Object.keys(INCOME_LABELS).length} streams
            </p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Total Expenditure
            </p>
            <p className="text-2xl font-black text-red-600">
              {rup(totalExpenditure)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {Object.keys(EXP_LABELS).length} heads
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
        <div className="mt-3 text-center text-sm text-slate-600 bg-white/80 rounded-lg py-2 px-4 border border-slate-200 font-mono">
          {rup(totalIncome)} <span className="text-slate-400 mx-1">−</span>{" "}
          {rup(totalExpenditure)}
          <span className="text-slate-400 mx-1">=</span>
          <span
            className={`font-black text-base ${isProfit ? "text-emerald-700" : "text-red-700"}`}
          >
            {closingBalance < 0 ? "−" : ""}
            {rup(closingBalance)}
          </span>
        </div>
      </div>

      {/* ── INCOME + EXPENDITURE COLUMNS (collapsible) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* INCOME STREAM — collapsible */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowIncome((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <h3 className="font-semibold text-sm tracking-wide uppercase">
                Income Stream
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
            <>
              <div className="divide-y divide-slate-100">
                {Object.entries(INCOME_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <label className="text-sm text-slate-700 font-medium w-44 shrink-0">
                      {label}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 text-sm font-medium">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={income[key] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setIncome((prev) => ({
                            ...prev,
                            [key]:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          }))
                        }
                        className="pl-7 w-44 text-right text-sm font-semibold text-emerald-700 border-slate-200 focus:border-emerald-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-t-2 border-emerald-300">
                <span className="font-bold text-emerald-800 text-sm uppercase tracking-wide">
                  Total Income
                </span>
                <span className="font-black text-emerald-700 text-xl">
                  {rup(totalIncome)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* DAILY EXPENDITURE — collapsible */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowExp((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <h3 className="font-semibold text-sm tracking-wide uppercase">
                Daily Expenditure
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
                {Object.entries(EXP_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <label className="text-sm text-slate-700 font-medium w-44 shrink-0">
                      {label}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400 text-sm font-medium">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        value={expenditure[key] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setExpenditure((prev) => ({
                            ...prev,
                            [key]:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          }))
                        }
                        className="pl-7 w-44 text-right text-sm font-semibold text-red-700 border-slate-200 focus:border-red-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-5 py-4 bg-red-50 border-t-2 border-red-300">
                <span className="font-bold text-red-800 text-sm uppercase tracking-wide">
                  Total Expenditure
                </span>
                <span className="font-black text-red-700 text-xl">
                  {rup(totalExpenditure)}
                </span>
              </div>
              {/* Cash Flow Chart inside Expenditure panel */}
              {masterLoaded && cashFlowChartData.length > 0 && (
                <div className="px-5 py-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-800 text-sm">
                      Monthly Cash Flow — 2026
                    </span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      Income vs Expenditure
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={cashFlowChartData}
                      margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                      />
                      <ReferenceLine y={0} stroke="#e2e8f0" />
                      <Bar
                        dataKey="Income"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Expenditure"
                        fill="#dc2626"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="Net Balance"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ MONTHLY REPORT DROPDOWN ══ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => {
            setShowMonthly((v) => {
              if (!v && masterLoaded) loadMonthlyReport(selectedMonth);
              return !v;
            });
          }}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-800">
              Monthly Reports — 2026
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              12 months
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${showMonthly ? "rotate-180" : ""}`}
          />
        </button>

        {showMonthly && (
          <div className="border-t border-slate-200">
            {/* Month selector tabs */}
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2">
              {MONTHS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => loadMonthlyReport(m)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    selectedMonth.label === m.label
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m.label.split(" ")[0].slice(0, 3)}
                </button>
              ))}
            </div>

            {monthlyLoading && (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading{" "}
                {selectedMonth.label}...
              </div>
            )}

            {!monthlyLoading && monthlyData && (
              <div className="p-5 space-y-4">
                <h4 className="font-bold text-slate-700">
                  {selectedMonth.label} — Monthly Report
                </h4>

                {/* Month tally summary */}
                <div
                  className={`grid grid-cols-3 gap-3 text-center rounded-xl p-4 ${monthlyData.balance >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}
                >
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">
                      Income
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      {rup(monthlyData.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">
                      Expenditure
                    </p>
                    <p className="text-xl font-black text-red-600">
                      {rup(monthlyData.totalExpenditure)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-1">
                      Closing Balance
                    </p>
                    <p
                      className={`text-xl font-black ${monthlyData.balance >= 0 ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {monthlyData.balance < 0 ? "−" : ""}
                      {rup(monthlyData.balance)}
                    </p>
                    <p
                      className={`text-[11px] font-bold mt-0.5 ${monthlyData.balance >= 0 ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {monthlyData.balance >= 0 ? "▲ Profit" : "▼ Loss"}
                    </p>
                  </div>
                </div>

                {/* Detailed breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Income breakdown */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide">
                      Income Breakdown
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(INCOME_LABELS).map(([key, label]) => {
                          const val = fmt(monthlyData.income[key]);
                          if (val === 0) return null;
                          return (
                            <tr
                              key={key}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-2 text-slate-600">
                                {label}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-emerald-700">
                                {rup(val)}
                              </td>
                            </tr>
                          );
                        })}
                        {Object.values(monthlyData.income).every(
                          (v) => fmt(v) === 0,
                        ) && (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-3 text-center text-slate-400 text-xs"
                            >
                              No income data for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                          <td className="px-4 py-2 font-bold text-emerald-800 text-xs uppercase">
                            Total
                          </td>
                          <td className="px-4 py-2 text-right font-black text-emerald-700">
                            {rup(monthlyData.totalIncome)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Expenditure breakdown */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wide">
                      Expenditure Breakdown
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(EXP_LABELS).map(([key, label]) => {
                          const val = fmt(monthlyData.expenditure[key]);
                          if (val === 0) return null;
                          return (
                            <tr
                              key={key}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-2 text-slate-600">
                                {label}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-red-700">
                                {rup(val)}
                              </td>
                            </tr>
                          );
                        })}
                        {Object.values(monthlyData.expenditure).every(
                          (v) => fmt(v) === 0,
                        ) && (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-4 py-3 text-center text-slate-400 text-xs"
                            >
                              No expenditure data for this period
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-red-50 border-t-2 border-red-200">
                          <td className="px-4 py-2 font-bold text-red-800 text-xs uppercase">
                            Total
                          </td>
                          <td className="px-4 py-2 text-right font-black text-red-700">
                            {rup(monthlyData.totalExpenditure)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
