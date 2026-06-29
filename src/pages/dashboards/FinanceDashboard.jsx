import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingDown,
  CreditCard,
  FileText,
  Receipt,
  BarChart2,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5`}>
    <div className="flex items-center justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300" />
    </div>
    <p className="text-2xl font-black text-slate-800">{value}</p>
    <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default function FinanceDashboard() {
  const [stats, setStats] = useState({
    income: 0,
    expenditure: 0,
    pending: 0,
    paid: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [recentFees, setRecentFees] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entities.FeePayment.list("-payment_date", 50),
      entities.Expenditure.list("-date", 10),
    ]).then(([fees, exps]) => {
      const paid = fees
        .filter((f) => f.status === "Paid")
        .reduce((s, f) => s + (f.amount || 0), 0);
      const pending = fees
        .filter((f) => f.status === "Pending")
        .reduce((s, f) => s + (f.amount || 0), 0);
      const expenditure = exps.reduce((s, e) => s + (e.amount || 0), 0);

      // Monthly chart data
      const monthMap = {};
      fees.forEach((f) => {
        if (!f.payment_date) return;
        const mon = f.payment_date.slice(0, 7);
        if (!monthMap[mon]) monthMap[mon] = { income: 0, expenditure: 0 };
        if (f.status === "Paid") monthMap[mon].income += f.amount || 0;
      });
      exps.forEach((e) => {
        if (!e.date) return;
        const mon = e.date.slice(0, 7);
        if (!monthMap[mon]) monthMap[mon] = { income: 0, expenditure: 0 };
        monthMap[mon].expenditure += e.amount || 0;
      });
      const chart = Object.entries(monthMap)
        .sort()
        .slice(-6)
        .map(([m, v]) => ({
          month: m.slice(5) + "/" + m.slice(2, 4),
          income: v.income,
          exp: v.expenditure,
        }));

      setStats({
        income: paid,
        expenditure,
        pending,
        paid: fees.filter((f) => f.status === "Paid").length,
        pendingCount: fees.filter((f) => f.status === "Pending").length,
      });
      setRecentFees(fees.slice(0, 8));
      setChartData(chart);
      setLoading(false);
    });
  }, []);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">
          Finance Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Real-time financial overview · MasterMinds ERP
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Fee Collected"
          value={loading ? "..." : fmt(stats.income)}
          sub={`${stats.paid} payments`}
          color="bg-emerald-500"
        />
        <StatCard
          icon={Clock}
          label="Pending Fees"
          value={loading ? "..." : fmt(stats.pending)}
          sub={`${stats.pendingCount} students`}
          color="bg-red-500"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Expenditure"
          value={loading ? "..." : fmt(stats.expenditure)}
          color="bg-rose-500"
        />
        <StatCard
          icon={BarChart2}
          label="Net Balance"
          value={loading ? "..." : fmt(stats.income - stats.expenditure)}
          color="bg-indigo-500"
        />
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">
            Monthly Income vs Expenditure
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={16}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="exp"
                  name="Expenditure"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-12">
              No data yet
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentFees.map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                    {f.student_name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {f.fee_type} · {f.payment_date}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold ${f.status === "Paid" ? "text-emerald-600" : "text-red-500"}`}
                >
                  {fmt(f.amount)}
                </span>
              </div>
            ))}
            {recentFees.length === 0 && !loading && (
              <p className="text-slate-400 text-xs">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Fee Payments",
            icon: CreditCard,
            to: "/fees",
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Expenditure",
            icon: TrendingDown,
            to: "/expenditure",
            color: "bg-rose-50 text-rose-700",
          },
          {
            label: "Fee Report",
            icon: FileText,
            to: "/student-fee-report",
            color: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "Student Receipt",
            icon: Receipt,
            to: "/student-receipt",
            color: "bg-amber-50 text-amber-700",
          },
        ].map(({ label, icon: Icon, to, color }) => (
          <Link
            key={label}
            to={to}
            className={`${color} rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow border border-transparent hover:border-current/10`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
