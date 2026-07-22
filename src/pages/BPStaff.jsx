import React, { useState, useEffect, useMemo } from "react";
import { userApi, branchApi } from "@/api/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  User,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  AlertTriangle,
  Building2,
  ArrowUpDown,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/bp/StatusBadge";
import { SUBJECTS, INDIAN_STATES } from "@/lib/constants.js";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Which roles each viewer can assign when adding/editing a staff member.
// Admin Officer manages branch-level leadership (Principal, Accounts
// Manager) across branches; Accounts Manager and Principal only manage
// Teachers within their own single branch.
const ROLE_OPTIONS_BY_VIEWER = {
  admin_officer: [
    { value: "principal", label: "Principal" },
    { value: "accounts_manager", label: "Accounts Manager" },
  ],
  accounts_manager: [{ value: "teacher", label: "Teacher" }],
  principal: [{ value: "teacher", label: "Teacher" }],
};
const DEFAULT_ROLE_OPTIONS = [{ value: "teacher", label: "Teacher" }];
const ROLE_LABELS = {
  teacher: "Teacher",
  principal: "Principal",
  accounts_manager: "Accounts Manager",
  admin_officer: "Admin Officer",
  super_admin: "Super Admin",
};

const PINCODE_RE = /^[1-9][0-9]{5}$/;
const PHONE_RE = /^\d{10}$/;
const EMPTY_ADDRESS = {
  line1: "",
  line2: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  country: "India",
};

// staff_id does not exist on the User schema at all - dropped. password
// is new (User requires one; the old Staff-as-a-separate-entity form
// never needed it). status is is_active (Boolean), not an enum string.
// subject_taught is an array (a teacher can teach more than one subject) -
// see models/User.js.
const EMPTY_FORM = {
  full_name: "",
  role: "teacher",
  branch: "",
  email: "",
  password: "",
  subject_taught: [],
  qualification: "",
  phone: "",
  address: { ...EMPTY_ADDRESS },
  joining_date: new Date().toISOString().split("T")[0],
  salary: "",
  is_active: true,
};

const randomPassword = () =>
  Math.random().toString(36).slice(-6) +
  Math.random().toString(36).slice(-4).toUpperCase();

// Format for display wherever subject_taught is shown as plain text -
// defensive against legacy string data that predates the array schema.
const formatSubjects = (val) =>
  Array.isArray(val) && val.length ? val.join(", ") : "—";

export default function BPStaff() {
  const { user } = useAuth();
  const viewerRole = user?.role;
  const isPrincipal = viewerRole === "principal";
  const isMultiBranch = viewerRole === "admin_officer";
  // Admin Officer creates branch-level leadership across any branch, so
  // they must explicitly pick which branch a new Principal/Accounts
  // Manager belongs to. Accounts Manager and Principal only ever add
  // Teachers into their own branch, which the backend fills in
  // automatically from their account - no picker needed for them.
  const showBranchField = viewerRole === "admin_officer";
  const baseRoleOptions =
    ROLE_OPTIONS_BY_VIEWER[viewerRole] || DEFAULT_ROLE_OPTIONS;
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = "add" mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmDeleteStaff, setConfirmDeleteStaff] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Row-level Edit/Delete controls are only shown to viewers who actually
  // have Staff.update/Staff.delete permission (see rbac/permissions.js -
  // PRINCIPAL and ADMIN_OFFICER, not TEACHER or ACCOUNTS_MANAGER, who only
  // have Staff.read). This mirrors that at a coarse "not a teacher" level
  // for now; if an ACCOUNTS_MANAGER ever views this screen they'd still
  // see these buttons even though the backend would reject the write -
  // worth tightening to an explicit role allow-list if that's a real case.
  const canManageStaff = user?.role !== "teacher";
  // A Principal can see Accounts Managers on this page but only ever
  // edit/deactivate Teacher records - the backend enforces this too
  // (userController.js), this just keeps the buttons from appearing.
  const canManageRow = (s) =>
    canManageStaff && (!isPrincipal || s.role === "teacher");

  // Admin officers pick which of their assigned branches to view (or all
  // of them combined) - GET /api/branches already only returns branches
  // they're actually assigned to.
  useEffect(() => {
    if (!isMultiBranch) return;
    branchApi
      .list()
      .then((data) => setBranches(data || []))
      .catch(() => toast.error("Failed to load branches"));
  }, [isMultiBranch]);

  const load = async () => {
    setLoading(true);
    const branchParam =
      isMultiBranch && selectedBranch !== "all" ? selectedBranch : undefined;
    const data = await userApi.list({
      exclude_role: "student",
      branch: branchParam,
    });
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [isMultiBranch, selectedBranch]);

  const roleOptions = useMemo(
    () => [...new Set(staff.map((s) => s.role).filter(Boolean))],
    [staff],
  );

  // Options for the Add/Edit form's Role select - scoped to what this
  // viewer is allowed to assign. If editing a record whose current role
  // falls outside that set (e.g. an Admin Officer opening a legacy
  // Teacher record), keep it selectable so the field doesn't render blank.
  const formRoleOptions = useMemo(() => {
    if (
      editingId &&
      form.role &&
      !baseRoleOptions.some((r) => r.value === form.role)
    ) {
      return [
        ...baseRoleOptions,
        { value: form.role, label: ROLE_LABELS[form.role] || form.role },
      ];
    }
    return baseRoleOptions;
  }, [baseRoleOptions, editingId, form.role]);

  const visibleStaff = useMemo(() => {
    return staff
      .filter((s) => roleFilter === "all" || s.role === roleFilter)
      .filter((s) => {
        if (statusFilter === "all") return true;
        const active = s.is_active !== false;
        return statusFilter === "Active" ? active : !active;
      })
      .sort((a, b) => {
        let aVal, bVal;
        if (sortBy === "salary") {
          aVal = a.salary || 0;
          bVal = b.salary || 0;
        } else {
          aVal = a.full_name || "";
          bVal = b.full_name || "";
        }
        if (typeof aVal === "string")
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      });
  }, [staff, roleFilter, statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(visibleStaff.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, selectedBranch]);

  const paginated = visibleStaff.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const rangeStart = visibleStaff.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, visibleStaff.length);

  const openAddForm = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      role: baseRoleOptions[0]?.value || "teacher",
      branch: "",
      address: { ...EMPTY_ADDRESS },
      subject_taught: [],
    });
    setShowForm(true);
  };

  const openEditForm = (s) => {
    setEditingId(s._id);
    setForm({
      full_name: s.full_name || "",
      role: s.role || "teacher",
      branch: s.branch || "",
      email: s.email || "",
      password: "", // left blank = unchanged
      // Defensive: normalize whatever shape comes back (array, legacy
      // comma-string, plain string, or nothing) into a clean array.
      subject_taught: Array.isArray(s.subject_taught)
        ? s.subject_taught
        : s.subject_taught
          ? String(s.subject_taught)
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      qualification: s.qualification || "",
      phone: s.phone || "",
      address: { ...EMPTY_ADDRESS, ...(s.address || {}) },
      joining_date: s.joining_date ? String(s.joining_date).split("T")[0] : "",
      salary: s.salary != null ? String(s.salary) : "",
      is_active: s.is_active !== false,
    });
    setSelected(null);
    setShowForm(true);
  };

  const addressGiven = Object.entries(form.address || {}).some(
    ([k, v]) => k !== "country" && v,
  );
  const addressValid =
    !addressGiven ||
    (form.address.line1 &&
      form.address.city &&
      form.address.state &&
      PINCODE_RE.test(form.address.pincode || ""));
  const phoneValid = !form.phone || PHONE_RE.test(form.phone);

  const canSave =
    form.full_name &&
    form.role &&
    form.email &&
    (editingId || form.password) && // password required only when creating
    (!showBranchField || form.branch) &&
    addressValid &&
    phoneValid;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        role: form.role,
        email: form.email,
        subject_taught: form.subject_taught.length
          ? form.subject_taught
          : undefined,
        qualification: form.qualification || undefined,
        phone: form.phone || undefined,
        joining_date: form.joining_date || undefined,
        salary: form.salary !== "" ? Number(form.salary) : undefined,
        is_active: form.is_active,
        address: addressGiven ? form.address : undefined,
      };
      if (form.password) payload.password = form.password;
      // Only sent for Admin Officer, who has no single default branch of
      // their own - Accounts Manager/Principal omit it entirely so the
      // backend defaults to the creator's own branch.
      if (showBranchField) payload.branch = form.branch;

      if (editingId) {
        await userApi.update(editingId, payload);
      } else {
        await userApi.create(payload);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setPage(1);
      load();
    } finally {
      setSaving(false);
    }
  };

  // Deletion always goes through the confirmation dialog below now -
  // never call userApi.remove directly from a click handler.
  const confirmDelete = async () => {
    if (!confirmDeleteStaff) return;
    setDeleting(true);
    try {
      await userApi.remove(confirmDeleteStaff._id);
      setConfirmDeleteStaff(null);
      setSelected(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Staff</h2>
          <p className="text-sm text-slate-500">{visibleStaff.length} members</p>
        </div>
        <Button
          onClick={openAddForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isMultiBranch && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {!isPrincipal && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="salary">Sort: Salary</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          className="h-9 px-3 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-sm"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortDir === "asc" ? "A→Z" : "Z→A"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Name",
                  "Role",
                  "Subject",
                  "Phone",
                  "Salary",
                  "Status",
                  ...(canManageStaff ? [""] : []),
                ].map((h) => (
                  <th
                    key={h || "actions"}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
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
                    colSpan={canManageStaff ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && visibleStaff.length === 0 && (
                <tr>
                  <td
                    colSpan={canManageStaff ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No staff found
                  </td>
                </tr>
              )}
              {!loading &&
                paginated.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <span className="font-medium text-slate-800">
                          {s.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={s.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatSubjects(s.subject_taught)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      ₹{Number(s.salary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        value={s.is_active === false ? "Inactive" : "Active"}
                      />
                    </td>
                    {canManageStaff && (
                      <td className="px-4 py-3">
                        {canManageRow(s) ? (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // don't also open the detail dialog
                                openEditForm(s);
                              }}
                              className="p-1.5 rounded hover:bg-indigo-50 text-indigo-500"
                              aria-label="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteStaff(s);
                              }}
                              className="p-1.5 rounded hover:bg-red-50 text-red-400"
                              aria-label="Deactivate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {staff.length === 0
                ? "0 results"
                : `Showing ${rangeStart}–${rangeEnd} of ${staff.length}`}
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

      {/* Staff Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {selected.full_name}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <StatusBadge value={selected.role} />
                      <StatusBadge
                        value={
                          selected.is_active === false ? "Inactive" : "Active"
                        }
                      />
                    </div>
                  </div>
                </div>
                {canManageRow(selected) && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditForm(selected)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteStaff(selected)}
                      className="text-slate-400 hover:text-red-600 p-1.5"
                      aria-label="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Email", selected.email],
                  ["Subject", formatSubjects(selected.subject_taught)],
                  ["Qualification", selected.qualification],
                  ["Phone", selected.phone],
                  [
                    "Salary",
                    `₹${Number(selected.salary || 0).toLocaleString("en-IN")}`,
                  ],
                  [
                    "Joining Date",
                    selected.joining_date
                      ? String(selected.joining_date).split("T")[0]
                      : "—",
                  ],
                  [
                    "Address",
                    selected.address
                      ? [
                          selected.address.line1,
                          selected.address.line2,
                          selected.address.city,
                          selected.address.state,
                          selected.address.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "—",
                  ],
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

      {/* Delete confirmation - deliberately not a bare window.confirm().
          Note this is a SOFT delete (is_active: false) - the account can
          still be reactivated later from Edit, so the copy below doesn't
          claim it's permanent, just serious. */}
      <Dialog
        open={!!confirmDeleteStaff}
        onOpenChange={() => setConfirmDeleteStaff(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Deactivate staff member?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium text-slate-800">
              {confirmDeleteStaff?.full_name}
            </span>{" "}
            will be deactivated and lose access immediately - they won't be able
            to log in. This can be reversed later from Edit if needed, but treat
            it as permanent unless you're sure.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteStaff(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Staff Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Full Name *
              </label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Role *
              </label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formRoleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showBranchField && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Branch *
                </label>
                <Select
                  value={form.branch}
                  onValueChange={(v) => setForm({ ...form, branch: v })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Email *
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                {editingId
                  ? "New Password (leave blank to keep current)"
                  : "Password *"}
              </label>
              <div className="flex gap-1.5">
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="text-sm"
                  placeholder={editingId ? "Unchanged" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() =>
                    setForm({ ...form, password: randomPassword() })
                  }
                >
                  Generate
                </Button>
              </div>
              {!editingId && form.password && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Share this password with the staff member - it won't be shown
                  again.
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Subject(s) Taught
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between text-sm font-normal"
                  >
                    {form.subject_taught.length
                      ? form.subject_taught.join(", ")
                      : "Select subjects"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    {SUBJECTS.map((subject) => (
                      <label
                        key={subject}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={form.subject_taught.includes(subject)}
                          onCheckedChange={(checked) => {
                            setForm((prev) => ({
                              ...prev,
                              subject_taught: checked
                                ? [...prev.subject_taught, subject]
                                : prev.subject_taught.filter(
                                    (s) => s !== subject,
                                  ),
                            }));
                          }}
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Qualification
              </label>
              <Input
                value={form.qualification}
                onChange={(e) =>
                  setForm({ ...form, qualification: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                maxLength={10}
                placeholder="10-digit mobile"
                className="text-sm"
              />
              {form.phone && !PHONE_RE.test(form.phone) && (
                <p className="text-[11px] text-red-500 mt-1">
                  Must be a valid 10-digit phone number.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Salary (₹)
              </label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Joining Date
              </label>
              <Input
                type="date"
                value={form.joining_date}
                onChange={(e) =>
                  setForm({ ...form, joining_date: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Status
              </label>
              <Select
                value={form.is_active ? "Active" : "Inactive"}
                onValueChange={(v) =>
                  setForm({ ...form, is_active: v === "Active" })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address - a structured subdocument (see
                models/_addressSchema.js), not a flat string. Entirely
                optional; if any part is filled, line1/city/state/pincode
                become required. */}
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-700 mt-1 mb-1">
                Address
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Address Line 1
              </label>
              <Input
                value={form.address.line1}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, line1: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Address Line 2
              </label>
              <Input
                value={form.address.line2}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, line2: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                City
              </label>
              <Input
                value={form.address.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, city: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                District
              </label>
              <Input
                value={form.address.district}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: { ...form.address, district: e.target.value },
                  })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                State
              </label>
              <Select
                value={form.address.state}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    address: { ...form.address, state: v },
                  })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Pincode
              </label>
              <Input
                value={form.address.pincode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: {
                      ...form.address,
                      pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    },
                  })
                }
                maxLength={6}
                placeholder="6-digit PIN"
                className="text-sm"
              />
              {addressGiven &&
                form.address.pincode &&
                !PINCODE_RE.test(form.address.pincode) && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Must be a valid 6-digit PIN code.
                  </p>
                )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!canSave || saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
