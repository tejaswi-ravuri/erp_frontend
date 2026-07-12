import React, { useState, useEffect } from "react";
import { incomeApi } from "@/api/api";
import { toast } from "sonner";
import { Plus, TrendingUp } from "lucide-react";
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

// This page is for generic school income NOT tied to a specific student
// (donations, rental income, misc receipts) - see models/Income.js.
// Student fee collection is a separate page/flow (FeePayment model).
// Matches Income.category exactly (see models/Income.js) - your real
// income ledger chart of accounts, not the old 4-value placeholder.
const CATEGORIES = [
  "Application Fee",
  "Admission Fee",
  "Term Fee",
  "Transport Fee",
  "Text Books",
  "Regular Uniform",
  "Sport Uniform",
  "Study and IIT Materials",
  "Ties",
  "Belts",
  "ID Cards",
  "Students Diaries",
  "Magazines",
  "Note Books",
  "Stationary Kits",
  "Abacus and Vedic Maths",
  "SSC Exam Fee",
  "Picnic and Tours",
  "Loans From Out Sides",
  "TC and Bonafide",
  "Other Income",
  "Cash Withdrawal",
];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Online"];
const today = new Date().toISOString().split("T")[0];

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "Other Income",
  date: today,
  received_from: "",
  payment_method: "Cash",
  notes: "",
};

const apiErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong";

export default function BPIncome() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const load = () => {
    setLoading(true);
    incomeApi
      .list({ sort: "-date" })
      .then(setRecords)
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.title || !form.amount || !form.date) {
      toast.error("Title, Amount, and Date are required.");
      return;
    }
    setSaving(true);
    try {
      await incomeApi.create({ ...form, amount: parseFloat(form.amount) });
      toast.success("Income recorded successfully.");
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered =
    categoryFilter === "All"
      ? records
      : records.filter((r) => r.category === categoryFilter);
  const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Income</h2>
          <p className="text-sm text-slate-500">
            General school income - not tied to a specific student
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Income
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-500 font-medium">
              Total Income
            </span>
          </div>
          <p className="text-xl font-bold text-emerald-600">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64 overflow-y-auto">
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
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
                  "Date",
                  "Title",
                  "Category",
                  "Received From",
                  "Method",
                  "Amount",
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    No income recorded yet.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {r.date
                        ? new Date(r.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        {r.category || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.received_from || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.payment_method || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      ₹{Number(r.amount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Title *
              </label>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Annual Day Sponsorship"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Amount (₹) *
              </label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Date *
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Category
              </label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Payment Method
              </label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => set("payment_method", v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Received From
              </label>
              <Input
                value={form.received_from}
                onChange={(e) => set("received_from", e.target.value)}
                placeholder="Donor / source name"
                className="text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? "Saving..." : "Save Income"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
