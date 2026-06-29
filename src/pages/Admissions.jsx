import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import PageHeader from "@/components/ui/PageHeader";
import { Plus, Search, UserPlus } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

const EMPTY = {
  name: "",
  class: "",
  section: "",
  gender: "",
  phone: "",
  parent_name: "",
  parent_phone: "",
  address: "",
  admission_date: new Date().toISOString().split("T")[0],
  status: "Active",
};

export default function Admissions() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const data = await entities.Student.list("-admission_date");
    setStudents(data.filter((s) => s.admission_date));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSave = async () => {
    await entities.Student.create(form);
    setOpen(false);
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admissions"
        subtitle="Manage student admissions"
        breadcrumb={[{ label: "Admissions" }]}
        action={
          <Button
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Admission
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search admissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No admissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Parent</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Admission Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.class} {s.section}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.parent_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.admission_date}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>New Admission</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              ["name", "Student Name"],
              ["class", "Class"],
              ["section", "Section"],
              ["phone", "Phone"],
              ["parent_name", "Parent Name"],
              ["parent_phone", "Parent Phone"],
              ["address", "Address"],
            ].map(([f, l]) => (
              <div
                key={f}
                className={["name", "address"].includes(f) ? "col-span-2" : ""}
              >
                <Label className="text-xs mb-1 block">{l}</Label>
                <Input
                  value={form[f] || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f]: e.target.value }))
                  }
                  className="rounded-xl text-sm"
                />
              </div>
            ))}
            <div>
              <Label className="text-xs mb-1 block">Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
              >
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["Male", "Female", "Other"].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Admission Date</Label>
              <Input
                type="date"
                value={form.admission_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, admission_date: e.target.value }))
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
