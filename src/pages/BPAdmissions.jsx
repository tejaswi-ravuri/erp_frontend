import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Plus, Search, Pencil, Trash2, Eye, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdmissionForm from "@/components/admissions/AdmissionForm";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  Enquiry: "bg-slate-100 text-slate-600",
  Applied: "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Admitted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const STAT_CARDS = [
  {
    label: "Total Applications",
    key: "all",
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    label: "Admitted",
    key: "Admitted",
    color: "bg-green-50 border-green-200 text-green-700",
  },
  {
    label: "Under Review",
    key: "Under Review",
    color: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    label: "Rejected",
    key: "Rejected",
    color: "bg-red-50 border-red-200 text-red-700",
  },
];

const BRANCHES = ["Hyderabad", "Secunderabad", "Kukatpally", "Miyapur"];
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
const STATUSES = ["Enquiry", "Applied", "Under Review", "Admitted", "Rejected"];
const YEARS = ["2023-24", "2024-25", "2025-26"];

export default function BPAdmissions() {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("edit"); // 'edit' | 'view'
  const [selected, setSelected] = useState(null);

  const load = () =>
    entities.Admission.list("-created_date").then(setAdmissions);
  useEffect(() => {
    load();
  }, []);

  const handleAdmitSuccess = (student) => {
    setShowForm(false);
    setSelected(null);
    // Redirect to student receipt with student data
    navigate("/student-receipt", {
      state: { studentId: student.id, autoLoad: true },
    });
  };

  const filtered = admissions.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      (a.student_name || "").toLowerCase().includes(q) ||
      (a.application_no || "").toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all" || a.form_status === filterStatus;
    const matchBranch = filterBranch === "all" || a.branch === filterBranch;
    const matchClass = filterClass === "all" || a.class_sought === filterClass;
    const matchYear = filterYear === "all" || a.academic_year === filterYear;
    return matchSearch && matchStatus && matchBranch && matchClass && matchYear;
  });

  const counts = admissions.reduce((acc, a) => {
    acc[a.form_status] = (acc[a.form_status] || 0) + 1;
    return acc;
  }, {});

  const openNew = () => {
    setSelected(null);
    setFormMode("edit");
    setShowForm(true);
  };
  const openView = (a) => {
    setSelected(a);
    setFormMode("view");
    setShowForm(true);
  };
  const openEdit = (a) => {
    setSelected(a);
    setFormMode("edit");
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };
  const handleSaved = () => {
    closeForm();
    load();
  };

  const handleDelete = async (a) => {
    const st = a.form_status;
    if (st !== "Enquiry" && st !== "Rejected") return;
    if (confirm(`Delete application for ${a.student_name}?`)) {
      await entities.Admission.delete(a.id);
      load();
    }
  };

  const handleConvert = async (a) => {
    if (a.form_status !== "Admitted") return;
    if (!confirm(`Create a Student record for ${a.student_name}?`)) return;
    await entities.Student.create({
      full_name: a.student_name,
      admission_no: a.admission_no || a.application_no,
      class: (a.class_sought || "").replace("Class ", ""),
      gender: a.gender || "",
      dob: a.dob || "",
      blood_group: a.blood_group || "",
      parent_name: a.father_name || "",
      parent_phone: a.father_mobile || "",
      parent_email: a.father_email || "",
      address: a.communication_address || "",
      joining_date: new Date().toISOString().split("T")[0],
      status: "Active",
    });
    alert(`Student record created for ${a.student_name}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Admissions</h2>
          <p className="text-sm text-slate-500">
            {admissions.length} total applications
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-indigo-600 hover:bg-indigo-700 gap-1"
        >
          <Plus className="w-4 h-4" />
          New Admission
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {STAT_CARDS.map((c) => (
          <div
            key={c.key}
            className={`${c.color} border rounded-xl px-4 py-3 cursor-pointer transition-all hover:shadow-md ${filterStatus === c.key ? "ring-2 ring-offset-1 ring-indigo-400" : ""}`}
            onClick={() =>
              setFilterStatus(filterStatus === c.key ? "all" : c.key)
            }
          >
            <p className="text-xs font-medium opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">
              {c.key === "all" ? admissions.length : counts[c.key] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name or app no..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Acad. Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {BRANCHES.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Class" />
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "App No.",
                  "Student Name",
                  "Class",
                  "Branch",
                  "Mobile",
                  "Acad. Year",
                  "Status",
                  "Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-indigo-600 font-semibold">
                      {a.application_no || "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {a.student_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.class_sought || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.branch || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.father_mobile || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {a.academic_year || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.form_status] || "bg-slate-100 text-slate-600"}`}
                      >
                        {a.form_status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {a.created_date
                        ? format(new Date(a.created_date), "dd MMM yyyy")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openView(a)}
                          title="View"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(a)}
                          title="Edit"
                          className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {a.form_status === "Admitted" && (
                          <button
                            onClick={() => handleConvert(a)}
                            title="Convert to Student"
                            className="p-1.5 rounded hover:bg-green-50 text-green-600"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(a.form_status === "Enquiry" ||
                          a.form_status === "Rejected") && (
                          <button
                            onClick={() => handleDelete(a)}
                            title="Delete"
                            className="p-1.5 rounded hover:bg-red-50 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <AdmissionForm
          admission={selected}
          readOnly={formMode === "view"}
          onClose={closeForm}
          onSaved={handleSaved}
          onAdmit={handleAdmitSuccess}
        />
      )}
    </div>
  );
}
