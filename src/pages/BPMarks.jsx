import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const SUBJECTS = [
  "Maths",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
  "Computer",
];
const EXAM_TYPES = ["Unit Test", "Mid Term", "Final"];

const getGrade = (obtained, max) => {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  return "D";
};

const gradeColor = {
  "A+": "text-emerald-700 bg-emerald-50",
  A: "text-blue-700 bg-blue-50",
  B: "text-indigo-700 bg-indigo-50",
  C: "text-amber-700 bg-amber-50",
  D: "text-red-700 bg-red-50",
};

const EMPTY_FORM = {
  student_id: "",
  student_name: "",
  class: "",
  exam_type: "Final",
  subject: "Maths",
  marks_obtained: "",
  max_marks: "100",
};

export default function BPMarks() {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState("All");
  const [examFilter, setExamFilter] = useState("Final");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([
      entities.Marks.list(),
      entities.Student.list(),
    ]);
    setMarks(m);
    setStudents(s.filter((st) => st.status === "Active"));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const grade = getGrade(Number(form.marks_obtained), Number(form.max_marks));
    await entities.Marks.create({
      ...form,
      marks_obtained: Number(form.marks_obtained),
      max_marks: Number(form.max_marks),
      grade,
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
    load();
  };

  const filteredStudents = students.filter(
    (s) => classFilter === "All" || s.class === classFilter,
  );

  const getStudentMarks = (studentId) => {
    return marks.filter(
      (m) => m.student_id === studentId && m.exam_type === examFilter,
    );
  };

  const getSubjectMark = (studentId, subject) => {
    const m = marks.find(
      (x) =>
        x.student_id === studentId &&
        x.exam_type === examFilter &&
        x.subject === subject,
    );
    return m ? m.marks_obtained : null;
  };

  const getTotal = (studentId) => {
    const sm = getStudentMarks(studentId);
    return sm.reduce((s, m) => s + (m.marks_obtained || 0), 0);
  };

  const getMax = (studentId) => getStudentMarks(studentId).length * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Marks</h2>
          <p className="text-sm text-slate-500">Academic performance records</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Marks
        </Button>
      </div>

      <div className="flex gap-3">
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
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-36 text-sm">
            <SelectValue placeholder="Exam" />
          </SelectTrigger>
          <SelectContent>
            {EXAM_TYPES.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50">
                  Student
                </th>
                {SUBJECTS.map((s) => (
                  <th
                    key={s}
                    className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase"
                  >
                    {s}
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Total
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">
                  %
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredStudents.map((s) => {
                  const total = getTotal(s.id);
                  const maxTotal = getMax(s.id);
                  const pct =
                    maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
                  const grade = maxTotal > 0 ? getGrade(total, maxTotal) : "—";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 sticky left-0 bg-white">
                        {s.full_name}
                      </td>
                      {SUBJECTS.map((subj) => {
                        const val = getSubjectMark(s.id, subj);
                        return (
                          <td
                            key={subj}
                            className="px-3 py-3 text-center text-slate-700"
                          >
                            {val !== null ? (
                              val
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center font-semibold text-slate-800">
                        {total || "—"}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">
                        {pct ? `${pct}%` : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {grade !== "—" && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColor[grade] || ""}`}
                          >
                            {grade}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Marks Entry</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Student
              </label>
              <Select
                value={form.student_id}
                onValueChange={(v) => {
                  const s = students.find((st) => st.id === v);
                  setForm({
                    ...form,
                    student_id: v,
                    student_name: s?.full_name || "",
                    class: s?.class || "",
                  });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} (Class {s.class})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Exam Type
              </label>
              <Select
                value={form.exam_type}
                onValueChange={(v) => setForm({ ...form, exam_type: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Subject
              </label>
              <Select
                value={form.subject}
                onValueChange={(v) => setForm({ ...form, subject: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Marks Obtained
              </label>
              <Input
                type="number"
                value={form.marks_obtained}
                onChange={(e) =>
                  setForm({ ...form, marks_obtained: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Max Marks
              </label>
              <Input
                type="number"
                value={form.max_marks}
                onChange={(e) =>
                  setForm({ ...form, max_marks: e.target.value })
                }
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
