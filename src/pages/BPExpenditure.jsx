import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { Plus } from "lucide-react";
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
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CATEGORIES = [
  "Salaries",
  "Utilities",
  "Maintenance",
  "Supplies",
  "Events",
  "Misc",
];
const CAT_COLORS = {
  Salaries: "#6366f1",
  Utilities: "#0ea5e9",
  Maintenance: "#f59e0b",
  Supplies: "#10b981",
  Events: "#ec4899",
  Misc: "#94a3b8",
};
const EMPTY = {
  category: "Salaries",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  paid_to: "",
  approved_by: "",
};

export default function BPExpenditure() {
  const [items, setItems] = useState([]);
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await entities.Expenditure.list("-date");
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    await entities.Expenditure.create({
      ...form,
      amount: Number(form.amount),
    });
    setShowForm(false);
    setForm(EMPTY);
    load();
  };

  const filtered =
    catFilter === "All" ? items : items.filter((i) => i.category === catFilter);

  // Category totals for pie chart
  const catTotals = CATEGORIES.map((cat) => ({
    name: cat,
    value: items
      .filter((i) => i.category === cat)
      .reduce((s, i) => s + (i.amount || 0), 0),
  })).filter((c) => c.value > 0);

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Expenditure</h2>
          <p className="text-sm text-slate-500">
            Total: ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Category Breakdown
          </h3>
          {catTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={catTotals}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {catTotals.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CAT_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No data</p>
          )}
          <div className="mt-2 space-y-1">
            {catTotals.map((c) => (
              <div key={c.name} className="flex justify-between text-xs">
                <span className="text-slate-600">{c.name}</span>
                <span className="font-medium text-slate-800">
                  ₹{c.value.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 space-y-3">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[
                      "Date",
                      "Category",
                      "Description",
                      "Amount",
                      "Paid To",
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
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Loading...
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filtered.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">
                          {item.date}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: CAT_COLORS[item.category] + "20",
                              color: CAT_COLORS[item.category],
                            }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.paid_to}
                        </td>
                      </tr>
                    ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        No entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expenditure</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Category
              </label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "Description", key: "description" },
              { label: "Amount (₹)", key: "amount", type: "number" },
              { label: "Date", key: "date", type: "date" },
              { label: "Paid To", key: "paid_to" },
              { label: "Approved By", key: "approved_by" },
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
