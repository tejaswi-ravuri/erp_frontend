import React from "react";
import { Menu, Bell, LogOut, GraduationCap } from "lucide-react";
import { authApi } from "../../api/authApi";
import { useDispatch } from "react-redux";
import { logout } from "@/store/authSlice";
import { useNavigate } from "react-router-dom";

export default function BPTopBar({ onMenuToggle, user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await authApi.logout();

    dispatch(logout());

    window.location.href = "/";
  };
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">
              MasterMinds ERP
            </h1>
            <p className="text-xs text-slate-400">by Dominare Group</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-emerald-600">
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
