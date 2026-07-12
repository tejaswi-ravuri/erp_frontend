import React, { useState, useEffect, useMemo } from "react";
import { studentApi, classApi } from "@/api/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Fields that can never change once a student record exists - shown
// disabled in the edit form (see the "locked" check inside the field map
// below).
const LOCKED_ON_EDIT = ["admission_no", "roll_no"];

const EMPTY_ADDRESS = {
  line1: "",
  line2: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  country: "India",
};

const EMPTY = {
  admission_no: "",
  full_name: "",
  dob: "",
  gender: "",
  blood_group: "",
  class: "", // now a Class _id
  roll_no: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  address: { ...EMPTY_ADDRESS },
  joining_date: "",
  status: "Active",
};

// s.class may arrive as a raw ObjectId string, or as a populated Class doc.
const getClassId = (cls) =>
  (cls && typeof cls === "object" ? cls._id : cls) || "";
const getClassLabel = (cls, classMap) => {
  if (cls && typeof cls === "object" && cls.grade) return cls.grade;
  return classMap[getClassId(cls)]?.grade || "—";
};

const apiErrorMessage = (err) =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  "Something went wrong";

// Mongoose Dates serialize as full ISO strings - format for display,
// same reasoning as the <input type="date"> fix above.
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAddress = (addr) =>
  addr
    ? [
        addr.line1,
        addr.line2,
        addr.city,
        addr.district,
        addr.state,
        addr.pincode,
        addr.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "—";

export default function BPStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saving, setSaving] = useState(false);

  const classMap = useMemo(() => {
    const map = {};
    for (const c of classes) map[c._id] = c;
    return map;
  }, [classes]);

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((a, b) => (a.grade_order ?? 0) - (b.grade_order ?? 0)),
    [classes],
  );

  const load = () =>
    studentApi
      .list({ sort: "-created_date", limit: 1000 })
      .then((d) => {
        setStudents(d);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(apiErrorMessage(err));
        setLoading(false);
      });

  const loadClasses = () =>
    classApi
      .list()
      .then((data) => setClasses(data.data))
      .catch((err) => toast.error(apiErrorMessage(err)));

  useEffect(() => {
    load();
    loadClasses();
    const interval = setInterval(load, 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no?.includes(search);
    const matchClass =
      filterClass === "all" || getClassId(s.class) === filterClass;
    return matchSearch && matchClass;
  });

  useEffect(() => {
    setPage(1);
  }, [search, filterClass]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filtered.length);

  const openNew = () => {
    setForm({ ...EMPTY, address: { ...EMPTY_ADDRESS } });
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (s) => {
    setForm({
      ...s,
      class: getClassId(s.class),
      // <input type="date"> requires exactly YYYY-MM-DD - Mongoose Dates
      // serialize as full ISO strings ("2024-02-07T00:00:00.000Z"), which
      // the input silently rejects and just renders blank. Slice down to
      // the date-only portion regardless of which shape actually arrives.
      dob: s.dob ? String(s.dob).split("T")[0] : "",
      joining_date: s.joining_date ? String(s.joining_date).split("T")[0] : "",
      address: { ...EMPTY_ADDRESS, ...(s.address || {}) },
    });
    setEditing(s._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await studentApi.update(editing, form);
      } else {
        await studentApi.create(form);
      }
      setShowForm(false);
      toast.success(editing ? "Student updated" : "Student added");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student?")) return;
    try {
      await studentApi.remove(id);
      toast.success("Student deleted");
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
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
            {sortedClasses.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.grade}
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
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No students found
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-4 py-3 text-slate-500">
                      {s.admission_no || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {getClassLabel(s.class, classMap)}
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
                    {user.role !== "teacher" && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(s);
                            }}
                            className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s._id);
                            }}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
        classes={classes}
      />

      {/* Student Details Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {selected.full_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {getClassLabel(selected.class, classMap)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${selected.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                    >
                      {selected.status}
                    </span>
                  </div>
                </div>
                {user.role !== "teacher" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelected(null);
                        openEdit(selected);
                      }}
                      className="text-slate-400 hover:text-indigo-600 p-1.5"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelected(null);
                        handleDelete(selected._id);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1.5"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Admission No", selected.admission_no],
                  ["Roll No", selected.roll_no],
                  ["Gender", selected.gender],
                  ["Blood Group", selected.blood_group],
                  ["Date of Birth", fmtDate(selected.dob)],
                  ["Joining Date", fmtDate(selected.joining_date)],
                  ["Parent Name", selected.parent_name],
                  ["Parent Phone", selected.parent_phone],
                  ["Parent Email", selected.parent_email],
                  ["Address", formatAddress(selected.address)],
                ].map(([l, v]) => (
                  <div key={l} className={l === "Address" ? "col-span-2" : ""}>
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="font-medium text-slate-700">{v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Student" : "Add Student"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {[
              ["admission_no", "Admission No *"],
              ["full_name", "Full Name *"],
              ["roll_no", "Roll No"],
              ["parent_name", "Parent Name"],
              ["parent_phone", "Parent Phone"],
              ["parent_email", "Parent Email"],
            ].map(([k, l]) => {
              const locked = !!editing && LOCKED_ON_EDIT.includes(k);
              return (
                <div key={k}>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    {l}
                  </label>
                  <Input
                    value={form[k] || ""}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    disabled={locked}
                    className={locked ? "bg-slate-50 text-slate-500" : ""}
                  />
                  {locked && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cannot be changed after creation.
                    </p>
                  )}
                </div>
              );
            })}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Class *
              </label>
              <Select
                value={form.class || ""}
                onValueChange={(v) => setForm({ ...form, class: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {sortedClasses.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.grade}
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
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
                disabled={!!editing}
                className={editing ? "bg-slate-50 text-slate-500" : ""}
              />
              {editing && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Cannot be changed after creation.
                </p>
              )}
            </div>

            {/* Address - a structured subdocument on Student (see
                models/_addressSchema.js), not a flat string. line1, city,
                state, and pincode are required by the schema; line2,
                district, and country are optional (country defaults to
                "India" server-side if omitted). */}
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-700 mt-1 mb-2">
                Address
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Address Line 1 *
              </label>
              <Input
                value={form.address?.line1 || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, line1: e.target.value },
                  })
                }
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Address Line 2
              </label>
              <Input
                value={form.address?.line2 || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, line2: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                City *
              </label>
              <Input
                value={form.address?.city || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, city: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                District
              </label>
              <Input
                value={form.address?.district || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, district: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                State *
              </label>
              <Input
                value={form.address?.state || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, state: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Pincode *
              </label>
              <Input
                value={form.address?.pincode || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, pincode: e.target.value },
                  })
                }
                placeholder="6-digit PIN"
              />
              {form.address?.pincode &&
                !/^[1-9][0-9]{5}$/.test(form.address.pincode) && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Must be a valid 6-digit PIN code.
                  </p>
                )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Country
              </label>
              <Input
                value={form.address?.country || "India"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, country: e.target.value },
                  })
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
              disabled={
                saving ||
                !form.admission_no ||
                !form.full_name ||
                !form.class ||
                !form.address?.line1 ||
                !form.address?.city ||
                !form.address?.state ||
                !/^[1-9][0-9]{5}$/.test(form.address?.pincode || "")
              }
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
