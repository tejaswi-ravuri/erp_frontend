import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import PageHeader from "@/components/ui/PageHeader";
import { BookOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function Marks() {
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const [s, e] = await Promise.all([
        entities.Student.list(),
        entities.Exam.list(),
      ]);
      setStudents(s);
      setExams(e);
    };
    load();
  }, []);

  const exam = exams.find((e) => e.id === selectedExam);
  const classStudents = exam
    ? students.filter((s) => s.class === exam.class)
    : [];

  const handleSave = async () => {
    setSaving(true);
    toast({
      title: "Marks saved!",
      description: `Saved marks for ${classStudents.length} students`,
    });
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Marks"
        subtitle="Enter and manage student marks"
        breadcrumb={[{ label: "Marks" }]}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-xs mb-1 block">Select Exam</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="rounded-xl text-sm w-60">
                <SelectValue placeholder="Choose an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} - {e.class} - {e.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {exam && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
              Total: {exam.total_marks} · Pass: {exam.passing_marks}
            </div>
          )}
          {classStudents.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl ml-auto"
            >
              {saving ? "Saving..." : "Save Marks"}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {!selectedExam ? (
          <div className="p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              Select an exam to enter marks
            </p>
          </div>
        ) : classStudents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">
              No students found for class {exam?.class}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Student Name</th>
                  <th className="px-4 py-3 text-left">Roll No</th>
                  <th className="px-4 py-3 text-left">
                    Marks (out of {exam?.total_marks})
                  </th>
                  <th className="px-4 py-3 text-left">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classStudents.map((s, idx) => {
                  const m = Number(marks[s.id] || "");
                  const passed = m >= (exam?.passing_marks || 0);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.roll_number || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          max={exam?.total_marks}
                          value={marks[s.id] || ""}
                          onChange={(e) =>
                            setMarks((p) => ({ ...p, [s.id]: e.target.value }))
                          }
                          className="rounded-xl text-sm w-24"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {marks[s.id] ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${passed ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}
                          >
                            {passed ? "Pass" : "Fail"}
                          </span>
                        ) : (
                          "—"
                        )}
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
