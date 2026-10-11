"use client";

import React, { useState, useEffect } from "react";
import { Check, AlertCircle, DollarSign, Smartphone, Layers, X } from "lucide-react";
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
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-md w-full p-6 text-[#F0EBDD] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#222823]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Customer Ledger &amp; Repayment
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
              Collect Udhaar Settlement
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
          {/* Customer Dropdown */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Select Player Account
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none"
              required
            >
              <option value="">-- Choose Registered Player --</option>
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
            <div className="p-3.5 bg-[#0B0D0C] border border-[#222823] rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#B69A62] font-semibold block">
                  Outstanding Credit (Baki):
                </span>
                <div className="text-xl font-mono font-bold text-[#F0EBDD] mt-0.5">
                  {formatRupees(currentUdhaarPaise)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmountRupees(String(currentUdhaarPaise / 100))}
                className="text-xs px-3 py-1 bg-[#131714] hover:bg-[#1a201c] text-[#B69A62] border border-[#222823] rounded font-medium transition-colors"
              >
                Clear Entire Balance
              </button>
            </div>
          )}

          {/* Amount to Collect Input */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Repayment Amount Received (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 500"
              value={amountRupees}
              onChange={(e) => setAmountRupees(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-base font-mono font-bold text-[#F0EBDD] outline-none"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-2">
              Payment Method Received
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "CASH"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Cash
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
                <Smartphone className="w-3.5 h-3.5" /> UPI
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
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "SPLIT"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Split
              </button>
            </div>
          </div>

          {paymentMethod === "SPLIT" && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#0B0D0C] rounded border border-[#222823]">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Cash (₹):</label>
                <input
                  type="number"
                  value={splitCashRupees}
                  onChange={(e) => setSplitCashRupees(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-sm font-mono text-[#F0EBDD] outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">UPI (₹):</label>
                <input
                  type="number"
                  value={splitUpiRupees}
                  onChange={(e) => setSplitUpiRupees(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-sm font-mono text-[#F0EBDD] outline-none"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1">
              Audit Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared weekend pool balance"
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
              className="w-2/3 py-2.5 px-4 bg-[#187653] hover:bg-[#1f8c63] disabled:opacity-40 text-[#F0EBDD] font-medium text-xs rounded transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#B69A62]" />
                  <span>Confirm Settlement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
