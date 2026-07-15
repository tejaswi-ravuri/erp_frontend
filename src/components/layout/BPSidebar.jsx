import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Briefcase,
  ClipboardCheck,
  BookOpen,
  CreditCard,
  TrendingDown,
  Wallet,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  X,
  Menu,
  BarChart2,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Admissions", icon: UserPlus, path: "/admissions" },
  { label: "Students", icon: Users, path: "/students" },
  { label: "Classes", icon: GraduationCap, path: "/classes" },
  { label: "Staff", icon: Briefcase, path: "/staff" },
  { label: "Attendance", icon: ClipboardCheck, path: "/attendance" },
  { label: "Marks", icon: BookOpen, path: "/marks" },
  { label: "Report Cards", icon: GraduationCap, path: "/report-cards" },
  {
    label: "Fee / Income",
    icon: CreditCard,
    children: [
      { label: "Fee Payments", path: "/fees" },
      { label: "Student Fee Report", path: "/student-fee-report" },
      { label: "Bus Fee Report", path: "/bus-fee-report" },
      { label: "Student Receipt", path: "/student-receipt" },
    ],
  },
  {
    label: "Expenditure",
    icon: TrendingDown,
    children: [
      { label: "Expenditure List", path: "/expenditure" },
      { label: "Financial Report", path: "/financial-report" },
    ],
  },
  { label: "Accounts", icon: Wallet, path: "/accounts" },
  { label: "Analytics", icon: BarChart2, path: "/analytics" },
];

export default function BPSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const toggleDropdown = (label) =>
    setOpenDropdowns((prev) => ({ ...prev, [label]: !prev[label] }));

  const isDropdownActive = (children) => children.some((c) => isActive(c.path));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
        fixed top-0 left-0 h-full z-50 flex flex-col w-60
        bg-[#0f172a] text-slate-300
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 hover:opacity-80"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                MasterMinds ERP
              </p>
              <p className="text-[10px] text-slate-400">by Dominare Group</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              const dropActive = isDropdownActive(item.children);
              const isOpen2 = openDropdowns[item.label] ?? dropActive;
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      dropActive
                        ? "bg-slate-800 text-white font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isOpen2 ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isOpen2 && (
                    <div className="ml-7 mt-0.5 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                            isActive(child.path)
                              ? "bg-emerald-600 text-white font-medium"
                              : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-emerald-600 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-700/60">
          <p className="text-[10px] text-slate-500 text-center">
            © Dominare Group
          </p>
        </div>
      </aside>
    </>
  );
}
