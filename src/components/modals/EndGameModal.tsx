"use client";

import React, { useState, useEffect } from "react";
import { Clock, DollarSign, Smartphone, Layers, AlertCircle, Check, User, X } from "lucide-react";
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
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-lg w-full max-h-[92vh] flex flex-col text-[#F0EBDD] shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#222823] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Conclude Session &amp; Settle Invoice
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
              {session.table_name || "Game Session"}
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
          <div className="mx-5 mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded text-xs text-rose-300 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Bill Summary Statement */}
          <div className="bg-[#0B0D0C] rounded-lg border border-[#222823] p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
              <div className="flex items-center gap-2 text-[#A6AAA3] text-xs">
                <Clock className="w-3.5 h-3.5 text-[#187653]" />
                <span>Elapsed Play Duration:</span>
              </div>
              <div className="font-mono font-bold text-sm text-[#F0EBDD]">
                {formatDurationMinutes(durationMinutes)} ({durationMinutes} mins)
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2 text-xs text-[#A6AAA3]">
              <div className="flex items-center justify-between">
                <span>Table Play Charge ({formatRupees(hourlyRatePaise)}/hr):</span>
                <span className="font-mono font-medium text-[#F0EBDD]">{formatRupees(tableChargePaise)}</span>
              </div>

              {itemsChargePaise > 0 && (
                <div className="flex items-center justify-between text-[#B69A62]">
                  <span>Lounge Orders (Drinks, Snacks):</span>
                  <span className="font-mono font-medium">{formatRupees(itemsChargePaise)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[#222823] text-xs">
                <span className="text-[#A6AAA3]">Subtotal:</span>
                <span className="font-mono font-semibold text-[#F0EBDD]">{formatRupees(subtotalPaise)}</span>
              </div>
            </div>

            {/* Discount Input */}
            <div className="pt-2 flex items-center justify-between gap-4 border-t border-[#222823]/60">
              <label className="text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] shrink-0">
                Discretionary Discount (₹):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={discountRupees}
                onChange={(e) => setDiscountRupees(e.target.value)}
                className="w-28 px-3 py-1.5 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-sm text-right font-mono font-bold text-[#F0EBDD] outline-none"
              />
            </div>

            {/* Final Total Amount Banner */}
            <div className="p-3.5 bg-[#123B2C]/40 border border-[#187653]/40 rounded-lg flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-[0.2em] font-bold text-[#B69A62]">
                Final Due Amount:
              </span>
              <span className="text-2xl font-mono font-bold text-[#F0EBDD]">
                {formatRupees(finalAmountPaise)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-[0.2em] text-[#A6AAA3] font-semibold mb-2">
              Payment Settlement Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2.5 px-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${
                  paymentMethod === "CASH"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-xs">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2.5 px-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${
                  paymentMethod === "UPI"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
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
                className={`py-2.5 px-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${
                  paymentMethod === "SPLIT"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-xs">Split</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT")}
                className={`py-2.5 px-2 rounded border flex flex-col items-center justify-center gap-1 transition-colors ${
                  paymentMethod === "CREDIT"
                    ? "bg-[#B69A62] text-[#0B0D0C] border-[#B69A62] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Udhaar</span>
              </button>
            </div>
          </div>

          {/* Split Amount Inputs if SPLIT selected */}
          {paymentMethod === "SPLIT" && (
            <div className="p-3 bg-[#0B0D0C] rounded border border-[#222823] grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1">
                  Cash Intake (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={splitCashRupees}
                  onChange={(e) => setSplitCashRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-sm font-mono font-bold text-[#F0EBDD] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1">
                  UPI Intake (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={splitUpiRupees}
                  onChange={(e) => setSplitUpiRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-sm font-mono font-bold text-[#F0EBDD] outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Customer Selection (Mandatory for Udhaar, optional otherwise) */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Player Account {paymentMethod === "CREDIT" && <span className="text-rose-400">* (Required for Udhaar ledger)</span>}
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className={`w-full px-3 py-2.5 bg-[#0B0D0C] border rounded text-xs text-[#F0EBDD] outline-none appearance-none ${
                  paymentMethod === "CREDIT" && !selectedCustomerId
                    ? "border-[#B69A62] ring-1 ring-[#B69A62]/40"
                    : "border-[#222823] focus:border-[#187653]"
                }`}
                required={paymentMethod === "CREDIT"}
              >
                <option value="">-- {paymentMethod === "CREDIT" ? "Select Registered Player Account" : "Casual Walk-in Guest"} --</option>
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
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1">
              Audit Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay, settled in full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
            />
          </div>

          {/* Submit and Clear Table */}
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
              className="w-2/3 py-2.5 px-4 bg-[#187653] hover:bg-[#1f8c63] disabled:opacity-50 text-[#F0EBDD] font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#B69A62]" />
                  <span>Settle Bill &amp; Release Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
