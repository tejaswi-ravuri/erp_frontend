import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { entities } from "@/api/entityClient";
import {
  Users,
  Briefcase,
  UserPlus,
  ClipboardCheck,
  BookOpen,
  DollarSign,
  TrendingDown,
  Wallet,
  GraduationCap,
  BarChart2,
} from "lucide-react";

const StatCard = ({ title, value, icon: CardIcon, color, to }) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
  >
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
    >
      <CardIcon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </Link>
);

export default function BPDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    admissions: 0,
    income: 0,
    expenditure: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      entities.Student.list(),
      entities.Staff.list(),
      entities.Admission.list(),
      entities.FeePayment.filter({ status: "Paid" }),
      entities.Expenditure.list(),
    ]).then(([students, staff, admissions, fees, expenditures]) => {
      setStats({
        students: students.length,
        staff: staff.length,
        admissions: admissions.filter((a) => a.status === "Admitted").length,
        income: fees.reduce((s, f) => s + (f.amount || 0), 0),
        expenditure: expenditures.reduce((s, e) => s + (e.amount || 0), 0),
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome to BrightPath School ERP
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={loading ? "..." : stats.students}
          icon={Users}
          color="bg-indigo-500"
          to="/bp-students"
        />
        <StatCard
          title="Total Staff"
          value={loading ? "..." : stats.staff}
          icon={Briefcase}
          color="bg-violet-500"
          to="/bp-staff"
        />
        <StatCard
          title="Admitted"
          value={loading ? "..." : stats.admissions}
          icon={UserPlus}
          color="bg-emerald-500"
          to="/bp-admissions"
        />
        <StatCard
          title="Fee Income"
          value={loading ? "..." : `₹${stats.income.toLocaleString()}`}
          icon={DollarSign}
          color="bg-green-500"
          to="/bp-fees"
        />
        <StatCard
          title="Expenditure"
          value={loading ? "..." : `₹${stats.expenditure.toLocaleString()}`}
          icon={TrendingDown}
          color="bg-rose-500"
          to="/bp-expenditure"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Admissions",
            icon: UserPlus,
            to: "/bp-admissions",
            bg: "bg-blue-50",
            text: "text-blue-600",
          },
          {
            label: "Students",
            icon: Users,
            to: "/bp-students",
            bg: "bg-indigo-50",
            text: "text-indigo-600",
          },
          {
            label: "Staff",
            icon: Briefcase,
            to: "/bp-staff",
            bg: "bg-violet-50",
            text: "text-violet-600",
          },
          {
            label: "Attendance",
            icon: ClipboardCheck,
            to: "/bp-attendance",
            bg: "bg-teal-50",
            text: "text-teal-600",
          },
          {
            label: "Marks",
            icon: BookOpen,
            to: "/bp-marks",
            bg: "bg-amber-50",
            text: "text-amber-600",
          },
          {
            label: "Fee Payment",
            icon: DollarSign,
            to: "/bp-fees",
            bg: "bg-green-50",
            text: "text-green-600",
          },
          {
            label: "Expenditure",
            icon: TrendingDown,
            to: "/bp-expenditure",
            bg: "bg-rose-50",
            text: "text-rose-600",
          },
          {
            label: "Accounts",
            icon: Wallet,
            to: "/bp-accounts",
            bg: "bg-purple-50",
            text: "text-purple-600",
          },
          {
            label: "Report Cards",
            icon: GraduationCap,
            to: "/bp-marks",
            bg: "bg-orange-50",
            text: "text-orange-600",
          },
          {
            label: "Analytics",
            icon: BarChart2,
            to: "/bp-accounts",
            bg: "bg-sky-50",
            text: "text-sky-600",
          },
        ].map(({ label, icon: NavIcon, to, bg, text }) => (
          <Link
            key={label}
            to={to}
            className={`${bg} rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-shadow border border-transparent hover:border-slate-100`}
          >
            <NavIcon className={`w-6 h-6 ${text}`} />
            <span className={`text-xs font-medium ${text}`}>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
