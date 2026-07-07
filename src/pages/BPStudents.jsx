import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StudentBulkUpload from "@/components/students/StudentBulkUpload";
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
  "Class 11",
  "Class 12",
];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY = {
  admission_no: "",
  full_name: "",
  dob: "",
  gender: "",
  blood_group: "",
  class: "",
  section: "",
  roll_no: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  address: "",
  city: "",
  joining_date: "",
  status: "Active",
};

export default function BPStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = () =>
    entities.Student.list("-created_date").then((d) => {
      setStudents(d);
      setLoading(false);
    });
  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no?.includes(search);
    const matchClass = filterClass === "all" || s.class === filterClass;
    return matchSearch && matchClass;
  });

  // Jump back to page 1 whenever the filtered set changes because of a
  // new search term or class filter, so the user isn't left staring at
  // an empty page.
  useEffect(() => {
    setPage(1);
  }, [search, filterClass]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // If rows disappear (e.g. after a delete) and the current page no
  // longer exists, clamp back to the last valid page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filtered.length);

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (s) => {
    setForm(s);
    setEditing(s.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) await entities.Student.update(editing, form);
    else await entities.Student.create(form);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this student?")) {
      await entities.Student.delete(id);
      load();
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Students</h2>
          <p className="text-sm text-slate-500">
            {students.length} total students
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulk(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button
            onClick={openNew}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or admission no..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
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
                {[
                  "Adm. No",
                  "Name",
                  "Class",
                  "Section",
                  "Gender",
                  "Parent",
                  "Phone",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No students found
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {s.admission_no || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.class}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.section || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.gender || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.parent_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.parent_phone || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {filtered.length === 0
                ? "0 results"
                : `Showing ${rangeStart}–${rangeEnd} of ${filtered.length}`}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <span className="text-xs text-slate-500 px-1">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <StudentBulkUpload
        open={showBulk}
        onClose={() => setShowBulk(false)}
        onUploaded={load}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Student" : "Add Student"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {[
              ["admission_no", "Admission No"],
              ["full_name", "Full Name *"],
              ["roll_no", "Roll No"],
              ["section", "Section"],
              ["parent_name", "Parent Name"],
              ["parent_phone", "Parent Phone"],
              ["parent_email", "Parent Email"],
              ["address", "Address"],
              ["city", "City"],
            ].map(([k, l]) => (
              <div key={k} className={k === "address" ? "col-span-2" : ""}>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  {l}
                </label>
                <Input
                  value={form[k] || ""}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Class *
              </label>
              <Select
                value={form.class || ""}
                onValueChange={(v) => setForm({ ...form, class: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Gender
              </label>
              <Select
                value={form.gender || ""}
                onValueChange={(v) => setForm({ ...form, gender: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Blood Group
              </label>
              <Select
                value={form.blood_group || ""}
                onValueChange={(v) => setForm({ ...form, blood_group: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                    (b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Status
              </label>
              <Select
                value={form.status || "Active"}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Date of Birth
              </label>
              <Input
                type="date"
                value={form.dob || ""}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Joining Date
              </label>
              <Input
                type="date"
                value={form.joining_date || ""}
                onChange={(e) =>
                  setForm({ ...form, joining_date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
