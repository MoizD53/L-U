"use client";

import React, { useState, useEffect } from "react";
import { Lock, AlertTriangle, Check, AlertCircle, ArrowDownLeft, ArrowUpRight, PlusCircle } from "lucide-react";
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
      <div className="bg-[#101522] border border-amber-600/40 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Daily Accounting
              </span>
              <h3 className="text-lg font-black text-white">
                Close Today&apos;s Hisab ({shift.shift_date})
              </h3>
            </div>
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

        {/* Warning if running sessions exist */}
        {hasActiveSessions && (
          <div className="mx-4 mt-3 p-3 bg-amber-950/60 border border-amber-600/60 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Active Table Games Warning:</strong> {activeSessionsCount} table(s) are currently running games. It is recommended to end their games or carry them forward before locking the daily hisab.
            </div>
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Detailed Drawer Cash Reconciliation */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-4 space-y-2.5 text-xs">
            <div className="font-bold text-sm text-white pb-2 border-b border-zinc-800 flex items-center justify-between">
              <span>Physical Cash Drawer Breakdown:</span>
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${isAlreadyClosed ? "bg-red-950 text-red-400 border border-red-800/40" : "bg-emerald-950 text-emerald-400 border border-emerald-800/40"}`}>
                {shift.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span>1. Opening Cash Float (Opening Rokad):</span>
              <span className="font-mono font-semibold">{formatRupees(shift.opening_cash_paise)}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-300">
              <span>2. Table Cash Collections:</span>
              <span className="font-mono font-semibold">+{formatRupees(shift.table_cash_collected_paise)}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-300">
              <span>3. Counter Shop Cash Collections:</span>
              <span className="font-mono font-semibold">+{formatRupees(shift.shop_cash_collected_paise)}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-300">
              <span>4. Cash Received for Old Udhaar:</span>
              <span className="font-mono font-semibold">+{formatRupees(shift.udhaar_cash_collected_paise)}</span>
            </div>

            {shift.cash_added_paise > 0 && (
              <div className="flex items-center justify-between text-emerald-400">
                <span>5. Cash Added to Drawer:</span>
                <span className="font-mono font-semibold">+{formatRupees(shift.cash_added_paise)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-rose-300">
              <span>6. Cash Expenses Paid from Drawer:</span>
              <span className="font-mono font-semibold">-{formatRupees(shift.cash_expenses_paid_from_drawer_paise)}</span>
            </div>

            {shift.cash_withdrawn_paise > 0 && (
              <div className="flex items-center justify-between text-rose-400">
                <span>7. Cash Withdrawn / Taken by Owner:</span>
                <span className="font-mono font-semibold">-{formatRupees(shift.cash_withdrawn_paise)}</span>
              </div>
            )}

            {/* Expected Closing Cash */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-bold bg-zinc-800/40 p-2 rounded-lg">
              <span className="text-white">Expected Closing Cash in Drawer:</span>
              <span className="text-amber-400 font-mono text-base font-black">
                {formatRupees(shift.expected_closing_cash_paise)}
              </span>
            </div>
          </div>

          {/* Non-Cash Information Banner (UPI & Unpaid Udhaar) */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl">
              <span className="text-blue-300 block font-semibold mb-0.5">UPI Collections:</span>
              <span className="text-base font-bold text-white font-mono">
                {formatRupees(shift.total_upi_collected_paise)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">In bank (not in drawer)</span>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
              <span className="text-amber-300 block font-semibold mb-0.5">New Udhaar Given:</span>
              <span className="text-base font-bold text-white font-mono">
                {formatRupees(shift.total_credit_given_paise)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">Unpaid customer debt</span>
            </div>
          </div>

          {/* Cash In/Out Movement Action */}
          {!isAlreadyClosed && (
            <div>
              {!showMovementForm ? (
                <button
                  type="button"
                  onClick={() => setShowMovementForm(true)}
                  className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Record Cash Drawer In / Out (Withdrawal or Float Injection)</span>
                </button>
              ) : (
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Record Drawer Cash Movement</span>
                    <button
                      type="button"
                      onClick={() => setShowMovementForm(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType("WITHDRAWAL")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 ${
                        movementType === "WITHDRAWAL"
                          ? "bg-rose-600 text-white border-rose-500"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Cash Withdrawal
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType("ADDITION")}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1 ${
                        movementType === "ADDITION"
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Cash In / Addition
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={movementRupees}
                      onChange={(e) => setMovementRupees(e.target.value)}
                      className="px-3 py-1.5 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Reason (e.g. Owner bank deposit)"
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="px-3 py-1.5 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRecordMovement}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
                  >
                    Save Movement
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actual Cash Counted Form */}
          <form onSubmit={handleCloseShift} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-white mb-1.5">
                Physical Cash Counted in Drawer (Rokad Tally):
              </label>
              <input
                type="number"
                min="0"
                step="1"
                disabled={isAlreadyClosed}
                value={actualCountedRupees}
                onChange={(e) => setActualCountedRupees(e.target.value)}
                className="w-full px-4 py-3 bg-[#090d14] border border-zinc-800 focus:border-amber-500 rounded-xl text-xl font-mono font-black text-amber-300 outline-none"
                required
              />
            </div>

            {/* Difference indicator */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              differencePaise === 0
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : differencePaise > 0
                ? "bg-blue-950/30 border-blue-500/40 text-blue-300"
                : "bg-rose-950/40 border-rose-500/50 text-rose-300"
            }`}>
              <span>Drawer Discrepancy (Farak):</span>
              <span className="font-mono text-sm">
                {differencePaise === 0
                  ? "₹0 (Perfect Match!)"
                  : `${differencePaise > 0 ? "+" : ""}${formatRupees(differencePaise)} (${differencePaise > 0 ? "Surplus" : "Shortage"})`}
              </span>
            </div>

            {/* Closing note */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                Closing Remarks {hasDiscrepancy && <span className="text-red-400">* (Reason required for discrepancy)</span>}
              </label>
              <input
                type="text"
                disabled={isAlreadyClosed}
                placeholder="e.g. Verified by Moiz, ₹2000 float left in drawer"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-amber-500 rounded-xl text-sm text-white placeholder-zinc-500 outline-none"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold text-sm"
              >
                Cancel
              </button>
              {!isAlreadyClosed ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Lock &amp; Close Today&apos;s Hisab</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-2/3 py-3 px-4 bg-zinc-800 text-zinc-400 rounded-xl text-xs font-bold text-center">
                  Hisab Already Closed &amp; Locked
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
