"use client";

import React, { useState, useEffect } from "react";
import { Play, User, Plus, Check } from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import type { TableItem, CustomerItem } from "@/lib/types";

interface Props {
  table: TableItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StartGameModal({ table, isOpen, onClose, onSuccess }: Props) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setCustomers(res.data);
        })
        .catch(() => {});
      setSelectedCustomerId("");
      setIsCreatingNew(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalCustId: string | null = selectedCustomerId || null;

      // If user typed a new customer
      if (isCreatingNew && newCustomerName.trim().length > 0) {
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || null,
          }),
        });
        const custData = await custRes.json();
        if (!custRes.ok) {
          throw new Error(custData.error || "Failed to register new customer");
        }
        finalCustId = custData.data.id;
      }

      const res = await fetch("/api/tables/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          customerId: finalCustId,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start table session");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start game");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Start {table.type} Session
            </span>
            <h3 className="text-lg font-black text-white">{table.name}</h3>
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
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4 pt-4">
          {/* Rate Summary Card */}
          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <div className="text-zinc-400">Applicable Rate:</div>
              <div className="font-bold text-white text-sm">
                {formatRupees(table.hourly_rate_paise || (table.type === "POOL" ? 20000 : 35000))}/hr
              </div>
            </div>
            <div className="text-right">
              <div className="text-zinc-400">Minimum Charge:</div>
              <div className="font-semibold text-emerald-400">
                {formatRupees(table.minimum_charge_paise || (table.type === "POOL" ? 5000 : 10000))}
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Customer (Optional for casual games)
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {isCreatingNew ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{isCreatingNew ? "Select Existing" : "+ New Customer"}</span>
              </button>
            </div>

            {isCreatingNew ? (
              <div className="space-y-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <input
                  type="text"
                  placeholder="Customer Name (e.g. Mohit Patel)"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (Optional)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-lg text-sm text-white placeholder-zinc-500 outline-none"
                />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white outline-none appearance-none"
                >
                  <option value="">-- Casual Walk-in Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} {c.outstanding_credit_paise > 0 ? `— Udhaar: ${formatRupees(c.outstanding_credit_paise)}` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Tournament practice, 4 players"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Table Game</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
