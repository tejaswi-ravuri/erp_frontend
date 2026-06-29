import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  UserPlus,
  Users,
  Briefcase,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Wallet,
  BookMarked,
  ArrowLeftRight,
  FileText,
  Calendar,
  Phone,
  PartyPopper,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  School,
  X,
  Menu,
  LayoutDashboard,
  Bus,
  HeadphonesIcon,
} from "lucide-react";
import SupportDialog from "@/components/SupportDialog";

const navItems = [
  {
    label: "Admissions",
    icon: UserPlus,
    path: "/admissions",
    children: [
      { label: "New Admission", path: "/admissions/new" },
      { label: "Admission List", path: "/admissions" },
    ],
  },
  {
    label: "Student",
    icon: Users,
    path: "/students",
    children: [
      { label: "All Students", path: "/students" },
      { label: "Add Student", path: "/students/new" },
    ],
  },
  {
    label: "Staff",
    icon: Briefcase,
    path: "/staff",
    children: [
      { label: "All Staff", path: "/staff" },
      { label: "Add Staff", path: "/staff/new" },
    ],
  },
  {
    label: "Attendance",
    icon: ClipboardCheck,
    path: "/attendance",
    children: [
      { label: "Mark Attendance", path: "/attendance" },
      { label: "View Reports", path: "/attendance/reports" },
    ],
  },
  {
    label: "Marks",
    icon: BookOpen,
    path: "/marks",
    children: [
      { label: "Enter Marks", path: "/marks" },
      { label: "Report Card", path: "/marks/report" },
    ],
  },
  {
    label: "Exam Department",
    icon: GraduationCap,
    path: "/exams",
    children: [
      { label: "Exam Schedule", path: "/exams" },
      { label: "Add Exam", path: "/exams/new" },
    ],
  },
  {
    label: "Income",
    icon: TrendingUp,
    path: "/income",
    children: [
      { label: "All Income", path: "/income" },
      { label: "Add Income", path: "/income/new" },
    ],
  },
  {
    label: "Expenditure",
    icon: TrendingDown,
    path: "/expenditure",
    children: [
      { label: "All Expenditure", path: "/expenditure" },
      { label: "Add Expenditure", path: "/expenditure/new" },
    ],
  },
  {
    label: "Fee Report",
    icon: FileText,
    path: "/student-fee-report",
    children: [{ label: "Student Fee Report", path: "/student-fee-report" }],
  },
  {
    label: "Accounts",
    icon: Wallet,
    path: "/accounts",
    children: [{ label: "Overview", path: "/accounts" }],
  },
  {
    label: "Cheque Book",
    icon: BookMarked,
    path: "/cheque-book",
    children: [{ label: "Cheque List", path: "/cheque-book" }],
  },
  {
    label: "Transfer",
    icon: ArrowLeftRight,
    path: "/transfer",
    children: [{ label: "Transfer List", path: "/transfer" }],
  },
  {
    label: "Home Work",
    icon: FileText,
    path: "/homework",
    children: [
      { label: "All Homework", path: "/homework" },
      { label: "Add Homework", path: "/homework/new" },
    ],
  },
  {
    label: "Time Table",
    icon: Calendar,
    path: "/timetable",
    children: [{ label: "View Timetable", path: "/timetable" }],
  },
  {
    label: "Appointment",
    icon: Phone,
    path: "/appointments",
    children: [
      { label: "All Appointments", path: "/appointments" },
      { label: "New Appointment", path: "/appointments/new" },
    ],
  },
  {
    label: "Events",
    icon: PartyPopper,
    path: "/events",
    children: [
      { label: "All Events", path: "/events" },
      { label: "Add Event", path: "/events/new" },
    ],
  },
  {
    label: "Others",
    icon: MoreHorizontal,
    path: "/others",
    children: [{ label: "Settings", path: "/others" }],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [supportOpen, setSupportOpen] = useState(false);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        w-64 bg-[#1e1b4b] text-indigo-100
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-800/50">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Masterminds
              </p>
              <p className="text-[10px] text-indigo-300">School ERP</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-indigo-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {/* Dashboard quick link */}
          <Link
            to="/"
            onClick={onClose}
            className={`sidebar-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-1 ${
              location.pathname === "/"
                ? "bg-indigo-600 text-white font-medium"
                : "text-indigo-200 hover:bg-indigo-800/60 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </Link>
          {/* Bus Tracking quick link */}
          <Link
            to="/bus-tracking"
            onClick={onClose}
            className={`sidebar-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-2 ${
              location.pathname === "/bus-tracking"
                ? "bg-indigo-600 text-white font-medium"
                : "text-indigo-200 hover:bg-indigo-800/60 hover:text-white"
            }`}
          >
            <Bus className="w-4 h-4 shrink-0" />
            <span>GPS Bus Tracking</span>
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isMenuOpen = openMenus[item.label];

            return (
              <div key={item.label} className="mb-0.5">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`
                    sidebar-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm
                    ${
                      active
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-indigo-200 hover:bg-indigo-800/60 hover:text-white"
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isMenuOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>

                {/* Dropdown children */}
                <div
                  className={`sidebar-dropdown ${isMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  {item.children?.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={onClose}
                      className={`
                        flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs mt-0.5
                        ${
                          location.pathname === child.path
                            ? "bg-indigo-500/30 text-white font-medium"
                            : "text-indigo-300 hover:bg-indigo-800/40 hover:text-white"
                        }
                      `}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-indigo-800/50">
          <button
            onClick={() => setSupportOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-xs text-indigo-300 hover:text-white hover:bg-indigo-800/40 py-2 rounded-lg transition-colors"
          >
            <HeadphonesIcon className="w-3.5 h-3.5" />
            DTG Support
          </button>
        </div>
      </aside>

      <SupportDialog open={supportOpen} onClose={() => setSupportOpen(false)} />
    </>
  );
}
