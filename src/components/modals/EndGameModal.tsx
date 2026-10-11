"use client";

import React, { useState, useEffect } from "react";
import { Clock, DollarSign, Smartphone, Layers, AlertCircle, Check, User } from "lucide-react";
import { formatRupees, rupeesToPaise } from "@/lib/utils/money";
import { formatDurationMinutes, calculateElapsedMinutes } from "@/lib/utils/date";
import type { GameSessionItem, PaymentMethod, CustomerItem } from "@/lib/types";

interface Props {
  session: GameSessionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EndGameModal({ session, isOpen, onClose, onSuccess }: Props) {
  const [discountRupees, setDiscountRupees] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [splitCashRupees, setSplitCashRupees] = useState<string>("");
  const [splitUpiRupees, setSplitUpiRupees] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && session) {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setCustomers(res.data);
        })
        .catch(() => {});
      setDiscountRupees("0");
      setPaymentMethod("CASH");
      setSplitCashRupees("");
      setSplitUpiRupees("");
      setSelectedCustomerId(session.customer_id || "");
      setNotes("");
      setError(null);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  // Calculate duration and charges
  const durationMinutes = calculateElapsedMinutes(session.start_time);
  const hourlyRatePaise = session.snapshot_hourly_rate_paise;
  const minChargePaise = session.snapshot_minimum_charge_paise;

  // Rough preview (server calculates exact on submission)
  let rawTableCharge = (durationMinutes / 60) * hourlyRatePaise;
  let tableChargePaise = Math.ceil(rawTableCharge / 100) * 100;
  if (durationMinutes > 0 && tableChargePaise < minChargePaise) {
    tableChargePaise = minChargePaise;
  }

  const itemsChargePaise = session.items_charge_paise || 0;
  const subtotalPaise = tableChargePaise + itemsChargePaise;
  const discountPaise = rupeesToPaise(discountRupees || 0);
  const finalAmountPaise = Math.max(0, subtotalPaise - discountPaise);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const splitCashPaise = rupeesToPaise(splitCashRupees || 0);
      const splitUpiPaise = rupeesToPaise(splitUpiRupees || 0);

      // Validation
      if (paymentMethod === "SPLIT") {
        if (splitCashPaise + splitUpiPaise !== finalAmountPaise) {
          throw new Error(
            `Split amounts (Cash: ${formatRupees(splitCashPaise)} + UPI: ${formatRupees(splitUpiPaise)}) must equal the final bill total of ${formatRupees(finalAmountPaise)}`
          );
        }
      }

      if (paymentMethod === "CREDIT" && !selectedCustomerId) {
        throw new Error("Customer must be selected to record an unpaid Udhaar bill");
      }

      const res = await fetch("/api/tables/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          discountPaise,
          cashAmountPaise: paymentMethod === "SPLIT" ? splitCashPaise : undefined,
          upiAmountPaise: paymentMethod === "SPLIT" ? splitUpiPaise : undefined,
          paymentMethod,
          customerId: selectedCustomerId || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to end session and checkout");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to finalize bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              End Game &amp; Finalize Bill
            </span>
            <h3 className="text-lg font-black text-white">
              {session.table_name || "Game Session"}
            </h3>
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
          <div className="mx-4 mt-3 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Bill Summary Card */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 text-zinc-300 text-xs">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Elapsed Duration:</span>
              </div>
              <div className="font-mono font-bold text-base text-white">
                {formatDurationMinutes(durationMinutes)} ({durationMinutes} mins)
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Table Charge ({formatRupees(hourlyRatePaise)}/hr):</span>
                <span className="font-semibold text-white">{formatRupees(tableChargePaise)}</span>
              </div>

              {itemsChargePaise > 0 && (
                <div className="flex items-center justify-between text-amber-300">
                  <span>Add-on Products (Drinks, Snacks):</span>
                  <span className="font-semibold">{formatRupees(itemsChargePaise)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800 font-semibold">
                <span>Subtotal:</span>
                <span className="text-white">{formatRupees(subtotalPaise)}</span>
              </div>
            </div>

            {/* Discount Input */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <label className="text-xs font-semibold text-zinc-400 shrink-0">
                Discount (₹):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={discountRupees}
                onChange={(e) => setDiscountRupees(e.target.value)}
                className="w-28 px-3 py-1.5 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-lg text-sm text-right font-bold text-emerald-400 outline-none"
              />
            </div>

            {/* Final Total Amount Banner */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-xl flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">
                Final Bill Amount:
              </span>
              <span className="text-2xl font-black text-white">
                {formatRupees(finalAmountPaise)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md font-bold"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === "UPI"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md font-bold"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-xs">UPI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("SPLIT");
                  const half = Math.floor(finalAmountPaise / 200);
                  setSplitCashRupees(String(half));
                  setSplitUpiRupees(String(Math.round(finalAmountPaise / 100) - half));
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === "SPLIT"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md font-bold"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-xs">Split</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT")}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === "CREDIT"
                    ? "bg-amber-600 text-white border-amber-500 shadow-md font-bold"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-xs">Udhaar</span>
              </button>
            </div>
          </div>

          {/* Split Amount Inputs if SPLIT selected */}
          {paymentMethod === "SPLIT" && (
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Cash Amount (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={splitCashRupees}
                  onChange={(e) => setSplitCashRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-lg text-sm font-bold text-white outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  UPI Amount (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={splitUpiRupees}
                  onChange={(e) => setSplitUpiRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-lg text-sm font-bold text-emerald-400 outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Customer Selection (Mandatory for Udhaar, optional otherwise) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Customer Account {paymentMethod === "CREDIT" && <span className="text-red-400">* (Required for Udhaar)</span>}
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className={`w-full px-3 py-2.5 bg-[#090d14] border rounded-xl text-sm text-white outline-none appearance-none ${
                  paymentMethod === "CREDIT" && !selectedCustomerId
                    ? "border-amber-500 ring-1 ring-amber-500/50"
                    : "border-zinc-800 focus:border-emerald-500"
                }`}
                required={paymentMethod === "CREDIT"}
              >
                <option value="">-- {paymentMethod === "CREDIT" ? "Select Registered Customer" : "Casual Walk-in Player"} --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""} {c.outstanding_credit_paise > 0 ? `[Current Udhaar: ${formatRupees(c.outstanding_credit_paise)}]` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay, settled full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none"
            />
          </div>

          {/* Submit and Clear Table */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Settle Bill &amp; Free Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
