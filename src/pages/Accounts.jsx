import React, { useState, useEffect } from "react";
import { entities } from "@/api/entityClient";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from "lucide-react";

export default function Accounts() {
  const [income, setIncome] = useState([]);
  const [expenditure, setExpenditure] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [inc, exp] = await Promise.all([
        entities.Income.list("-date", 10),
        entities.Expenditure.list("-date", 10),
      ]);
      setIncome(inc);
      setExpenditure(exp);
      setLoading(false);
    };
    load();
  }, []);

  const totalIncome = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalExp = expenditure.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = totalIncome - totalExp;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Accounts Overview"
        subtitle="Financial summary"
        breadcrumb={[{ label: "Accounts" }]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Income"
          value={`₹${totalIncome.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Expenditure"
          value={`₹${totalExp.toLocaleString()}`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Net Balance"
          value={`₹${balance.toLocaleString()}`}
          icon={Wallet}
          color={balance >= 0 ? "indigo" : "rose"}
        />
        <StatCard
          title="Transactions"
          value={income.length + expenditure.length}
          icon={ArrowLeftRight}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Recent Income
            </h3>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                Loading...
              </div>
            ) : (
              income.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.date} · {item.category}
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold text-sm">
                    +₹{Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Recent Expenditure
            </h3>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                Loading...
              </div>
            ) : (
              expenditure.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.date} · {item.category}
                    </p>
                  </div>
                  <span className="text-rose-600 font-semibold text-sm">
                    -₹{Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
