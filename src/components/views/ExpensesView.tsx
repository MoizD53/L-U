"use client";

import React, { useState, useEffect } from "react";
import { Plus, Receipt, DollarSign, Smartphone, Wallet, Building2, User, ArrowDownRight } from "lucide-react";
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
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222823] pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#B69A62]">
            Dahod Financial Outflows
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F0EBDD] tracking-tight mt-1">
            Expenses &amp; Disbursements
          </h1>
          <p className="text-xs text-[#A6AAA3] mt-1 max-w-xl">
            Maintain disciplined records of arena supplies, salaries, rent, maintenance, and counter cash withdrawals.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddExpense}
          className="py-2.5 px-4 bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] rounded-lg text-xs font-semibold tracking-wide transition-colors border border-[#187653]/60 shadow-sm flex items-center gap-2 self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 text-[#B69A62]" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Overview - Editorial 3-Column Ledger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A6AAA3] block mb-2">
            Total Filtered Outflow
          </span>
          <div className="text-2xl font-mono font-bold text-[#F0EBDD]">
            {formatRupees(totalExpensePaise)}
          </div>
          <span className="text-[11px] text-[#A6AAA3] mt-2 block font-mono">
            {expenses.length} disbursement record{expenses.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B69A62]/40" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B69A62] block">
              Deducted From Drawer Cash
            </span>
            <Wallet className="w-3.5 h-3.5 text-[#B69A62]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#F0EBDD]">
            {formatRupees(drawerCashExpensesPaise)}
          </div>
          <span className="text-[11px] text-[#A6AAA3] mt-2 block">
            Directly reduces closing physical drawer rokad
          </span>
        </div>

        <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A6AAA3] block">
              Disbursed Via UPI / Bank
            </span>
            <Smartphone className="w-3.5 h-3.5 text-[#187653]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#F0EBDD]">
            {formatRupees(upiExpensesPaise)}
          </div>
          <span className="text-[11px] text-[#A6AAA3] mt-2 block">
            Arena online bank settlements
          </span>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter("ALL")}
          className={`px-3.5 py-1.5 rounded text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
            categoryFilter === "ALL"
              ? "bg-[#187653] text-[#F0EBDD] font-semibold shadow-sm"
              : "bg-[#131714] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823]"
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-1.5 rounded text-xs font-medium tracking-wide transition-all whitespace-nowrap ${
              categoryFilter === cat.id
                ? "bg-[#187653] text-[#F0EBDD] font-semibold shadow-sm"
                : "bg-[#131714] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Expenses Ledger */}
      <div className="bg-[#131714] border border-[#222823] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222823] flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#A6AAA3] font-semibold">
          <span>Expense Details &amp; Voucher</span>
          <span>Amount Disbursed</span>
        </div>

        <div className="divide-y divide-[#222823]">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#A6AAA3]">
              Loading expense records...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#A6AAA3]">
              No expenses recorded under this category
            </div>
          ) : (
            expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 hover:bg-[#181d1a]/50 transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-[#F0EBDD]">{exp.title}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B0D0C] text-[#A6AAA3] font-medium border border-[#222823]">
                      {exp.category_name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A6AAA3]">
                    <span className="font-mono">
                      {formatDateIST(exp.expense_date)} &middot; {formatTimeIST(exp.expense_date)}
                    </span>
                    {exp.payee && (
                      <span>
                        Recipient: <strong className="text-[#F0EBDD] font-medium">{exp.payee}</strong>
                      </span>
                    )}
                  </div>

                  {exp.notes && (
                    <div className="text-[11px] text-[#A6AAA3]/80 italic">
                      &quot;{exp.notes}&quot;
                    </div>
                  )}

                  {/* Payment Source Badges */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B0D0C] text-[#A6AAA3] border border-[#222823]">
                      {exp.payment_method === "CASH" ? (
                        <DollarSign className="w-2.5 h-2.5 text-[#B69A62]" />
                      ) : (
                        <Smartphone className="w-2.5 h-2.5 text-[#187653]" />
                      )}
                      <span>{exp.payment_method}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-[#0B0D0C] text-[#A6AAA3] border border-[#222823]">
                      {exp.paid_by === "BUSINESS_DRAWER" ? (
                        <>
                          <Wallet className="w-2.5 h-2.5 text-[#B69A62]" />
                          <span className="text-[#B69A62]">Drawer Cash (Rokad)</span>
                        </>
                      ) : exp.paid_by === "PERSONAL_FUNDS" ? (
                        <>
                          <User className="w-2.5 h-2.5 text-[#187653]" />
                          <span>Owner Personal Funds</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-2.5 h-2.5 text-[#187653]" />
                          <span>Arena Bank Account</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm sm:text-base text-[#F0EBDD] flex items-center justify-end gap-0.5">
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#A6AAA3]" />
                    <span>{formatRupees(exp.amount_paise)}</span>
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
