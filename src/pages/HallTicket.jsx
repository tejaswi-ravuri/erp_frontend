import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { classApi } from "@/api/api";
import { useRole, ROLES } from "@/lib/RoleContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Printer, Plus, Trash2, Save } from "lucide-react";
import jsPDF from "jspdf";

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
  "Biology",
];
const EXAM_TYPES = ["Unit Test", "Mid Term", "Final", "Annual"];
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
const ACADEMIC_YEARS = ["2024-25", "2025-26", "2026-27"];

const logoUrl = "/logo.webp";

const EMPTY_SUBJECT = {
  subject: "",
  date: "",
  time: "09:00 AM",
  duration: "3 Hours",
  max_marks: 100,
};

export default function HallTicket() {
  const { activeRole } = useRole();
  const isTeacher = activeRole === ROLES.TEACHER;
  const [students, setStudents] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeTab, setActiveTab] = useState("generate"); // 'generate' | 'create'
  const [form, setForm] = useState({
    exam_name: "",
    class: "",
    section: "",
    academic_year: "2025-26",
    exam_type: "Mid Term",
    center: "Main Campus",
    invigilator: "",
    subjects: [{ ...EMPTY_SUBJECT }],
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      entities.Student.list("full_name", 500),
      entities.ExamSchedule.list("-created_date"),
      classApi.list(),
    ]).then(([s, e, classesRes]) => {
      setStudents(s);
      setExamSchedules(e);
      setClasses(classesRes?.data || []);
      setLoading(false);
    });
  }, []);

  // Student.class is a reference to a Class document's _id, so the filter
  // has to compare against that id rather than a display label.
  const classLabel = (c) => (/^\d+$/.test(c.grade) ? `Class ${c.grade}` : c.grade);
  const selectedClassObj = classes.find((c) => c._id === selectedClass);
  const classStudents = students.filter(
    (s) => String(s.class) === selectedClass,
  );

  const addSubject = () =>
    setForm((f) => ({ ...f, subjects: [...f.subjects, { ...EMPTY_SUBJECT }] }));
  const removeSubject = (i) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.filter((_, idx) => idx !== i),
    }));
  const updateSubject = (i, key, val) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.map((s, idx) =>
        idx === i ? { ...s, [key]: val } : s,
      ),
    }));

  const saveExam = async () => {
    setSaving(true);
    await entities.ExamSchedule.create(form);
    const updated = await entities.ExamSchedule.list("-created_date");
    setExamSchedules(updated);
    setSaving(false);
    setActiveTab("generate");
    alert("Exam schedule saved!");
  };

  const generateHallTicket = async (student, exam) => {
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const pageW = 210;

    // Load logo - drawn through a <canvas> and re-encoded as PNG since
    // jsPDF's own WEBP decoding is unreliable across versions; every
    // browser can already decode WEBP into a canvas natively.
    const logoImg = new Image();
    let logoDataUrl = null;
    await new Promise((res) => {
      logoImg.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = logoImg.naturalWidth;
          canvas.height = logoImg.naturalHeight;
          canvas.getContext("2d").drawImage(logoImg, 0, 0);
          logoDataUrl = canvas.toDataURL("image/png");
        } catch {
          logoDataUrl = null;
        }
        res();
      };
      logoImg.onerror = res;
      logoImg.src = logoUrl;
    });

    // Header
    if (logoDataUrl) {
      try {
        doc.setGState(new doc.GState({ opacity: 0.9 }));
        doc.addImage(logoDataUrl, "PNG", pageW / 2 - 35, 8, 70, 22);
        doc.setGState(new doc.GState({ opacity: 1 }));
      } catch (e) {}
    }

    let y = 36;
    doc.setLineWidth(0.8);
    doc.setDrawColor(79, 70, 229);
    doc.line(15, y, pageW - 15, y);
    y += 7;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 80);
    doc.text("HALL TICKET", pageW / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${exam.exam_name} — ${exam.exam_type} | Academic Year: ${exam.academic_year}`,
      pageW / 2,
      y,
      { align: "center" },
    );
    y += 4;
    doc.line(15, y, pageW - 15, y);
    y += 8;

    // Student Info Box
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(15, y, pageW - 30, 36, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 80);
    doc.text("Student Information", 20, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const col1x = 20,
      col2x = 110;
    doc.text(`Name: ${student.full_name}`, col1x, y + 15);
    doc.text(`Admission No: ${student.admission_no || "—"}`, col2x, y + 15);
    const studentClassObj = classes.find(
      (c) => c._id === String(student.class),
    );
    doc.text(
      `Class: ${studentClassObj ? classLabel(studentClassObj) : student.class} ${student.section || ""}`,
      col1x,
      y + 22,
    );
    doc.text(`Father's Name: ${student.parent_name || "—"}`, col2x, y + 22);
    doc.text(`Center: ${exam.center || "Main Campus"}`, col1x, y + 29);
    doc.text(
      `Roll No: ${student.roll_no || student.admission_no || "—"}`,
      col2x,
      y + 29,
    );
    y += 44;

    // Exam Timetable
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 80);
    doc.text("Examination Timetable", 15, y);
    y += 6;

    // Table header
    doc.setFillColor(79, 70, 229);
    doc.roundedRect(15, y, pageW - 30, 8, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Subject", 20, y + 5.5);
    doc.text("Date", 70, y + 5.5);
    doc.text("Time", 105, y + 5.5);
    doc.text("Duration", 138, y + 5.5);
    doc.text("Max Marks", 167, y + 5.5);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    (exam.subjects || []).forEach((sub, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 255);
        doc.rect(15, y - 2, pageW - 30, 8, "F");
      }
      doc.setTextColor(50, 50, 50);
      doc.text(sub.subject || "—", 20, y + 4);
      doc.text(sub.date || "—", 70, y + 4);
      doc.text(sub.time || "—", 105, y + 4);
      doc.text(sub.duration || "—", 138, y + 4);
      doc.text(String(sub.max_marks || "—"), 167, y + 4);
      y += 8;
    });

    y += 6;
    doc.setLineWidth(0.4);
    doc.setDrawColor(200, 200, 220);
    doc.line(15, y, pageW - 15, y);
    y += 10;

    // Instructions
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 80);
    doc.text("Instructions:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const instructions = [
      "1. This hall ticket must be presented at the examination center.",
      "2. Students must report 30 minutes before the exam.",
      "3. Mobile phones and electronic devices are strictly prohibited.",
      "4. Students must carry their own stationery.",
      "5. This ticket is not transferable.",
    ];
    instructions.forEach((line) => {
      doc.text(line, 15, y);
      y += 5;
    });

    y += 8;
    // Signatures
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Student Signature", 20, y + 12);
    doc.text("Invigilator Signature", 85, y + 12);
    doc.text("Principal's Signature", 155, y + 12);
    doc.line(15, y + 10, 65, y + 10);
    doc.line(80, y + 10, 140, y + 10);
    doc.line(150, y + 10, pageW - 15, y + 10);

    // Footer
    y += 22;
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 280, pageW, 17, "F");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 255);
    doc.text(
      "MasterMinds ERP · by Dominare Group · This is a computer-generated hall ticket.",
      pageW / 2,
      290,
      { align: "center" },
    );

    doc.save(`HallTicket-${student.full_name}-${exam.exam_name}.pdf`);
  };

  const generateAllHallTickets = async () => {
    if (!selectedExam || classStudents.length === 0) return;
    setGenerating(true);
    for (const student of classStudents) {
      await generateHallTicket(student, selectedExam);
      await new Promise((r) => setTimeout(r, 200));
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Hall Ticket Generation
          </h2>
          <p className="text-sm text-slate-500">
            Create exam schedules and generate student hall tickets
          </p>
        </div>
        <div className="flex gap-2">
          {/* "create" tab (exam schedule creation) is commented out for
              teachers - only generating hall tickets is available to them. */}
          {["generate", ...(isTeacher ? [] : ["create"])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-500 border border-slate-200"}`}
            >
              {tab === "generate"
                ? "🎫 Generate Tickets"
                : "➕ Create Exam Schedule"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "generate" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              Select Exam & Class
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Exam Schedule
                </label>
                <Select
                  value={selectedExam?._id || ""}
                  onValueChange={(v) =>
                    setSelectedExam(examSchedules.find((e) => e._id === v))
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select exam..." />
                  </SelectTrigger>
                  <SelectContent>
                    {examSchedules.map((e) => (
                      <SelectItem key={e._id} value={e._id}>
                        {e.exam_name} — {e.class} ({e.exam_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {classLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={generateAllHallTickets}
                  disabled={
                    !selectedExam ||
                    !selectedClass ||
                    classStudents.length === 0 ||
                    generating
                  }
                  className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {generating
                    ? "Generating..."
                    : `Generate All (${classStudents.length})`}
                </Button>
              </div>
            </div>
          </div>

          {/* Student list with individual print */}
          {selectedClass && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-bold text-slate-700">
                  {selectedClassObj ? classLabel(selectedClassObj) : ""} —{" "}
                  {classStudents.length} Students
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {loading && (
                  <p className="text-center py-8 text-slate-400 text-sm">
                    Loading...
                  </p>
                )}
                {!loading && classStudents.length === 0 && (
                  <p className="text-center py-8 text-slate-400 text-sm">
                    No students found in{" "}
                    {selectedClassObj ? classLabel(selectedClassObj) : "this class"}
                  </p>
                )}
                {classStudents.map((s) => (
                  <div
                    key={s._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {s.full_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.admission_no} · Roll: {s.roll_no || "—"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedExam}
                      onClick={() => generateHallTicket(s, selectedExam)}
                      className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing schedules */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-sm font-bold text-slate-700">
                Exam Schedules Created
              </p>
            </div>
            {examSchedules.length === 0 ? (
              <p className="text-center py-6 text-slate-400 text-sm">
                No exam schedules yet. Create one first.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {examSchedules.map((e) => (
                  <div
                    key={e._id}
                    className="px-5 py-3 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {e.exam_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {e.class} · {e.exam_type} · {e.academic_year} ·{" "}
                        {(e.subjects || []).length} subjects
                      </p>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                      {e.exam_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "create" && !isTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-700">
            Create New Exam Schedule
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Exam Name", key: "exam_name", type: "input" },
              { label: "Exam Center", key: "center", type: "input" },
              { label: "Invigilator", key: "invigilator", type: "input" },
              { label: "Section", key: "section", type: "input" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">
                  {f.label}
                </label>
                <Input
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  className="text-sm"
                />
              </div>
            ))}
            {[
              { label: "Class", key: "class", opts: CLASSES },
              { label: "Exam Type", key: "exam_type", opts: EXAM_TYPES },
              {
                label: "Academic Year",
                key: "academic_year",
                opts: ACADEMIC_YEARS,
              },
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
                    <SelectValue />
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
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-700">
                Subject Schedule
              </h4>
              <button
                onClick={addSubject}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>
            <div className="space-y-2">
              {form.subjects.map((sub, i) => (
                <div
                  key={i}
                  className="grid grid-cols-5 gap-2 items-center bg-slate-50 p-3 rounded-xl"
                >
                  <Select
                    value={sub.subject}
                    onValueChange={(v) => updateSubject(i, "subject", v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={sub.date}
                    onChange={(e) => updateSubject(i, "date", e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    value={sub.time}
                    onChange={(e) => updateSubject(i, "time", e.target.value)}
                    placeholder="09:00 AM"
                    className="text-xs"
                  />
                  <Input
                    value={sub.duration}
                    onChange={(e) =>
                      updateSubject(i, "duration", e.target.value)
                    }
                    placeholder="3 Hours"
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={sub.max_marks}
                      onChange={(e) =>
                        updateSubject(i, "max_marks", Number(e.target.value))
                      }
                      placeholder="100"
                      className="text-xs"
                    />
                    <button
                      onClick={() => removeSubject(i)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActiveTab("generate")}>
              Cancel
            </Button>
            <Button
              onClick={saveExam}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              <Save className="w-4 h-4" />{" "}
              {saving ? "Saving..." : "Save Exam Schedule"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
