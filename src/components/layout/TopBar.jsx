import React, { useState } from "react";
import { Menu, Bell, LogOut, Search } from "lucide-react";
import { entities } from "@/api/entityClient";
import GlobalSearch from "@/components/GlobalSearch";

export default function TopBar({ onMenuToggle, user }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    auth.logout("/");
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-800">
            The Masterminds School
          </h1>
          <p className="text-xs text-slate-400">
            Come let's explore and learn together...
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search ERP...</span>
          <kbd className="hidden sm:inline text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-600">
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
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
