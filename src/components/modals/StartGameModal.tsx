"use client";

import React, { useState, useEffect } from "react";
import { Play, User, Plus, Check, X } from "lucide-react";
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
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-md w-full p-6 text-[#F0EBDD] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#222823]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Initiate {table.type} Session
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">{table.name}</h3>
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
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4 pt-4">
          {/* Rate Summary Card */}
          <div className="p-3.5 bg-[#0B0D0C] rounded border border-[#222823] flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#A6AAA3]">Applicable Tariff</div>
              <div className="font-mono font-bold text-[#F0EBDD] text-sm mt-0.5">
                {formatRupees(table.hourly_rate_paise || (table.type === "POOL" ? 20000 : 35000))}/hr
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#A6AAA3]">Minimum Fee</div>
              <div className="font-mono font-semibold text-[#B69A62] text-sm mt-0.5">
                {formatRupees(table.minimum_charge_paise || (table.type === "POOL" ? 5000 : 10000))}
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3]">
                Assigned Player (Optional)
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="text-xs font-medium text-[#187653] hover:text-[#1f8c63] flex items-center gap-1 transition-colors"
              >
                {isCreatingNew ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{isCreatingNew ? "Select Existing" : "+ New Player"}</span>
              </button>
            </div>

            {isCreatingNew ? (
              <div className="space-y-2.5 p-3 bg-[#0B0D0C] rounded border border-[#222823]">
                <input
                  type="text"
                  placeholder="Player Full Name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
                />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none appearance-none"
                >
                  <option value="">-- Casual Walk-in Guest --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} {c.outstanding_credit_paise > 0 ? `— Udhaar: ${formatRupees(c.outstanding_credit_paise)}` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#A6AAA3]">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Session Notes
            </label>
            <input
              type="text"
              placeholder="e.g. 4 players, private challenge match"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              className="w-2/3 py-2.5 px-4 bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-[#F0EBDD]" />
                  <span>Commence Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
