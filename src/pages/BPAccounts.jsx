import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Download, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function BPAccounts() {
  const [fees, setFees] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([entities.FeePayment.list(), entities.Expenditure.list()]).then(
      ([f, e]) => {
        setFees(f);
        setExpenses(e);
        setLoading(false);
      },
    );
  }, []);

  const totalIncome = fees
    .filter((f) => f.status === "Paid")
    .reduce((s, f) => s + (f.amount || 0), 0);
  const totalExpenditure = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netBalance = totalIncome - totalExpenditure;

  const chartData = MONTHS.map((m, i) => {
    const mi = String(i + 1).padStart(2, "0");
    const income = fees
      .filter((f) => f.payment_date?.includes(`-${mi}-`) && f.status === "Paid")
      .reduce((s, f) => s + (f.amount || 0), 0);
    const expense = expenses
      .filter((e) => e.date?.includes(`-${mi}-`))
      .reduce((s, e) => s + (e.amount || 0), 0);
    return { month: m, Income: income, Expenditure: expense };
  });

  // Year breakdown
  const years = [
    ...new Set(fees.map((f) => f.academic_year).filter(Boolean)),
  ].sort();
  const yearData = years.map((y) => ({
    year: y,
    collected: fees
      .filter((f) => f.academic_year === y && f.status === "Paid")
      .reduce((s, f) => s + (f.amount || 0), 0),
    pending: fees
      .filter((f) => f.academic_year === y && f.status === "Pending")
      .reduce((s, f) => s + (f.amount || 0), 0),
  }));

  // Category breakdown
  const CATEGORIES = [
    "Salaries",
    "Utilities",
    "Maintenance",
    "Supplies",
    "Events",
    "Misc",
  ];
  const catData = CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + (e.amount || 0), 0),
  })).filter((c) => c.total > 0);

  const exportReport = () => {
    const lines = [
      "BrightPath School ERP - Financial Report",
      `Total Income: ₹${totalIncome.toLocaleString("en-IN")}`,
      `Total Expenditure: ₹${totalExpenditure.toLocaleString("en-IN")}`,
      `Net Balance: ₹${netBalance.toLocaleString("en-IN")}`,
      "",
      "Income by Year:",
      ...yearData.map(
        (y) =>
          `  ${y.year}: Collected ₹${y.collected.toLocaleString("en-IN")}, Pending ₹${y.pending.toLocaleString("en-IN")}`,
      ),
      "",
      "Expenditure by Category:",
      ...catData.map(
        (c) => `  ${c.category}: ₹${c.total.toLocaleString("en-IN")}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "financial-report.txt";
    a.click();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Accounts Overview
          </h2>
          <p className="text-sm text-slate-500">Financial summary</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">
              Total Income
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            ₹{totalIncome.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs font-semibold text-red-700">
              Total Expenditure
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ₹{totalExpenditure.toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className={`rounded-xl border p-5 ${netBalance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet
              className={`w-4 h-4 ${netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`}
            />
            <span
              className={`text-xs font-semibold ${netBalance >= 0 ? "text-blue-700" : "text-orange-700"}`}
            >
              Net Balance
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-700" : "text-orange-600"}`}
          >
            ₹{netBalance.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Monthly Income vs Expenditure (12 Months)
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="Income"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Expenditure"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Income by year */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Income by Academic Year
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-xs text-slate-500">Year</th>
                <th className="text-right pb-2 text-xs text-slate-500">
                  Collected
                </th>
                <th className="text-right pb-2 text-xs text-slate-500">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {yearData.map((y) => (
                <tr key={y.year}>
                  <td className="py-2.5 font-medium text-slate-700">
                    {y.year}
                  </td>
                  <td className="py-2.5 text-right text-emerald-600 font-semibold">
                    ₹{y.collected.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-right text-red-500">
                    ₹{y.pending.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expenditure by category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Expenditure by Category
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-2 text-xs text-slate-500">
                  Category
                </th>
                <th className="text-right pb-2 text-xs text-slate-500">
                  Amount
                </th>
                <th className="text-right pb-2 text-xs text-slate-500">
                  % Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {catData.map((c) => (
                <tr key={c.category}>
                  <td className="py-2.5 font-medium text-slate-700">
                    {c.category}
                  </td>
                  <td className="py-2.5 text-right text-slate-800 font-semibold">
                    ₹{c.total.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-right text-slate-500">
                    {totalExpenditure > 0
                      ? Math.round((c.total / totalExpenditure) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
