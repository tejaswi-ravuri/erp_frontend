import React, { useState, useEffect, useMemo } from "react";
import { authApi } from "../api/authApi";
import { classApi } from "@/api/api";
import { ROLES, useRole } from "@/lib/RoleContext";
import { SUBJECTS } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, Trash2, GraduationCap, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const GRADES = [
  "NURSERY",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];

const ACADEMIC_YEAR_RE = /^\d{4}-\d{4}$/;

// School year runs June-May, so before June the "current" academic year
// still started last calendar year.
function currentAcademicYearStart() {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
}

function defaultAcademicYear() {
  const y = currentAcademicYearStart();
  return `${y}-${y + 1}`;
}

const ACADEMIC_YEARS = ["2025-2026", "2026-2027"];

// capacity is optional on the schema (default null) - kept as an empty
// string here so the Input can stay blank/uncontrolled-looking; it's
// converted to a Number (or dropped entirely) in saveClass.
const EMPTY_CLASS_FORM = {
  grade: "",
  academic_year: defaultAcademicYear(),
  capacity: "",
};

const apiErrorMessage = (err) =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  "Something went wrong";

export default function BPClasses() {
  const { activeRole } = useRole();
  const isPrincipal = activeRole === ROLES.PRINCIPAL;
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState(EMPTY_CLASS_FORM);
  const [teacherDialogClass, setTeacherDialogClass] = useState(null);
  const [assignForm, setAssignForm] = useState({ teacher_id: "", subject: "" });
  const [confirmDeleteClass, setConfirmDeleteClass] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await classApi.list();
      setClasses(res.data || []);
      setTeachers(res.teachers || []);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const teacherById = useMemo(
    () => Object.fromEntries(teachers.map((t) => [t._id, t])),
    [teachers],
  );

  const isDuplicateClass = classes.some(
    (c) =>
      c.grade === classForm.grade &&
      c.academic_year === classForm.academic_year,
  );

  const academicYearValid = ACADEMIC_YEAR_RE.test(
    classForm.academic_year || "",
  );

  const classFormError = !classForm.grade
    ? null
    : !academicYearValid
      ? "Academic year must be in YYYY-YYYY format, e.g. 2026-2027."
      : isDuplicateClass
        ? `Class ${classForm.grade} for ${classForm.academic_year} already exists.`
        : null;

  const canSaveClass =
    !!classForm.grade && academicYearValid && !isDuplicateClass;

  const saveClass = async () => {
    if (!canSaveClass) return;
    try {
      const payload = {
        grade: classForm.grade,
        academic_year: classForm.academic_year,
      };
      if (classForm.capacity !== "" && classForm.capacity != null) {
        payload.capacity = Number(classForm.capacity);
      }
      await classApi.create(payload);
      setShowAddClass(false);
      setClassForm(EMPTY_CLASS_FORM);
      toast.success("Class added");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const deleteClass = async (id) => {
    try {
      await classApi.remove(id);
      toast.success("Class deleted");
      setConfirmDeleteClass(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const setClassTeacher = async (classId, teacherId) => {
    try {
      await classApi.update(classId, { class_teacher_id: teacherId || null });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const addSubjectTeacher = async () => {
    if (!teacherDialogClass || !assignForm.teacher_id || !assignForm.subject)
      return;
    try {
      await classApi.assignSubjectTeacher(teacherDialogClass._id, {
        teacher_id: assignForm.teacher_id,
        subject: assignForm.subject,
      });
      setAssignForm({ teacher_id: "", subject: "" });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const removeSubjectTeacher = async (teacherId, subject) => {
    if (!teacherDialogClass) return;
    try {
      await classApi.removeSubjectTeacher(teacherDialogClass._id, {
        teacher_id: teacherId,
        subject,
      });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!teacherDialogClass) return;
    const fresh = classes.find((c) => c._id === teacherDialogClass._id);
    if (fresh) setTeacherDialogClass(fresh);
  }, [classes]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Classes</h2>
          <p className="text-sm text-slate-500">
            Set up classes, assign a Class Teacher, and assign subject teachers
          </p>
        </div>
        {isPrincipal && (
          <Button
            onClick={() => setShowAddClass(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Class
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Class",
                  "Academic Year",
                  "Class Teacher",
                  "Subject Teachers",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && classes?.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No classes yet - add one to get started.
                  </td>
                </tr>
              )}
              {!loading &&
                classes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      Class {c.grade}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.academic_year}
                    </td>
                    <td className="px-4 py-3">
                      {isPrincipal ? (
                        <Select
                          value={c.class_teacher_id || "none"}
                          onValueChange={(v) =>
                            setClassTeacher(c._id, v === "none" ? null : v)
                          }
                        >
                          <SelectTrigger className="w-48 text-xs">
                            <SelectValue placeholder="Not assigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not assigned</SelectItem>
                            {teachers.map((t) => (
                              <SelectItem key={t._id} value={t._id}>
                                {t.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        teachers.find((t) => t._id === c.class_teacher_id)
                          ?.full_name || "Not assigned"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setTeacherDialogClass(c)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {(c.subject_teachers || []).length} subject
                        {(c.subject_teachers || []).length === 1
                          ? ""
                          : "s"}{" "}
                        assigned
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmDeleteClass(c)}
                        className="text-slate-400 hover:text-red-600"
                        aria-label="Delete class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAddClass} onOpenChange={setShowAddClass}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Class *
              </label>
              <Select
                value={classForm.grade}
                onValueChange={(v) => setClassForm({ ...classForm, grade: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Academic Year *
              </label>
              <Select
                value={classForm.academic_year}
                onValueChange={(v) =>
                  setClassForm({ ...classForm, academic_year: v })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Capacity
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Optional - max number of students"
                value={classForm.capacity}
                onChange={(e) =>
                  setClassForm({ ...classForm, capacity: e.target.value })
                }
                className="text-sm"
              />
            </div>
            {classFormError && (
              <p className="col-span-2 text-xs text-red-500">
                {classFormError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddClass(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveClass}
              disabled={!canSaveClass}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!teacherDialogClass}
        onOpenChange={() => setTeacherDialogClass(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {teacherDialogClass &&
                `Subject teachers — Class ${teacherDialogClass.grade}`}
            </DialogTitle>
          </DialogHeader>
          {teacherDialogClass && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                {(teacherDialogClass.subject_teachers || []).length === 0 && (
                  <p className="text-xs text-slate-400">
                    No subject teachers assigned yet.
                  </p>
                )}
                {(teacherDialogClass.subject_teachers || []).map((row) => (
                  <div
                    key={`${row.teacher_id}-${row.subject}`}
                    className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-slate-700">
                        {teacherById[row.teacher_id]?.full_name ||
                          "Unknown teacher"}
                      </span>
                      <span className="text-slate-400">teaches</span>
                      <span className="font-medium text-slate-700">
                        {row.subject}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        removeSubjectTeacher(row.teacher_id, row.subject)
                      }
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Teacher
                  </label>
                  <Select
                    value={assignForm.teacher_id}
                    onValueChange={(v) =>
                      setAssignForm({ ...assignForm, teacher_id: v })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Subject
                  </label>
                  <Select
                    value={assignForm.subject}
                    onValueChange={(v) =>
                      setAssignForm({ ...assignForm, subject: v })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select subject" />
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
                <Button
                  onClick={addSubjectTeacher}
                  disabled={!assignForm.teacher_id || !assignForm.subject}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteClass}
        onOpenChange={() => setConfirmDeleteClass(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete this class?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium text-slate-800">
              Class {confirmDeleteClass?.grade} (
              {confirmDeleteClass?.academic_year})
            </span>{" "}
            will be removed from the list. You can bring it back later by
            re-adding the same class - it just won't remember its old Class
            Teacher or subject teachers.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteClass(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteClass(confirmDeleteClass._id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
