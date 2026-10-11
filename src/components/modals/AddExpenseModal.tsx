"use client";

import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Info, DollarSign, Smartphone, X } from "lucide-react";
import { rupeesToPaise } from "@/lib/utils/money";
import type { ExpensePaidBy } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddExpenseModal({ isOpen, onClose, onSuccess }: Props) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [amountRupees, setAmountRupees] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [paidBy, setPaidBy] = useState<ExpensePaidBy>("BUSINESS_DRAWER");
  const [payee, setPayee] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/expenses")
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data.categories) {
            setCategories(res.data.categories);
            if (res.data.categories.length > 0) {
              setCategoryId(res.data.categories[0].id);
            }
          }
        })
        .catch(() => {});
      setTitle("");
      setAmountRupees("");
      setPaymentMethod("CASH");
      setPaidBy("BUSINESS_DRAWER");
      setPayee("");
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(amountRupees || 0);

    if (!title.trim()) {
      setError("Please enter an expense title");
      return;
    }

    if (amountPaise <= 0) {
      setError("Please enter an expense amount greater than ₹0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          amountPaise,
          paymentMethod,
          paidBy,
          payee: payee.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record expense");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-md w-full p-6 text-[#F0EBDD] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#222823]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Financial Disbursement Voucher
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
              Record Arena Outflow
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A6AAA3] hover:text-[#F0EBDD] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Expense Title / Voucher Description
            </label>
            <input
              type="text"
              placeholder="e.g. Electricity bill, Staff advance, Cue maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
              required
            />
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                Expense Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="₹"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-sm font-mono font-bold text-[#F0EBDD] outline-none"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "CASH"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-[#B69A62]" /> Physical Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "UPI"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#187653]" /> Bank / UPI
              </button>
            </div>
          </div>

          {/* Paid By (Accounting source) */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Funding Source (Ledger Account)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaidBy("BUSINESS_DRAWER")}
                className={`py-2 px-1 text-[11px] rounded border text-center font-medium transition-colors ${
                  paidBy === "BUSINESS_DRAWER"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                Drawer (Rokad)
              </button>
              <button
                type="button"
                onClick={() => setPaidBy("PERSONAL_FUNDS")}
                className={`py-2 px-1 text-[11px] rounded border text-center font-medium transition-colors ${
                  paidBy === "PERSONAL_FUNDS"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                Personal Funds
              </button>
              <button
                type="button"
                onClick={() => setPaidBy("BANK")}
                className={`py-2 px-1 text-[11px] rounded border text-center font-medium transition-colors ${
                  paidBy === "BANK"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                Arena Bank
              </button>
            </div>
            <div className="flex items-start gap-2 mt-2 text-[11px] text-[#A6AAA3] bg-[#0B0D0C] p-2.5 rounded border border-[#222823]">
              <Info className="w-3.5 h-3.5 text-[#B69A62] shrink-0 mt-0.5" />
              <span>
                {paidBy === "BUSINESS_DRAWER" && paymentMethod === "CASH"
                  ? "Deducted directly from drawer cash. Reduces expected physical closing rokad."
                  : paidBy === "PERSONAL_FUNDS"
                  ? "Disbursed from owner/manager personal funds. Counter drawer cash remains unchanged."
                  : "Paid directly from arena bank account via digital transfer."}
              </span>
            </div>
          </div>

          {/* Payee / Receiver */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1">
              Payee Recipient / Vendor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Staff name, Electricity Board, Vendor"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823] rounded font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2.5 px-4 bg-[#187653] hover:bg-[#1f8c63] disabled:opacity-40 text-[#F0EBDD] font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#B69A62]" />
                  <span>Record Disbursement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
