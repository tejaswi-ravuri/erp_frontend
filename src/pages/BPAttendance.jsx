import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Check, X, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function BPAttendance() {
  const [tab, setTab] = useState("mark");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [existing, setExisting] = useState([]);
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    entities.Student.list().then((data) => {
      setStudents(data.filter((s) => s.status === "Active"));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (tab === "monthly") {
      loadMonthly();
    }
  }, [tab]);

  useEffect(() => {
    entities.Attendance.filter({ date }).then((data) => {
      setExisting(data);
      const map = {};
      data.forEach((a) => {
        map[a.student_id] = a.status;
      });
      setAttendance(map);
    });
  }, [date]);

  const loadMonthly = async () => {
    const data = await entities.Attendance.list();
    setMonthlyData(data);
  };

  const filtered = students.filter((s) => {
    const mc = classFilter === "All" || s.class === classFilter;
    const ms = sectionFilter === "All" || s.section === sectionFilter;
    return mc && ms;
  });

  const setStatus = (id, status) =>
    setAttendance((prev) => ({ ...prev, [id]: status }));

  const saveAttendance = async () => {
    setSaving(true);
    for (const s of filtered) {
      const status = attendance[s.id] || "Present";
      const ex = existing.find((a) => a.student_id === s.id);
      if (ex) {
        await entities.Attendance.update(ex.id, { status });
      } else {
        await entities.Attendance.create({
          student_id: s.id,
          student_name: s.full_name,
          class: s.class,
          section: s.section,
          date,
          status,
        });
      }
    }
    setSaving(false);
    entities.Attendance.filter({ date }).then((data) => setExisting(data));
  };

  const present = filtered.filter(
    (s) => (attendance[s.id] || "Present") === "Present",
  ).length;
  const absent = filtered.filter((s) => attendance[s.id] === "Absent").length;
  const late = filtered.filter((s) => attendance[s.id] === "Late").length;

  const getMonthlyPct = (studentId) => {
    const records = monthlyData.filter((a) => a.student_id === studentId);
    if (!records.length) return 0;
    const p = records.filter((a) => a.status === "Present").length;
    return Math.round((p / records.length) * 100);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Attendance</h2>
          <p className="text-sm text-slate-500">
            Mark and view student attendance
          </p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {["mark", "monthly"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
            >
              {t === "mark" ? "Mark Attendance" : "Monthly View"}
            </button>
          ))}
        </div>
      </div>

      {tab === "mark" && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40 text-sm"
            />
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-36 text-sm">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Classes</SelectItem>
                {["8", "9", "10"].map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-32 text-sm">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sections</SelectItem>
                <SelectItem value="A">Section A</SelectItem>
                <SelectItem value="B">Section B</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={saveAttendance}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5 ml-auto"
            >
              <Save className="w-4 h-4" />{" "}
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>

          {/* Summary */}
          <div className="flex gap-4">
            {[
              {
                label: "Present",
                count: present,
                color: "bg-emerald-100 text-emerald-700",
              },
              {
                label: "Absent",
                count: absent,
                color: "bg-red-100 text-red-700",
              },
              {
                label: "Late",
                count: late,
                color: "bg-amber-100 text-amber-700",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`px-4 py-2 rounded-lg ${s.color} text-sm font-medium`}
              >
                {s.label}: {s.count}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Class
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}
                  {filtered.map((s) => {
                    const status = attendance[s.id] || "Present";
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {s.full_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          Class {s.class} {s.section}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {["Present", "Absent", "Late"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setStatus(s.id, opt)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                                  status === opt
                                    ? opt === "Present"
                                      ? "bg-emerald-500 text-white border-emerald-500"
                                      : opt === "Absent"
                                        ? "bg-red-500 text-white border-red-500"
                                        : "bg-amber-500 text-white border-amber-500"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "monthly" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Class
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Attendance %
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                    Bar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter((s) => s.status === "Active")
                  .map((s) => {
                    const pct = getMonthlyPct(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {s.full_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          Class {s.class} {s.section}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {pct}%
                        </td>
                        <td className="px-4 py-3 w-48">
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
