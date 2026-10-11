"use client";

import React, { useState, useEffect } from "react";
import { Check, AlertCircle, DollarSign, Smartphone, Layers } from "lucide-react";
import { formatRupees, rupeesToPaise } from "@/lib/utils/money";
import type { CustomerItem, PaymentMethod } from "@/lib/types";

interface Props {
  preselectedCustomer?: CustomerItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectUdhaarModal({ preselectedCustomer, isOpen, onClose, onSuccess }: Props) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [amountRupees, setAmountRupees] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [splitCashRupees, setSplitCashRupees] = useState<string>("");
  const [splitUpiRupees, setSplitUpiRupees] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setCustomers(res.data);
            if (preselectedCustomer) {
              setSelectedCustomerId(preselectedCustomer.id);
              setAmountRupees(String(preselectedCustomer.outstanding_credit_paise / 100));
            } else {
              // Preselect first customer with udhaar if any
              const debtor = res.data.find((c: CustomerItem) => c.outstanding_credit_paise > 0);
              if (debtor) {
                setSelectedCustomerId(debtor.id);
                setAmountRupees(String(debtor.outstanding_credit_paise / 100));
              }
            }
          }
        })
        .catch(() => {});
      setPaymentMethod("CASH");
      setSplitCashRupees("");
      setSplitUpiRupees("");
      setNotes("");
      setError(null);
    }
  }, [isOpen, preselectedCustomer]);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentUdhaarPaise = currentCustomer ? currentCustomer.outstanding_credit_paise : 0;

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((item) => item.id === id);
    if (c) {
      setAmountRupees(String(c.outstanding_credit_paise / 100));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError("Please select a customer");
      return;
    }

    const amountPaise = rupeesToPaise(amountRupees || 0);
    if (amountPaise <= 0) {
      setError("Please enter a valid repayment amount greater than ₹0");
      return;
    }

    if (amountPaise > currentUdhaarPaise) {
      setError(`Repayment cannot exceed outstanding balance of ${formatRupees(currentUdhaarPaise)}`);
      return;
    }

    const splitCashPaise = rupeesToPaise(splitCashRupees || 0);
    const splitUpiPaise = rupeesToPaise(splitUpiRupees || 0);

    if (paymentMethod === "SPLIT" && splitCashPaise + splitUpiPaise !== amountPaise) {
      setError(`Split Cash (${formatRupees(splitCashPaise)}) + UPI (${formatRupees(splitUpiPaise)}) must equal ${formatRupees(amountPaise)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customers/collect-udhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          amountPaise,
          paymentMethod,
          cashAmountPaise: paymentMethod === "SPLIT" ? splitCashPaise : undefined,
          upiAmountPaise: paymentMethod === "SPLIT" ? splitUpiPaise : undefined,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to collect udhaar");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to collect repayment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Customer Ledger
            </span>
            <h3 className="text-lg font-black text-white">Collect Udhaar Repayment</h3>
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
          {/* Customer Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Select Debtor Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#090d14] border border-zinc-800 focus:border-amber-500 rounded-xl text-sm text-white outline-none"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers
                .filter((c) => c.outstanding_credit_paise > 0)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ""} &bull; Balance: {formatRupees(c.outstanding_credit_paise)}
                  </option>
                ))}
            </select>
          </div>

          {/* Current Outstanding Banner */}
          {currentCustomer && (
            <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-300 font-semibold">Total Outstanding (Baki):</span>
                <div className="text-xl font-black text-white">
                  {formatRupees(currentUdhaarPaise)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmountRupees(String(currentUdhaarPaise / 100))}
                className="text-xs px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold"
              >
                Pay Full
              </button>
            </div>
          )}

          {/* Amount to Collect Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Amount Received Now (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 500"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full px-4 py-3 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-lg font-bold text-emerald-400 outline-none"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Payment Method Received
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                <DollarSign className="w-4 h-4" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "UPI"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                <Smartphone className="w-4 h-4" /> UPI
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("SPLIT");
                  const total = parseFloat(amountRupees || "0");
                  const half = Math.floor(total / 2);
                  setSplitCashRupees(String(half));
                  setSplitUpiRupees(String(total - half));
                }}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "SPLIT"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}
              >
                <Layers className="w-4 h-4" /> Split
              </button>
            </div>
          </div>

          {paymentMethod === "SPLIT" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Cash (₹):</label>
                <input
                  type="number"
                  value={splitCashRupees}
                  onChange={(e) => setSplitCashRupees(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#090d14] border border-zinc-800 rounded-lg text-sm text-white outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">UPI (₹):</label>
                <input
                  type="number"
                  value={splitUpiRupees}
                  onChange={(e) => setSplitUpiRupees(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#090d14] border border-zinc-800 rounded-lg text-sm text-white outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared weekend pool balance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
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
              className="w-2/3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Repayment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
