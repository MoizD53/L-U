"use client";

import React, { useState, useEffect } from "react";
import { Check, AlertCircle, Info, DollarSign, Smartphone } from "lucide-react";
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
      <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Cash Outflow
            </span>
            <h3 className="text-lg font-black text-white">Record Arena Expense</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Expense Title / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Electricity bill, Staff advance, Phenyl"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-rose-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none"
              required
            />
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-rose-500 rounded-xl text-xs text-white outline-none"
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="₹"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-rose-500 rounded-xl text-sm font-bold text-rose-400 outline-none"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "CASH"
                    ? "bg-rose-600 text-white border-rose-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                <DollarSign className="w-4 h-4" /> Physical Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "UPI"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                <Smartphone className="w-4 h-4" /> Bank / UPI
              </button>
            </div>
          </div>

          {/* Paid By (Accounting source) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Paid From (Source of Funds)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaidBy("BUSINESS_DRAWER")}
                className={`py-2 px-1 text-[11px] rounded-lg border text-center font-semibold ${
                  paidBy === "BUSINESS_DRAWER"
                    ? "bg-amber-600 text-white border-amber-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                Shop Drawer
              </button>
              <button
                type="button"
                onClick={() => setPaidBy("PERSONAL_FUNDS")}
                className={`py-2 px-1 text-[11px] rounded-lg border text-center font-semibold ${
                  paidBy === "PERSONAL_FUNDS"
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                Personal Funds
              </button>
              <button
                type="button"
                onClick={() => setPaidBy("BANK")}
                className={`py-2 px-1 text-[11px] rounded-lg border text-center font-semibold ${
                  paidBy === "BANK"
                    ? "bg-purple-600 text-white border-purple-500"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                Bank Account
              </button>
            </div>
            <div className="flex items-start gap-1.5 mt-2 text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {paidBy === "BUSINESS_DRAWER" && paymentMethod === "CASH"
                  ? "Takes cash from shop drawer and reduces expected closing cash."
                  : paidBy === "PERSONAL_FUNDS"
                  ? "Paid from owner/manager personal pocket. Drawer cash will NOT be reduced."
                  : "Paid directly from business bank account via online transfer."}
              </span>
            </div>
          </div>

          {/* Payee / Receiver */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Paid To (Payee Name / Supplier)
            </label>
            <input
              type="text"
              placeholder="e.g. Staff name, MGVCL, Landlord"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-rose-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 bg-zinc-800 text-zinc-300 rounded-xl font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
