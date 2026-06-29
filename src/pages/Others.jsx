import React from "react";
import PageHeader from "@/components/ui/PageHeader";
import { MoreHorizontal, BookMarked, ArrowLeftRight } from "lucide-react";

export default function Others() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Others"
        subtitle="Additional modules"
        breadcrumb={[{ label: "Others" }]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: "Cheque Book",
            desc: "Manage cheques issued and received",
            icon: BookMarked,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            title: "Transfer",
            desc: "Student transfer records",
            icon: ArrowLeftRight,
            color: "bg-sky-50 text-sky-600",
          },
          {
            title: "Settings",
            desc: "System configuration and preferences",
            icon: MoreHorizontal,
            color: "bg-slate-50 text-slate-600",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div
              className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
