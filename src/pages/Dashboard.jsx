import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import {
  Users,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calendar,
  BookOpen,
  PartyPopper,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    income: 0,
    expenditure: 0,
    exams: 0,
    events: 0,
    homework: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [students, staff, income, expenditure, exams, events, homework] =
        await Promise.all([
          entities.Student.list(),
          entities.Staff.list(),
          entities.Income.list(),
          entities.Expenditure.list(),
          entities.Exam.list(),
          entities.Event.list("-date", 5),
          entities.Homework.list(),
        ]);

      const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0);
      const totalExp = expenditure.reduce((s, e) => s + (e.amount || 0), 0);

      setStats({
        students: students.length,
        staff: staff.length,
        income: totalIncome,
        expenditure: totalExp,
        exams: exams.length,
        events: events.length,
        homework: homework.length,
      });
      setRecentEvents(events.slice(0, 4));
      setLoading(false);
    };
    fetchStats();
  }, []);

  const quickLinks = [
    { label: "Students", to: "/students", icon: Users, color: "indigo" },
    { label: "Staff", to: "/staff", icon: Briefcase, color: "sky" },
    {
      label: "Attendance",
      to: "/attendance",
      icon: ClipboardCheck,
      color: "green",
    },
    { label: "Exams", to: "/exams", icon: GraduationCap, color: "purple" },
    { label: "Income", to: "/income", icon: TrendingUp, color: "teal" },
    {
      label: "Expenditure",
      to: "/expenditure",
      icon: TrendingDown,
      color: "rose",
    },
    { label: "Events", to: "/events", icon: PartyPopper, color: "amber" },
    { label: "Homework", to: "/homework", icon: BookOpen, color: "orange" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening at school today."
        breadcrumb={[{ label: "Dashboard" }]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={loading ? "..." : stats.students}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Staff"
          value={loading ? "..." : stats.staff}
          icon={Briefcase}
          color="sky"
        />
        <StatCard
          title="Total Income"
          value={loading ? "..." : `₹${stats.income.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Expenditure"
          value={loading ? "..." : `₹${stats.expenditure.toLocaleString()}`}
          icon={TrendingDown}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Quick Access
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(({ label, to, icon: Icon, color }) => {
              const colorMap = {
                indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
                sky: "bg-sky-50 text-sky-600 hover:bg-sky-100",
                green: "bg-green-50 text-green-600 hover:bg-green-100",
                purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
                teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
                rose: "bg-rose-50 text-rose-600 hover:bg-rose-100",
                amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
                orange: "bg-orange-50 text-orange-600 hover:bg-orange-100",
              };
              return (
                <Link
                  key={label}
                  to={to}
                  className={`${colorMap[color]} flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-200 hover:scale-105`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Upcoming Events
            </h3>
            <Link
              to="/events"
              className="text-xs text-indigo-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <PartyPopper className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {event.title}
                    </p>
                    <p className="text-[10px] text-slate-400">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs text-indigo-200 mb-1">Cash Balance</p>
          <p className="text-2xl font-bold">₹0</p>
          <p className="text-xs text-indigo-300 mt-2">Available in hand</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs text-teal-200 mb-1">Bank Balance</p>
          <p className="text-2xl font-bold">₹0</p>
          <p className="text-xs text-teal-300 mt-2">In bank account</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-xs text-purple-200 mb-1">Net Balance</p>
          <p className="text-2xl font-bold">
            ₹
            {loading
              ? "..."
              : (stats.income - stats.expenditure).toLocaleString()}
          </p>
          <p className="text-xs text-purple-300 mt-2">Income - Expenditure</p>
        </div>
      </div>
    </div>
  );
}
