import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Plus, User, X, ChevronLeft, ChevronRight } from "lucide-react";
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
import StatusBadge from "@/components/bp/StatusBadge";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const EMPTY = {
  staff_id: "",
  full_name: "",
  role: "Teacher",
  subject_taught: "",
  qualification: "",
  phone: "",
  email: "",
  address: "",
  joining_date: new Date().toISOString().split("T")[0],
  salary: "",
  status: "Active",
};

export default function BPStaff() {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    const data = await entities.Staff.list();
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totalPages = Math.max(1, Math.ceil(staff.length / pageSize));
  // If staff shrinks (e.g. after a future delete) and the current page
  // no longer exists, clamp back to the last valid page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = staff.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = staff.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, staff.length);

  const save = async () => {
    await entities.Staff.create({
      ...form,
      salary: Number(form.salary),
    });
    setShowForm(false);
    setForm(EMPTY);
    setPage(1);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Staff</h2>
          <p className="text-sm text-slate-500">{staff.length} members</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "Staff ID",
                  "Name",
                  "Role",
                  "Subject",
                  "Phone",
                  "Salary",
                  "Status",
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
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && staff.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No staff found
                  </td>
                </tr>
              )}
              {!loading &&
                paginated.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {s.staff_id}
                    </td>
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
                      {s.subject_taught || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      ₹{Number(s.salary || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={s.status} />
                    </td>
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
                    <StatusBadge value={selected.status} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Staff ID", selected.staff_id],
                  ["Subject", selected.subject_taught || "—"],
                  ["Qualification", selected.qualification],
                  ["Phone", selected.phone],
                  ["Email", selected.email],
                  [
                    "Salary",
                    `₹${Number(selected.salary || 0).toLocaleString("en-IN")}`,
                  ],
                  ["Joining Date", selected.joining_date],
                  ["Address", selected.address],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-xs text-slate-400">{l}</p>
                    <p className="font-medium text-slate-700">{v || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { label: "Staff ID", key: "staff_id" },
              { label: "Full Name", key: "full_name" },
              { label: "Subject Taught", key: "subject_taught" },
              { label: "Qualification", key: "qualification" },
              { label: "Phone", key: "phone" },
              { label: "Email", key: "email" },
              { label: "Salary (₹)", key: "salary", type: "number" },
              { label: "Joining Date", key: "joining_date", type: "date" },
              { label: "Address", key: "address" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  {f.label}
                </label>
                <Input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="text-sm"
                />
              </div>
            ))}
            {[
              {
                label: "Role",
                key: "role",
                opts: ["Teacher", "Admin", "Support"],
              },
              { label: "Status", key: "status", opts: ["Active", "Inactive"] },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  {f.label}
                </label>
                <Select
                  value={form[f.key]}
                  onValueChange={(v) => setForm({ ...form, [f.key]: v })}
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
