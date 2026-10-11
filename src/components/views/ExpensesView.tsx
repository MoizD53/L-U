"use client";

import React, { useState, useEffect } from "react";
import { Plus, Receipt, DollarSign, Smartphone, Wallet, Building2, User } from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import { formatDateIST, formatTimeIST } from "@/lib/utils/date";
import type { ExpenseItem } from "@/lib/types";

interface Props {
  onAddExpense: () => void;
}

export function ExpensesView({ onAddExpense }: Props) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchExpenses = () => {
    fetch(`/api/expenses?categoryId=${encodeURIComponent(categoryFilter)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setExpenses(res.data.expenses);
          setCategories(res.data.categories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const totalExpensePaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);
  const drawerCashExpensesPaise = expenses
    .filter((e) => e.payment_method === "CASH" && e.paid_by === "BUSINESS_DRAWER")
    .reduce((sum, e) => sum + e.amount_paise, 0);
  const upiExpensesPaise = expenses
    .filter((e) => e.payment_method === "UPI")
    .reduce((sum, e) => sum + e.amount_paise, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Arena Expenses &amp; Outflows
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track salaries, advances, rent, electricity, equipment &amp; drawer cash outflows
          </p>
        </div>

        <button
          type="button"
          onClick={onAddExpense}
          className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#0f1420] border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 block mb-1">
            Total Filtered Expenses
          </span>
          <div className="text-2xl font-black text-white font-mono">
            {formatRupees(totalExpensePaise)}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            {expenses.length} expense record(s)
          </span>
        </div>

        <div className="p-4 bg-amber-950/20 border border-amber-600/40 rounded-2xl">
          <span className="text-xs font-semibold text-amber-300 block mb-1">
            Deducted from Drawer Cash
          </span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {formatRupees(drawerCashExpensesPaise)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Reduces expected closing rokad
          </span>
        </div>

        <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-2xl">
          <span className="text-xs font-semibold text-blue-300 block mb-1">
            Paid via UPI / Bank
          </span>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {formatRupees(upiExpensesPaise)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Paid from online bank account
          </span>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            categoryFilter === "ALL"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-[#0f1420] text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === cat.id
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-[#0f1420] text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Expenses Table / List */}
      <div className="bg-[#0f1420] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between font-bold text-xs text-zinc-400">
          <span>Expense Details</span>
          <span>Amount</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500">
              No expenses recorded for this category
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 hover:bg-zinc-900/40 transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{exp.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                      {exp.category_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>
                      {formatDateIST(exp.expense_date)}, {formatTimeIST(exp.expense_date)}
                    </span>
                    {exp.payee && <span>&bull; Paid to: <strong className="text-zinc-200">{exp.payee}</strong></span>}
                  </div>

                  {exp.notes && (
                    <div className="text-[11px] text-zinc-400 italic">
                      &quot;{exp.notes}&quot;
                    </div>
                  )}

                  {/* Payment Source Badges */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        exp.payment_method === "CASH"
                          ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                          : "bg-blue-950 text-blue-300 border border-blue-800/40"
                      }`}
                    >
                      {exp.payment_method === "CASH" ? <DollarSign className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                      <span>{exp.payment_method}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                        exp.paid_by === "BUSINESS_DRAWER"
                          ? "bg-zinc-800 text-amber-300 border-amber-600/30 font-semibold"
                          : exp.paid_by === "PERSONAL_FUNDS"
                          ? "bg-zinc-800 text-blue-300 border-blue-600/30 font-semibold"
                          : "bg-zinc-800 text-purple-300 border-purple-600/30 font-semibold"
                      }`}
                    >
                      {exp.paid_by === "BUSINESS_DRAWER" ? (
                        <>
                          <Wallet className="w-2.5 h-2.5" />
                          <span>Shop Drawer</span>
                        </>
                      ) : exp.paid_by === "PERSONAL_FUNDS" ? (
                        <>
                          <User className="w-2.5 h-2.5" />
                          <span>Personal Funds</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-2.5 h-2.5" />
                          <span>Bank</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-base text-rose-400">
                    -{formatRupees(exp.amount_paise)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
