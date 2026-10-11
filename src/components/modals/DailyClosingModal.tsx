"use client";

import React, { useState, useEffect } from "react";
import { Lock, AlertTriangle, Check, AlertCircle, ArrowDownLeft, ArrowUpRight, PlusCircle, X } from "lucide-react";
import { formatRupees, rupeesToPaise } from "@/lib/utils/money";
import type { ShiftItem } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DailyClosingModal({ isOpen, onClose, onSuccess }: Props) {
  const [shiftData, setShiftData] = useState<{
    shift: ShiftItem;
    hasActiveSessions: boolean;
    activeSessionsCount: number;
    cashMovements: any[];
  } | null>(null);

  const [actualCountedRupees, setActualCountedRupees] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementType, setMovementType] = useState<"ADDITION" | "WITHDRAWAL">("WITHDRAWAL");
  const [movementRupees, setMovementRupees] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShift = () => {
    fetch("/api/closing")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setShiftData(res.data);
          if (res.data.shift.status === "OPEN") {
            setActualCountedRupees(
              String(res.data.shift.expected_closing_cash_paise / 100)
            );
          } else {
            setActualCountedRupees(
              String(res.data.shift.actual_counted_cash_paise / 100)
            );
            setClosingNotes(res.data.shift.closing_notes || "");
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      fetchShift();
      setShowMovementForm(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !shiftData) return null;

  const { shift, hasActiveSessions, activeSessionsCount } = shiftData;
  const isAlreadyClosed = shift.status === "CLOSED";

  const countedPaise = rupeesToPaise(actualCountedRupees || 0);
  const differencePaise = countedPaise - shift.expected_closing_cash_paise;
  const hasDiscrepancy = Math.abs(differencePaise) > 10000; // > ₹100

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtPaise = rupeesToPaise(movementRupees || 0);
    if (amtPaise <= 0 || !movementReason.trim()) return;

    try {
      const res = await fetch("/api/closing/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          movementType,
          amountPaise: amtPaise,
          reason: movementReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMovementRupees("");
      setMovementReason("");
      setShowMovementForm(false);
      fetchShift();
    } catch (err: any) {
      setError(err.message || "Failed to record cash movement");
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDiscrepancy && (!closingNotes || closingNotes.trim().length === 0)) {
      setError("Please provide a note explaining the drawer difference of more than ₹100");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          actualCountedCashPaise: countedPaise,
          closingNotes: closingNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to close hisab");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to lock shift closing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-lg w-full max-h-[92vh] flex flex-col text-[#F0EBDD] shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#222823] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded bg-[#0B0D0C] border border-[#222823] flex items-center justify-center text-[#B69A62]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
                Daily Accounting &amp; Reconciliation
              </span>
              <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
                Close Today&apos;s Hisab ({shift.shift_date})
              </h3>
            </div>
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

        {/* Warning if running sessions exist */}
        {hasActiveSessions && (
          <div className="mx-5 mt-4 p-3.5 bg-[#0B0D0C] border border-[#B69A62]/40 rounded text-xs text-[#F0EBDD] flex items-start gap-3 shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#B69A62] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#B69A62] block mb-0.5">Active Table Sessions Underway</strong>
              <span className="text-[#A6AAA3]">
                {activeSessionsCount} arena table{activeSessionsCount === 1 ? " is" : "s are"} currently running live sessions. Consider concluding ongoing games before locking today&apos;s financial ledger.
              </span>
            </div>
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Detailed Drawer Cash Reconciliation */}
          <div className="bg-[#0B0D0C] rounded-lg border border-[#222823] p-4 space-y-2.5 text-xs">
            <div className="font-serif font-bold text-sm text-[#F0EBDD] pb-2 border-b border-[#222823] flex items-center justify-between">
              <span>Physical Cash Drawer Breakdown (Rokad):</span>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${isAlreadyClosed ? "bg-[#131714] text-rose-400 border border-[#222823]" : "bg-[#131714] text-[#187653] border border-[#222823]"}`}>
                {shift.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-[#A6AAA3]">
              <span>1. Opening Cash Float (Opening Rokad):</span>
              <span className="font-mono font-semibold text-[#F0EBDD]">{formatRupees(shift.opening_cash_paise)}</span>
            </div>

            <div className="flex items-center justify-between text-[#A6AAA3]">
              <span>2. Table Cash Collections:</span>
              <span className="font-mono font-semibold text-[#187653]">+{formatRupees(shift.table_cash_collected_paise)}</span>
            </div>

            <div className="flex items-center justify-between text-[#A6AAA3]">
              <span>3. Counter Shop Cash Collections:</span>
              <span className="font-mono font-semibold text-[#187653]">+{formatRupees(shift.shop_cash_collected_paise)}</span>
            </div>

            <div className="flex items-center justify-between text-[#A6AAA3]">
              <span>4. Cash Received for Old Udhaar:</span>
              <span className="font-mono font-semibold text-[#187653]">+{formatRupees(shift.udhaar_cash_collected_paise)}</span>
            </div>

            {shift.cash_added_paise > 0 && (
              <div className="flex items-center justify-between text-[#A6AAA3]">
                <span>5. Cash Added to Drawer:</span>
                <span className="font-mono font-semibold text-[#187653]">+{formatRupees(shift.cash_added_paise)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[#A6AAA3]">
              <span>6. Cash Expenses Paid from Drawer:</span>
              <span className="font-mono font-semibold text-rose-400">-{formatRupees(shift.cash_expenses_paid_from_drawer_paise)}</span>
            </div>

            {shift.cash_withdrawn_paise > 0 && (
              <div className="flex items-center justify-between text-[#A6AAA3]">
                <span>7. Cash Withdrawn / Taken by Owner:</span>
                <span className="font-mono font-semibold text-rose-400">-{formatRupees(shift.cash_withdrawn_paise)}</span>
              </div>
            )}

            {/* Expected Closing Cash */}
            <div className="pt-2 border-t border-[#222823] flex items-center justify-between text-xs bg-[#131714] p-2.5 rounded border border-[#222823]">
              <span className="font-semibold text-[#F0EBDD]">Expected Closing Cash in Drawer:</span>
              <span className="text-[#F0EBDD] font-mono text-base font-bold">
                {formatRupees(shift.expected_closing_cash_paise)}
              </span>
            </div>
          </div>

          {/* Non-Cash Information Banner (UPI & Unpaid Udhaar) */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#0B0D0C] border border-[#222823] rounded-lg">
              <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">UPI Collections</span>
              <span className="text-base font-bold text-[#F0EBDD] font-mono">
                {formatRupees(shift.total_upi_collected_paise)}
              </span>
              <span className="text-[10px] text-[#A6AAA3] block mt-1">Directly in bank account</span>
            </div>

            <div className="p-3 bg-[#0B0D0C] border border-[#222823] rounded-lg">
              <span className="text-[10px] uppercase tracking-wider text-[#B69A62] block mb-1">New Udhaar Extended</span>
              <span className="text-base font-bold text-[#F0EBDD] font-mono">
                {formatRupees(shift.total_credit_given_paise)}
              </span>
              <span className="text-[10px] text-[#A6AAA3] block mt-1">Pending player debt</span>
            </div>
          </div>

          {/* Cash In/Out Movement Action */}
          {!isAlreadyClosed && (
            <div>
              {!showMovementForm ? (
                <button
                  type="button"
                  onClick={() => setShowMovementForm(true)}
                  className="w-full py-2.5 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] border border-[#222823] rounded text-xs font-medium text-[#A6AAA3] hover:text-[#F0EBDD] flex items-center justify-center gap-2 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#B69A62]" />
                  <span>Record Cash Drawer Adjustment (Float Injection or Withdrawal)</span>
                </button>
              ) : (
                <div className="p-3.5 bg-[#0B0D0C] rounded-lg border border-[#222823] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-[#F0EBDD]">Record Drawer Movement</span>
                    <button
                      type="button"
                      onClick={() => setShowMovementForm(false)}
                      className="text-[#A6AAA3] hover:text-[#F0EBDD] text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType("WITHDRAWAL")}
                      className={`py-1.5 px-2 rounded text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                        movementType === "WITHDRAWAL"
                          ? "bg-[#131714] text-[#F0EBDD] border-rose-500 font-semibold"
                          : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823]"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Withdrawal
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType("ADDITION")}
                      className={`py-1.5 px-2 rounded text-xs font-medium border flex items-center justify-center gap-1 transition-colors ${
                        movementType === "ADDITION"
                          ? "bg-[#131714] text-[#F0EBDD] border-[#187653] font-semibold"
                          : "bg-[#0B0D0C] text-[#A6AAA3] border-[#222823]"
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-[#187653]" /> Cash Addition
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={movementRupees}
                      onChange={(e) => setMovementRupees(e.target.value)}
                      className="px-3 py-1.5 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Reason (e.g. Owner bank deposit)"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="px-3 py-1.5 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRecordMovement}
                    className="w-full py-2 bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] rounded text-xs font-medium transition-colors"
                  >
                    Save Movement
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actual Cash Counted Form */}
          <form onSubmit={handleCloseShift} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                Physical Cash Counted in Drawer (Actual Rokad):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isAlreadyClosed}
                value={actualCountedRupees}
                onChange={(e) => setActualCountedRupees(e.target.value)}
                className="w-full px-4 py-3 bg-[#0B0D0C] border border-[#222823] focus:border-[#B69A62] rounded-lg text-xl font-mono font-bold text-[#F0EBDD] outline-none"
                required
              />
            </div>

            {/* Difference indicator */}
            <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
              differencePaise === 0
                ? "bg-[#0B0D0C] border-[#187653]/60 text-[#187653]"
                : differencePaise > 0
                ? "bg-[#0B0D0C] border-[#187653]/40 text-[#F0EBDD]"
                : "bg-[#0B0D0C] border-rose-800/50 text-rose-400"
            }`}>
              <span>Reconciliation Discrepancy (Farak):</span>
              <span className="font-mono text-sm font-bold">
                {differencePaise === 0
                  ? "₹0 (Exact Match)"
                  : `${differencePaise > 0 ? "+" : ""}${formatRupees(differencePaise)} (${differencePaise > 0 ? "Surplus" : "Shortage"})`}
              </span>
            </div>

            {/* Closing note */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1">
                Audit Notes &amp; Explanations {hasDiscrepancy && <span className="text-rose-400">* (Required for discrepancy)</span>}
              </label>
              <input
                type="text"
                disabled={isAlreadyClosed}
                placeholder="e.g. Verified and counted by Moiz, float retained in register"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823] rounded font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              {!isAlreadyClosed ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 px-4 bg-[#B69A62] hover:bg-[#c2a76f] active:scale-[0.98] disabled:opacity-40 text-[#0B0D0C] font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#0B0D0C]/30 border-t-[#0B0D0C] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock &amp; Reconcile Daily Hisab</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-2/3 py-2.5 px-4 bg-[#0B0D0C] border border-[#222823] text-[#A6AAA3] rounded text-xs font-mono font-medium text-center">
                  Hisab Reconciled &amp; Locked
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
