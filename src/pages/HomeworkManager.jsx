import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Bell, CheckCircle, BookOpen, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const SUBJECTS = [
  "Maths",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
  "Computer",
  "Telugu",
  "Physics",
  "Chemistry",
];
const CLASSES = [
  "LKG",
  "UKG",
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
  "Class 11",
  "Class 12",
];

const EMPTY = {
  title: "",
  subject: "",
  class: "",
  section: "",
  description: "",
  due_date: "",
  assigned_by: "Teacher",
};

export default function HomeworkManager() {
  const [homeworks, setHomeworks] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [notifyingId, setNotifyingId] = useState(null);
  const [filterClass, setFilterClass] = useState("All");
  const { toast } = useToast();

  const load = () =>
    Promise.all([
      entities.Homework.list("-created_date", 50),
      entities.Student.list("full_name", 500),
    ]).then(([h, s]) => {
      setHomeworks(h);
      setStudents(s);
    });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await entities.Homework.create({ ...form, status: "Active" });
    setForm({ ...EMPTY });
    setShowForm(false);
    await load();
    setSaving(false);
    toast({
      title: "✅ Homework Added",
      description: `"${form.title}" saved for ${form.class}`,
    });
  };

  const notifyStudents = async (hw) => {
    setNotifyingId(hw.id);
    const classStudents = students.filter((s) => s.class === hw.class);
    if (classStudents.length === 0) {
      toast({
        title: "⚠️ No students found",
        description: `No students found in ${hw.class}`,
      });
      setNotifyingId(null);
      return;
    }
    // Create notification for each student
    await Promise.all(
      classStudents.map((s) =>
        entities.HomeworkNotification.create({
          homework_id: hw.id,
          title: hw.title,
          subject: hw.subject,
          description: hw.description,
          class: hw.class,
          section: hw.section || "",
          due_date: hw.due_date,
          assigned_by: hw.assigned_by || "Teacher",
          student_id: s.id,
          student_name: s.full_name,
          status: "Unread",
        }),
      ),
    );
    setNotifyingId(null);
    toast({
      title: "🔔 Notifications Sent!",
      description: `Notified ${classStudents.length} students in ${hw.class} about "${hw.title}"`,
    });
  };

  const deleteHw = async (id) => {
    await entities.Homework.delete(id);
    await load();
  };

  const filtered =
    filterClass === "All"
      ? homeworks
      : homeworks.filter((h) => h.class === filterClass);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Homework Manager</h2>
          <p className="text-sm text-slate-500">
            Assign homework & notify students
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 hover:bg-sky-700 gap-2"
        >
          <Plus className="w-4 h-4" /> Add Homework
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700">
            New Homework Assignment
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-3">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Title *
              </label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Chapter 3 Exercise 5"
                className="text-sm"
              />
            </div>
            {[
              { label: "Class", key: "class", opts: CLASSES },
              { label: "Subject", key: "subject", opts: SUBJECTS },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  {f.label}
                </label>
                <Select
                  value={form[f.key]}
                  onValueChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder={`Select ${f.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.opts.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Section
              </label>
              <Input
                value={form.section}
                onChange={(e) =>
                  setForm((p) => ({ ...p, section: e.target.value }))
                }
                placeholder="A / B / C"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Due Date
              </label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, due_date: e.target.value }))
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Assigned By
              </label>
              <Input
                value={form.assigned_by}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assigned_by: e.target.value }))
                }
                className="text-sm"
              />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Description / Instructions
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Write homework instructions here..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.title || !form.class}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {saving ? "Saving..." : "Save Homework"}
            </Button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Classes</SelectItem>
            {CLASSES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-slate-500">{filtered.length} assignments</p>
      </div>

      {/* Homework List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-slate-400">
            No homework assigned yet.
          </p>
        )}
        {filtered.map((hw) => (
          <div
            key={hw.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-800">{hw.title}</p>
                  <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-semibold">
                    {hw.subject}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    {hw.class} {hw.section}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${hw.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                  >
                    {hw.status}
                  </span>
                </div>
                {hw.description && (
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    {hw.description}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Due: {hw.due_date || "Not set"} · By: {hw.assigned_by || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => notifyStudents(hw)}
                disabled={notifyingId === hw.id}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs"
              >
                <Bell className="w-3.5 h-3.5" />
                {notifyingId === hw.id ? "Notifying..." : "Notify Students"}
              </Button>
              <button
                onClick={() => deleteHw(hw.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
