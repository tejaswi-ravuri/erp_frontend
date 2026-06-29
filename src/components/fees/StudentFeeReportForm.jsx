import React, { useState } from "react";
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
import { X } from "lucide-react";

const EMPTY = {
  sno: "",
  student_id: "",
  student_name: "",
  father_name: "",
  mob_number: "",
  class: "",
  student_type: "",
  old_fee: 0,
  adm_gross_fee: "",
  adm_concession: 0,
  paid_adm_fee: "",
  gross_term_fee: "",
  term_concession: 0,
  paid_term_fee: "",
  remarks: "",
  status: "Active",
};

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value, color }) {
  const colors = {
    red: "text-red-600",
    green: "text-green-600",
    default: "text-slate-800",
  };
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${colors[color] || colors.default}`}>
        ₹{(value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export default function StudentFeeReportForm({
  record,
  onClose,
  onSaved,
  nextSno,
}) {
  const [form, setForm] = useState(
    record ? { ...EMPTY, ...record } : { ...EMPTY, sno: nextSno },
  );
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Admission Fee derived
  const admGross = parseFloat(form.adm_gross_fee) || 0;
  const admConcession = parseFloat(form.adm_concession) || 0;
  const netAdmFee = admGross - admConcession;
  const paidAdmFee = parseFloat(form.paid_adm_fee) || 0;
  const balanceAdmFee = netAdmFee - paidAdmFee;

  // Term Fee derived
  const oldFee =
    form.student_type === "New" ? 0 : parseFloat(form.old_fee) || 0;
  const grossTermFee = parseFloat(form.gross_term_fee) || 0;
  const termConcession = parseFloat(form.term_concession) || 0;
  const netTermFee = oldFee + grossTermFee - termConcession;
  const paidTermFee = parseFloat(form.paid_term_fee) || 0;
  const balanceTermFee = netTermFee - paidTermFee;

  const handleIdLookup = async (id) => {
    set("student_id", id);
    if (!id || id.length < 5) return;
    setLookupLoading(true);
    try {
      const students = await entities.Student.filter({
        admission_no: id,
      });
      if (students.length > 0) {
        const s = students[0];
        setForm((prev) => ({
          ...prev,
          student_id: id,
          student_name: s.full_name || prev.student_name,
          father_name: s.parent_name || prev.father_name,
          mob_number: s.parent_phone || prev.mob_number,
          class: s.class || prev.class,
        }));
      }
    } catch (e) {
      /* ignore */
    }
    setLookupLoading(false);
  };

  const handleSave = async () => {
    if (
      !form.student_name ||
      !form.student_id ||
      !form.father_name ||
      !form.mob_number ||
      !form.class ||
      !form.student_type
    ) {
      alert("Please fill all required fields.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      old_fee: form.student_type === "New" ? 0 : parseFloat(form.old_fee) || 0,
      adm_gross_fee: admGross,
      adm_concession: admConcession,
      net_adm_fee: netAdmFee,
      paid_adm_fee: paidAdmFee,
      balance_adm_fee: balanceAdmFee,
      gross_term_fee: grossTermFee,
      term_concession: termConcession,
      net_term_fee: netTermFee,
      paid_term_fee: paidTermFee,
      balance_term_fee: balanceTermFee,
      sno: parseFloat(form.sno) || nextSno,
      status: form.status || "Active",
    };
    if (record?.id) await entities.StudentFeeReport.update(record.id, payload);
    else await entities.StudentFeeReport.create(payload);
    setSaving(false);
    onSaved();
  };

  const numInp = (k, placeholder = "0") => (
    <Input
      type="number"
      value={form[k] ?? ""}
      onChange={(e) => set(k, e.target.value)}
      placeholder={placeholder}
      className="h-8 text-sm"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">
            {record ? "Edit Student Fee Record" : "Add Student Fee Record"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1 — Student Info */}
          <div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-4">
              <p className="text-xs font-bold uppercase tracking-wide">
                Section 1 — Student Information
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="S.No">
                <Input
                  value={form.sno ?? ""}
                  onChange={(e) => set("sno", e.target.value)}
                  placeholder="Auto"
                  className="h-8 text-sm"
                />
              </Field>
              <Field label="Student ID" required>
                <div className="relative">
                  <Input
                    value={form.student_id || ""}
                    onChange={(e) => handleIdLookup(e.target.value)}
                    placeholder="STU-001"
                    className="h-8 text-sm"
                  />
                  {lookupLoading && (
                    <span className="absolute right-2 top-1.5 text-xs text-indigo-500">
                      Looking up...
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Student Name" required>
                <Input
                  value={form.student_name || ""}
                  onChange={(e) => set("student_name", e.target.value)}
                  className="h-8 text-sm"
                />
              </Field>
              <Field label="Father Name" required>
                <Input
                  value={form.father_name || ""}
                  onChange={(e) => set("father_name", e.target.value)}
                  className="h-8 text-sm"
                />
              </Field>
              <Field label="Mobile Number" required>
                <Input
                  value={form.mob_number || ""}
                  onChange={(e) =>
                    set(
                      "mob_number",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="10-digit mobile"
                  className="h-8 text-sm"
                />
              </Field>
              <Field label="Class" required>
                <Input
                  value={form.class || ""}
                  onChange={(e) => set("class", e.target.value)}
                  placeholder="e.g. 8A, 9B"
                  className="h-8 text-sm"
                />
              </Field>
              <Field label="Student Type" required>
                <Select
                  value={form.student_type || ""}
                  onValueChange={(v) => set("student_type", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Existing">Existing</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={form.status || "Active"}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {/* Section 2 — Admission Fee */}
          <div>
            <div className="bg-green-700 text-white px-4 py-2 rounded-lg mb-4">
              <p className="text-xs font-bold uppercase tracking-wide">
                Section 2 — Admission Fee
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Adm Gross Fee ₹" required>
                {numInp("adm_gross_fee")}
              </Field>
              <Field label="Adm Concession ₹">
                {numInp("adm_concession", "0")}
              </Field>
              <ReadOnlyField
                label="Net Adm Fee (Gross − Concession)"
                value={netAdmFee}
                color={netAdmFee < 0 ? "red" : "default"}
              />
              <Field label="Paid Adm Fee ₹" required>
                {numInp("paid_adm_fee")}
              </Field>
              <ReadOnlyField
                label="Balance Adm Fee (Net − Paid)"
                value={balanceAdmFee}
                color={balanceAdmFee > 0 ? "red" : "green"}
              />
            </div>
          </div>

          {/* Section 3 — Term Fee */}
          <div>
            <div className="bg-amber-700 text-white px-4 py-2 rounded-lg mb-4">
              <p className="text-xs font-bold uppercase tracking-wide">
                Section 3 — Term Fee 2026-27
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {form.student_type === "Existing" && (
                <Field label="Old Fee ₹">{numInp("old_fee")}</Field>
              )}
              <Field label="Gross Term Fee 26-27 ₹" required>
                {numInp("gross_term_fee")}
              </Field>
              <Field label="Term Concession ₹">
                {numInp("term_concession", "0")}
              </Field>
              <ReadOnlyField
                label="Net Term Fee (Old + Gross − Concession)"
                value={netTermFee}
                color={netTermFee < 0 ? "red" : "default"}
              />
              <Field label="Paid Term Fee ₹" required>
                {numInp("paid_term_fee")}
              </Field>
              <ReadOnlyField
                label="Balance Fee (Net − Paid)"
                value={balanceTermFee}
                color={balanceTermFee > 0 ? "red" : "green"}
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Field label="Remarks (optional, max 100 chars)">
              <textarea
                value={form.remarks || ""}
                onChange={(e) => set("remarks", e.target.value.slice(0, 100))}
                rows={2}
                placeholder="e.g. T2 pending, Merit concession..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-xs text-slate-400 text-right mt-0.5">
                {(form.remarks || "").length}/100
              </p>
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[80px]"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
