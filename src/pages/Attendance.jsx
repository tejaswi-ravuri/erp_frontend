import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import PageHeader from "@/components/ui/PageHeader";
import { ClipboardCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [classFilter, setClassFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const data = await entities.Student.list();
      setStudents(data);
    };
    load();
  }, []);

  const classes = [...new Set(students.map((s) => s.class).filter(Boolean))];
  const filtered = students.filter(
    (s) => !classFilter || s.class === classFilter,
  );

  const setStatus = (id, status) =>
    setAttendance((p) => ({ ...p, [id]: status }));

  const saveAttendance = async () => {
    setSaving(true);
    const records = filtered.map((s) => ({
      student_id: s.id,
      student_name: s.name,
      class: s.class,
      section: s.section,
      date,
      status: attendance[s.id] || "Present",
      type: "Student",
    }));
    await entities.Attendance.bulkCreate(records);
    setSaving(false);
    toast({
      title: "Attendance saved!",
      description: `${records.length} records saved for ${date}`,
    });
  };

  const presentCount = filtered.filter(
    (s) => (attendance[s.id] || "Present") === "Present",
  ).length;
  const absentCount = filtered.filter(
    (s) => attendance[s.id] === "Absent",
  ).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Attendance"
        subtitle="Mark daily attendance"
        breadcrumb={[{ label: "Attendance" }]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs mb-1 block">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl text-sm w-40"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Class</Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="rounded-xl text-sm w-32">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4 text-sm ml-auto">
            <span className="text-green-600 font-medium">
              Present: {presentCount}
            </span>
            <span className="text-rose-600 font-medium">
              Absent: {absentCount}
            </span>
            <Button
              onClick={saveAttendance}
              disabled={saving || filtered.length === 0}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              No students found. Please select a class.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Roll No</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s, idx) => {
                  const status = attendance[s.id] || "Present";
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.class} {s.section}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.roll_number || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {["Present", "Absent", "Late"].map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setStatus(s.id, opt)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                status === opt
                                  ? opt === "Present"
                                    ? "bg-green-500 text-white"
                                    : opt === "Absent"
                                      ? "bg-rose-500 text-white"
                                      : "bg-amber-500 text-white"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
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
        )}
      </div>
    </div>
  );
}
