import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Plus, Search, Pencil, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY = {
  title: "",
  amount: "",
  category: "Salary",
  date: new Date().toISOString().split("T")[0],
  paid_to: "",
  payment_method: "Cash",
  notes: "",
};

export default function Expenditure() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await entities.Expenditure.list("-date");
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const filtered = items.filter((i) =>
    i.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    const data = { ...form, amount: Number(form.amount) };
    if (editing) {
      await entities.Expenditure.update(editing, data);
    } else {
      await entities.Expenditure.create(data);
    }
    setOpen(false);
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Expenditure"
        subtitle="Track all school expenses"
        breadcrumb={[{ label: "Expenditure" }]}
        action={
          <Button
            onClick={() => {
              setForm(EMPTY);
              setEditing(null);
              setOpen(true);
            }}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Expenditure
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Expenditure"
          value={`₹${total.toLocaleString()}`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Salary"
          value={`₹${items
            .filter((i) => i.category === "Salary")
            .reduce((s, i) => s + Number(i.amount || 0), 0)
            .toLocaleString()}`}
          icon={TrendingDown}
          color="amber"
        />
        <StatCard
          title="Other Expenses"
          value={`₹${items
            .filter((i) => i.category !== "Salary")
            .reduce((s, i) => s + Number(i.amount || 0), 0)
            .toLocaleString()}`}
          icon={TrendingDown}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-sm"
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Paid To</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-rose-600 font-semibold">
                      ₹{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.date}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.paid_to || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.payment_method}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setForm(item);
                            setEditing(item.id);
                            setOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            await entities.Expenditure.delete(item.id);
                            load();
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Expenditure" : "Add Expenditure"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Amount (₹)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Salary",
                    "Utilities",
                    "Maintenance",
                    "Stationery",
                    "Other",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Payment Method</Label>
              <Select
                value={form.payment_method}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, payment_method: v }))
                }
              >
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Cash", "Bank Transfer", "Cheque", "Online"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Paid To</Label>
              <Input
                value={form.paid_to}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paid_to: e.target.value }))
                }
                className="rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
