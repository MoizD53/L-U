"use client";

import React, { useState, useEffect } from "react";
import {
  CircleDot,
  Trophy,
  ShoppingBag,
  Receipt,
  UserPlus,
  Coins,
  Lock,
  ArrowRight,
  Clock,
  Plus,
  Square,
  AlertTriangle,
} from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import { formatTimeIST, formatDurationMinutes, calculateElapsedMinutes } from "@/lib/utils/date";
import type { DashboardOverview, GameSessionItem, TableItem } from "@/lib/types";

interface Props {
  onNavigateTab: (tab: any) => void;
  onStartPoolGame: () => void;
  onStartSnookerGame: () => void;
  onCounterSale: () => void;
  onAddExpense: () => void;
  onAddCustomer: () => void;
  onCollectUdhaar: () => void;
  onCloseHisab: () => void;
  onAddItemsToSession: (session: GameSessionItem) => void;
  onEndSession: (session: GameSessionItem) => void;
}

export function HomeView({
  onNavigateTab,
  onStartPoolGame,
  onStartSnookerGame,
  onCounterSale,
  onAddExpense,
  onAddCustomer,
  onCollectUdhaar,
  onCloseHisab,
  onAddItemsToSession,
  onEndSession,
}: Props) {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setTicker] = useState(0);

  const fetchOverview = () => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 10000); // Poll fresh data every 10s
    return () => clearInterval(interval);
  }, []);

  // Live timer tick every second for active table timers
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Date Header & Shift Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Dahod Arena Register
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Today&apos;s Overview
          </h1>
          <p className="text-xs text-zinc-400">
            Business Date: <strong className="text-zinc-200">{data.date}</strong> &bull; Asia/Kolkata
          </p>
        </div>

        {/* Daily Closing Reminder Banner */}
        {data.isShiftOpen ? (
          <button
            type="button"
            onClick={onCloseHisab}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Shift Open &bull; Close Today&apos;s Hisab</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Today&apos;s Hisab Closed &amp; Locked</span>
          </div>
        )}
      </div>

      {/* Prominent Quick Actions Toolbar */}
      <div className="bg-[#0f1420] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/40">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Quick Actions (Fast Tap)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <button
            type="button"
            onClick={onStartPoolGame}
            className="flex flex-col items-center justify-center p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-500 rounded-xl text-center transition-all group active:scale-95"
          >
            <CircleDot className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Start Pool</span>
            <span className="text-[10px] text-emerald-400/80">3 Tables</span>
          </button>

          <button
            type="button"
            onClick={onStartSnookerGame}
            className="flex flex-col items-center justify-center p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-500 rounded-xl text-center transition-all group active:scale-95"
          >
            <Trophy className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Start Snooker</span>
            <span className="text-[10px] text-emerald-400/80">2 Tables</span>
          </button>

          <button
            type="button"
            onClick={onCounterSale}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-center transition-all group active:scale-95"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Counter Sale</span>
            <span className="text-[10px] text-zinc-400">Snacks &amp; Drinks</span>
          </button>

          <button
            type="button"
            onClick={onAddExpense}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-center transition-all group active:scale-95"
          >
            <Receipt className="w-5 h-5 text-rose-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Add Expense</span>
            <span className="text-[10px] text-zinc-400">Bills &amp; Salary</span>
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-center transition-all group active:scale-95"
          >
            <UserPlus className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Add Customer</span>
            <span className="text-[10px] text-zinc-400">New Player</span>
          </button>

          <button
            type="button"
            onClick={onCollectUdhaar}
            className="flex flex-col items-center justify-center p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-center transition-all group active:scale-95"
          >
            <Coins className="w-5 h-5 text-yellow-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Collect Udhaar</span>
            <span className="text-[10px] text-yellow-400/80">Player Debt</span>
          </button>

          <button
            type="button"
            onClick={onCloseHisab}
            className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-600/40 hover:border-amber-500 rounded-xl text-center transition-all group active:scale-95"
          >
            <Lock className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white">Close Hisab</span>
            <span className="text-[10px] text-amber-400/80">Daily Closing</span>
          </button>
        </div>
      </div>

      {/* Live Financial & KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Billed */}
        <div className="p-4 bg-[#0f1420] border border-zinc-800/80 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-zinc-400 mb-1">
            Today Billed Revenue
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatRupees(data.todayBilledPaise)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            Finalized table + shop bills
          </div>
        </div>

        {/* Total Collected */}
        <div className="p-4 bg-emerald-950/30 border border-emerald-600/40 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-bold text-emerald-400 mb-1">
            Total Collections
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {formatRupees(data.todayCollectedPaise)}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-2">
            Money received today
          </div>
        </div>

        {/* Cash Collected */}
        <div className="p-4 bg-[#0f1420] border border-zinc-800/80 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-zinc-400 mb-1">
            Cash Collected (Rokad)
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {formatRupees(data.cashCollectedPaise)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            Physical cash in drawer
          </div>
        </div>

        {/* UPI Collected */}
        <div className="p-4 bg-[#0f1420] border border-zinc-800/80 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-zinc-400 mb-1">
            UPI Collected
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {formatRupees(data.upiCollectedPaise)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            Online bank deposits
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 bg-[#0f1420] border border-zinc-800/80 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-rose-400 mb-1">
            Today&apos;s Expenses
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-300 font-mono">
            {formatRupees(data.todayExpensesPaise)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-2">
            Drawer cash out: {formatRupees(data.drawerCashExpensesPaise)}
          </div>
        </div>

        {/* Total Udhaar Baki */}
        <div className="p-4 bg-amber-950/30 border border-amber-600/40 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-bold text-amber-400 mb-1">
            Total Udhaar (Baki)
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {formatRupees(data.totalOutstandingCreditPaise)}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-2">
            Active customer credit
          </div>
        </div>
      </div>

      {/* Operational Table Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Pool Games Today</span>
            <span className="text-xl font-black text-white font-mono">{data.poolGamesPlayedToday}</span>
          </div>
          <CircleDot className="w-5 h-5 text-emerald-400 opacity-60" />
        </div>

        <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Snooker Games Today</span>
            <span className="text-xl font-black text-white font-mono">{data.snookerGamesPlayedToday}</span>
          </div>
          <Trophy className="w-5 h-5 text-emerald-400 opacity-60" />
        </div>

        <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Live Pool Tables</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {data.activePoolTables} <span className="text-xs text-zinc-500">/ 3</span>
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        </div>

        <div className="p-3.5 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Live Snooker Tables</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {data.activeSnookerTables} <span className="text-xs text-zinc-500">/ 2</span>
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* Currently Running Active Sessions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base font-bold text-white">
              Currently Running Games ({data.activeSessions.length})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab("pool")}
              className="text-emerald-400 hover:underline font-semibold"
            >
              Pool Tables &rarr;
            </button>
            <span className="text-zinc-600">&bull;</span>
            <button
              type="button"
              onClick={() => onNavigateTab("snooker")}
              className="text-emerald-400 hover:underline font-semibold"
            >
              Snooker Tables &rarr;
            </button>
          </div>
        </div>

        {data.activeSessions.length === 0 ? (
          <div className="p-8 bg-[#0f1420] border border-zinc-800/80 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">All Tables Currently Available</h3>
            <p className="text-xs text-zinc-400 mb-4">No active games running right now</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStartPoolGame}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Start Pool Game
              </button>
              <button
                type="button"
                onClick={onStartSnookerGame}
                className="py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold"
              >
                Start Snooker Game
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.activeSessions.map((session) => {
              const liveMins = calculateElapsedMinutes(session.start_time);
              return (
                <div
                  key={session.id}
                  className="p-4 bg-[#0f1420] border border-emerald-500/40 rounded-2xl flex flex-col justify-between shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {session.table_type} &bull; Live
                      </span>
                      <h3 className="font-bold text-base text-white">
                        {session.table_name || "Arena Table"}
                      </h3>
                      {session.customer_name ? (
                        <div className="text-xs text-zinc-300 font-medium mt-0.5">
                          Player: <strong className="text-white">{session.customer_name}</strong>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 mt-0.5">Casual Walk-in Player</div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400">Estimated Total:</div>
                      <div className="text-lg font-black text-white font-mono">
                        {formatRupees(session.final_amount_paise)}
                      </div>
                    </div>
                  </div>

                  {/* Live Timer Display */}
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-[10px] text-zinc-400">Started:</div>
                        <div className="text-xs font-bold text-white font-mono">
                          {formatTimeIST(session.start_time)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-zinc-400">Duration:</div>
                      <div className="text-base font-black text-emerald-300 font-mono">
                        {formatDurationMinutes(liveMins)}
                      </div>
                    </div>
                  </div>

                  {/* Add-ons line if present */}
                  {session.items && session.items.length > 0 && (
                    <div className="text-xs text-amber-300 flex items-center justify-between px-1">
                      <span>Add-on Products ({session.items.length}):</span>
                      <span className="font-bold">{formatRupees(session.items_charge_paise)}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onAddItemsToSession(session)}
                      className="py-2.5 px-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Add Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEndSession(session)}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Square className="w-3 h-3 fill-white" />
                      <span>End &amp; Bill</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Bottom Widgets: Recent Transactions & Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="bg-[#0f1420] border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-white text-sm">Recent Arena Bills</h3>
            <button
              type="button"
              onClick={() => onNavigateTab("reports")}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {data.recentBills.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">No bills created yet today</div>
            ) : (
              data.recentBills.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{b.bill_number}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 rounded font-normal">
                        {b.bill_type}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {b.customer_name || "Walk-in"} &bull; {formatTimeIST(b.created_at)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-white font-mono">
                      {formatRupees(b.final_amount_paise)}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        b.payment_status === "PAID"
                          ? "bg-emerald-950 text-emerald-400"
                          : b.payment_status === "PARTIAL"
                          ? "bg-blue-950 text-blue-400"
                          : "bg-amber-950 text-amber-400"
                      }`}
                    >
                      {b.payment_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Debtors / Outstanding Credit */}
        <div className="bg-[#0f1420] border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
            <h3 className="font-bold text-white text-sm">Customers With Udhaar (Baki)</h3>
            <button
              type="button"
              onClick={() => onNavigateTab("customers")}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Customers</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {data.topDebtors.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-xs">
                Zero outstanding credit! All players settled.
              </div>
            ) : (
              data.topDebtors.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{d.name}</div>
                    <div className="text-[11px] text-zinc-400">{d.phone || "No phone recorded"}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-amber-400 font-mono">
                      {formatRupees(d.outstanding_credit_paise)}
                    </span>
                    <button
                      type="button"
                      onClick={onCollectUdhaar}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
