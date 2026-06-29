import React from "react";
import { Menu, LogOut } from "lucide-react";
import { entities } from "@/api/entityClient";

export default function BPTopBar({ onMenuToggle, user }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-800">
            BrightPath School
          </h1>
          <p className="text-xs text-slate-400">Empowering Education</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-600">
            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-slate-700">
            {user?.full_name || user?.email || "User"}
          </p>
          <p className="text-[10px] text-slate-400 capitalize">
            {user?.role || "user"}
          </p>
        </div>
        <button
          onClick={() => auth.logout("/")}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
