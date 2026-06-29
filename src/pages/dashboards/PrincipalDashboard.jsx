import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Users,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";

const CLASSES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
];

export default function PrincipalDashboard() {
  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("staff");

  useEffect(() => {
    Promise.all([
      entities.Staff.list(),
      entities.Student.list("full_name", 200),
      entities.Marks.list("-created_date", 100),
    ]).then(([s, st, m]) => {
      setStaff(s);
      setStudents(st);
      setMarks(m);
      setLoading(false);
    });
  }, []);

  const classSummary = CLASSES.map((cls) => {
    const classStudents = students.filter(
      (s) => s.class === cls || s.class === cls.replace("Class ", ""),
    );
    const classMarks = marks.filter((m) => m.class === cls);
    const avg =
      classMarks.length > 0
        ? Math.round(
            classMarks.reduce(
              (s, m) => s + (m.marks_obtained / m.max_marks) * 100,
              0,
            ) / classMarks.length,
          )
        : null;
    const teacher = staff.find((st) => st.role === "Teacher");
    return {
      cls,
      count: classStudents.length,
      avg,
      teacher: teacher?.full_name || "Not Assigned",
    };
  }).filter((c) => c.count > 0);

  const teachers = staff.filter((s) => s.role === "Teacher");
  const admins = staff.filter((s) => s.role === "Admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">
          Principal's Office
        </h1>
        <p className="text-sm text-slate-500">
          Staff, class overview & timetable management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Staff",
            value: loading ? "..." : staff.length,
            icon: Briefcase,
            color: "bg-violet-500",
          },
          {
            label: "Teachers",
            value: loading ? "..." : teachers.length,
            icon: GraduationCap,
            color: "bg-indigo-500",
          },
          {
            label: "Total Students",
            value: loading ? "..." : students.length,
            icon: Users,
            color: "bg-sky-500",
          },
          {
            label: "Classes Active",
            value: loading ? "..." : classSummary.length,
            icon: BookOpen,
            color: "bg-emerald-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2">
        {["staff", "classes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}
          >
            {tab === "staff" ? "👨‍🏫 Staff Overview" : "🏫 Class Summary"}
          </button>
        ))}
      </div>

      {activeTab === "staff" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700">
              Staff Directory
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Name",
                    "Role",
                    "Subject",
                    "Qualification",
                    "Phone",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-slate-400 text-xs"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800 text-xs">
                      {s.full_name}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.role === "Teacher" ? "bg-indigo-100 text-indigo-700" : s.role === "Admin" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {s.subject_taught || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {s.qualification || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {s.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "classes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classSummary.map(({ cls, count, avg }) => (
            <div
              key={cls}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-800">{cls}</p>
                <ArrowUpRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-3xl font-black text-indigo-600 mb-1">
                {count}
              </p>
              <p className="text-xs text-slate-500 mb-3">students enrolled</p>
              {avg !== null && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Avg Performance</span>
                    <span className="font-semibold text-slate-700">{avg}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div
                      className={`h-1.5 rounded-full ${avg >= 75 ? "bg-emerald-500" : avg >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${avg}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          {classSummary.length === 0 && !loading && (
            <p className="col-span-3 text-center text-slate-400 text-sm py-8">
              No class data available
            </p>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Staff Management",
            to: "/staff",
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "Report Cards",
            to: "/report-cards",
            color: "bg-indigo-50 text-indigo-700",
          },
          {
            label: "Analytics",
            to: "/analytics",
            color: "bg-sky-50 text-sky-700",
          },
        ].map(({ label, to, color }) => (
          <Link
            key={label}
            to={to}
            className={`${color} rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow text-sm font-semibold`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
