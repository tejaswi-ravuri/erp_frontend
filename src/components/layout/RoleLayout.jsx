import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useRole, ROLE_META } from "@/lib/RoleContext";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardCheck,
  BookOpen,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  GraduationCap,
  BarChart2,
  UserPlus,
  Receipt,
  FileText,
  Navigation,
  X,
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookCheck,
  BriefcaseIcon,
} from "lucide-react";

const NAV_BY_ROLE = {
  finance: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    {
      label: "Student Fee Report",
      icon: FileText,
      path: "/student-fee-report",
    },
    { label: "Expenditure", icon: TrendingDown, path: "/expenditure" },
    { label: "Tracking Expenses", icon: BarChart2, path: "/tracking-expenses" },
    { label: "Accounts", icon: Wallet, path: "/accounts" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Students", icon: Users, path: "/students" },
    { label: "Classes", icon: BookCheck, path: "/classes" },
    { label: "Attendance", icon: ClipboardCheck, path: "/attendance" },
    { label: "Marks", icon: BookOpen, path: "/marks" },
    { label: "Homework Manager", icon: Receipt, path: "/homework-manager" },
    { label: "Hall Ticket", icon: GraduationCap, path: "/hall-ticket" },
    { label: "Report Cards", icon: FileText, path: "/report-cards" },
    { label: "Analytics", icon: BarChart2, path: "/analytics" },
  ],
  principal: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Staff", icon: Briefcase, path: "/staff" },
    { label: "Classes", icon: BriefcaseIcon, path: "/classes" },
    { label: "Students", icon: Users, path: "/students" },
    { label: "Marks", icon: BookOpen, path: "/marks" },
    { label: "Report Cards", icon: GraduationCap, path: "/report-cards" },
    { label: "Analytics", icon: BarChart2, path: "/analytics" },
  ],
  consultant: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Fee Payments", icon: CreditCard, path: "/fees" },
    { label: "Admissions", icon: UserPlus, path: "/admissions" },
    {
      label: "Student Fee Report",
      icon: FileText,
      path: "/student-fee-report",
    },
    { label: "Income", icon: TrendingUp, path: "/income" },
    { label: "Expenditure", icon: TrendingDown, path: "/expenditure" },
    { label: "Analytics", icon: BarChart2, path: "/analytics" },
  ],
};

const ACCENT = {
  finance: "bg-emerald-500",
  teacher: "bg-sky-500",
  principal: "bg-indigo-500",
  consultant: "bg-orange-500",
};

export default function RoleLayout({ user }) {
  const { activeRole, logout } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = ROLE_META[activeRole] || {};
  const navItems = NAV_BY_ROLE[activeRole] || [];
  const accent = ACCENT[activeRole] || "bg-indigo-500";

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full z-50 flex flex-col w-60
        bg-[#0f172a] text-slate-300
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80">
            <div
              className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center text-base`}
            >
              {meta.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                MasterMinds ERP
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {meta.label}
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-slate-700/40">
          <div
            className={`${accent} bg-opacity-20 rounded-lg px-3 py-2 text-center`}
          >
            <p className="text-xs font-bold text-white capitalize">
              {meta.label}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? `${accent} text-white font-medium`
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-slate-700/60">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Switch Role
          </button>
          <p className="text-[10px] text-slate-600 text-center mt-2">
            © Dominare Group
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.icon}</span>
              <div>
                <h1 className="text-sm font-semibold text-slate-800">
                  MasterMinds ERP
                </h1>
                <p className="text-xs text-slate-400 capitalize">
                  {meta.label}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className={`w-7 h-7 rounded-full ${accent} flex items-center justify-center`}
              >
                <span className="text-xs font-bold text-white">
                  {user?.full_name?.[0] ||
                    user?.email?.[0]?.toUpperCase() ||
                    meta.icon}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-slate-700">
                  {user?.full_name || meta.label}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {meta.label}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                title="Switch Role"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
