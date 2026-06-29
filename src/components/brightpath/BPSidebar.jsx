import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserPlus,
  ClipboardCheck,
  BookOpen,
  DollarSign,
  TrendingDown,
  Wallet,
  School,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Admissions", icon: UserPlus, path: "/bp-admissions" },
  { label: "Students", icon: Users, path: "/bp-students" },
  { label: "Staff", icon: Briefcase, path: "/bp-staff" },
  { label: "Attendance", icon: ClipboardCheck, path: "/bp-attendance" },
  { label: "Marks", icon: BookOpen, path: "/bp-marks" },
  { label: "Fee Payment", icon: DollarSign, path: "/bp-fees" },
  { label: "Expenditure", icon: TrendingDown, path: "/bp-expenditure" },
  { label: "Accounts", icon: Wallet, path: "/bp-accounts" },
];

export default function BPSidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col w-60 bg-[#1a1a3e] text-indigo-100 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow">
              <School className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                BrightPath
              </p>
              <p className="text-[10px] text-indigo-400">School ERP</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-indigo-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${active ? "bg-indigo-600 text-white font-medium shadow-sm" : "text-indigo-300 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[10px] text-indigo-500 text-center">
            BrightPath School ERP v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
