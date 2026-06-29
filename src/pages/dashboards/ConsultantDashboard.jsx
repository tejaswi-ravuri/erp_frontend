import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import { useRole } from "@/lib/RoleContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

const BRANCHES = [
  "Hyderabad",
  "Secunderabad",
  "Kukatpally",
  "Miyapur",
  "Ameerpet",
  "Dilsukhnagar",
  "LB Nagar",
  "Mehdipatnam",
  "Malakpet",
  "Uppal",
  "Nacharam",
  "Malkajgiri",
  "Habsiguda",
  "Tarnaka",
  "Sainikpuri",
  "Alwal",
  "Kompally",
  "Medchal",
  "Nizamabad",
  "Karimnagar",
  "Warangal",
  "Khammam",
  "Nalgonda",
  "Mahbubnagar",
  "Ramagundam",
  "Adilabad",
  "Suryapet",
  "Siddipet",
  "Jagtial",
  "Mancherial",
  "Visakhapatnam",
  "Vijayawada",
  "Guntur",
  "Nellore",
  "Kurnool",
  "Tirupati",
  "Kakinada",
  "Rajamahendravaram",
  "Eluru",
  "Ongole",
  "Anantapur",
  "Kadapa",
  "Srikakulam",
  "Vizianagaram",
  "Bhimavaram",
  "Tanuku",
  "Narasaraopet",
  "Pune",
  "Nashik",
  "Nagpur",
  "Aurangabad",
  "Solapur",
  "Kolhapur",
  "Bengaluru North",
  "Bengaluru South",
  "Mysuru",
  "Hubli",
  "Mangaluru",
  "Belagavi",
  "Tumkur",
  "Davanagere",
  "Ballari",
  "Shivamogga",
  "Madurai",
  "Coimbatore",
  "Trichy",
  "Salem",
  "Tirunelveli",
  "Chennai North",
  "Chennai South",
  "Vellore",
  "Erode",
  "Tiruppur",
];

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

// Generate mock per-branch data
const generateBranchData = (branch) => {
  const seed = branch.charCodeAt(0) + branch.length;
  const students = 150 + (seed % 200);
  const feeCollected = students * 18000 + seed * 500;
  const pending = feeCollected * (0.1 + (seed % 20) / 100);
  const staff = 12 + (seed % 18);
  const performance = 60 + (seed % 35);
  return { students, feeCollected, pending, staff, performance };
};

export default function ConsultantDashboard() {
  const { activeBranch, selectBranch } = useRole();
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchData, setBranchData] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);

  useEffect(() => {
    // Global stats across all branches
    const totals = BRANCHES.reduce(
      (acc, b) => {
        const d = generateBranchData(b);
        acc.students += d.students;
        acc.feeCollected += d.feeCollected;
        acc.pending += d.pending;
        acc.staff += d.staff;
        return acc;
      },
      { students: 0, feeCollected: 0, pending: 0, staff: 0 },
    );
    setGlobalStats(totals);
  }, []);

  useEffect(() => {
    setBranchData(generateBranchData(activeBranch));
  }, [activeBranch]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const topBranches = BRANCHES.slice(0, 8).map((b) => {
    const d = generateBranchData(b);
    return {
      name: b.length > 10 ? b.slice(0, 10) + "…" : b,
      students: d.students,
      fee: Math.round(d.feeCollected / 1000),
    };
  });

  const pieData = [
    {
      name: "Collected",
      value: branchData
        ? Math.round(branchData.feeCollected - branchData.pending)
        : 0,
    },
    { name: "Pending", value: branchData ? Math.round(branchData.pending) : 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Branch Switcher */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            Account Consultant
          </h1>
          <p className="text-sm text-slate-500">
            Viewing:{" "}
            <span className="font-semibold text-indigo-600">
              {activeBranch}
            </span>{" "}
            branch · {BRANCHES.length} total branches
          </p>
        </div>
        {/* Branch Switcher */}
        <div className="relative">
          <button
            onClick={() => setBranchOpen(!branchOpen)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow"
          >
            <MapPin className="w-4 h-4" />
            {activeBranch}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${branchOpen ? "rotate-180" : ""}`}
            />
          </button>
          {branchOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl w-64 max-h-72 overflow-y-auto">
              <div className="p-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  All Branches ({BRANCHES.length})
                </p>
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      selectBranch(b);
                      setBranchOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeBranch === b ? "bg-indigo-600 text-white font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Students (All Branches)",
            value: globalStats
              ? globalStats.students.toLocaleString("en-IN")
              : "...",
            icon: Users,
            color: "bg-indigo-500",
          },
          {
            label: "Total Fee Collected",
            value: globalStats ? fmt(globalStats.feeCollected) : "...",
            icon: DollarSign,
            color: "bg-emerald-500",
          },
          {
            label: "Pending Amount",
            value: globalStats ? fmt(globalStats.pending) : "...",
            icon: TrendingUp,
            color: "bg-amber-500",
          },
          {
            label: "Total Staff",
            value: globalStats
              ? globalStats.staff.toLocaleString("en-IN")
              : "...",
            icon: Users,
            color: "bg-violet-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-black text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Selected Branch Detail */}
      {branchData && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
          <p className="text-sm font-semibold text-indigo-200 mb-4">
            📍 {activeBranch} Branch — Detailed View
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Students", value: branchData.students },
              { label: "Staff", value: branchData.staff },
              {
                label: "Fee Collected",
                value: fmt(branchData.feeCollected - branchData.pending),
              },
              { label: "Pending", value: fmt(branchData.pending) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/10 rounded-xl p-4 text-center"
              >
                <p className="text-xl font-black">{value}</p>
                <p className="text-xs text-indigo-200 mt-1">{label}</p>
              </div>
            ))}
          </div>
          {/* Performance bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-indigo-200 mb-1.5">
              <span>Academic Performance</span>
              <span>{branchData.performance}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <div
                className="h-2 bg-white rounded-full transition-all"
                style={{ width: `${branchData.performance}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">
            Top 8 Branches — Student Enrollment
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topBranches} barSize={18}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="students" name="Students" radius={[4, 4, 0, 0]}>
                {topBranches.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-700 mb-4 self-start">
            Fee Collection Status
          </h3>
          <PieChart width={160} height={160}>
            <Pie
              data={pieData}
              cx={75}
              cy={75}
              innerRadius={45}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#10b981" : "#f59e0b"} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => fmt(v)} />
          </PieChart>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Collected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Pending
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
