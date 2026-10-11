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
        <div className="w-8 h-8 border-2 border-[#187653]/30 border-t-[#187653] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-20 select-none">
      {/* Editorial Header & Shift Status */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#202722] pb-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
            Dahod Arena &bull; Operational Register
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight mt-0.5">
            Today&apos;s Ledger &amp; Tables
          </h1>
          <p className="text-xs text-[#A6AAA3] mt-1">
            Business Date: <span className="font-mono-numbers text-[#F0EBDD]">{data.date}</span> &bull; Asia/Kolkata
          </p>
        </div>

        {/* Shift / Daily Closing Trigger */}
        <div>
          {data.isShiftOpen ? (
            <button
              type="button"
              onClick={onCloseHisab}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#131714] hover:bg-[#181E19] text-[#B69A62] border border-[#B69A62]/30 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#B69A62]" />
              <span>Shift Active &bull; Reconcile Daily Hisab</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#131714] border border-[#202722] rounded-xl text-xs font-medium text-[#A6AAA3]">
              <Lock className="w-3.5 h-3.5 text-[#6B726B]" />
              <span>Today&apos;s Hisab Reconciled &amp; Locked</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary & Secondary Operational Actions */}
      <div className="space-y-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B726B]">
          Operational Actions
        </div>

        {/* Primary Table Launchers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStartPoolGame}
            className="flex items-center justify-between p-4 bg-[#123B2C] hover:bg-[#154634] active:bg-[#0F2F23] border border-[#187653]/40 rounded-xl text-left transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0B0D0C]/40 flex items-center justify-center text-[#F0EBDD]">
                <CircleDot className="w-5 h-5 text-[#187653] group-hover:text-[#F0EBDD] transition-colors" />
              </div>
              <div>
                <div className="font-display font-semibold text-base text-[#F0EBDD] leading-tight">
                  Start Pool Session
                </div>
                <div className="text-xs text-[#A6AAA3]">
                  {data.activePoolTables} of 3 tables active
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-[#F0EBDD] px-2.5 py-1 bg-[#0B0D0C]/40 rounded-lg">
              Launch Table &rarr;
            </span>
          </button>

          <button
            type="button"
            onClick={onStartSnookerGame}
            className="flex items-center justify-between p-4 bg-[#123B2C] hover:bg-[#154634] active:bg-[#0F2F23] border border-[#187653]/40 rounded-xl text-left transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0B0D0C]/40 flex items-center justify-center text-[#F0EBDD]">
                <Trophy className="w-5 h-5 text-[#187653] group-hover:text-[#F0EBDD] transition-colors" />
              </div>
              <div>
                <div className="font-display font-semibold text-base text-[#F0EBDD] leading-tight">
                  Start Snooker Session
                </div>
                <div className="text-xs text-[#A6AAA3]">
                  {data.activeSnookerTables} of 2 tables active
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-[#F0EBDD] px-2.5 py-1 bg-[#0B0D0C]/40 rounded-lg">
              Launch Table &rarr;
            </span>
          </button>
        </div>

        {/* Secondary Auxiliary Counter Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCounterSale}
            className="p-3 bg-[#131714] hover:bg-[#181E19] border border-[#202722] hover:border-[#2A332C] rounded-xl text-left transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#B69A62] mb-1.5" />
            <div className="text-xs font-medium text-[#F0EBDD]">Counter Sale</div>
            <div className="text-[10px] text-[#6B726B]">Shop &amp; Snacks</div>
          </button>

          <button
            type="button"
            onClick={onAddExpense}
            className="p-3 bg-[#131714] hover:bg-[#181E19] border border-[#202722] hover:border-[#2A332C] rounded-xl text-left transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-[#A6AAA3] mb-1.5" />
            <div className="text-xs font-medium text-[#F0EBDD]">Record Expense</div>
            <div className="text-[10px] text-[#6B726B]">Cash / Bank</div>
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="p-3 bg-[#131714] hover:bg-[#181E19] border border-[#202722] hover:border-[#2A332C] rounded-xl text-left transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#A6AAA3] mb-1.5" />
            <div className="text-xs font-medium text-[#F0EBDD]">Add Customer</div>
            <div className="text-[10px] text-[#6B726B]">Player Directory</div>
          </button>

          <button
            type="button"
            onClick={onCollectUdhaar}
            className="p-3 bg-[#131714] hover:bg-[#181E19] border border-[#202722] hover:border-[#2A332C] rounded-xl text-left transition-colors cursor-pointer"
          >
            <Coins className="w-4 h-4 text-[#B69A62] mb-1.5" />
            <div className="text-xs font-medium text-[#F0EBDD]">Collect Udhaar</div>
            <div className="text-[10px] text-[#B69A62]/80">Player Credit</div>
          </button>

          <button
            type="button"
            onClick={onCloseHisab}
            className="col-span-2 sm:col-span-1 p-3 bg-[#131714] hover:bg-[#181E19] border border-[#202722] hover:border-[#2A332C] rounded-xl text-left transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4 text-[#B69A62] mb-1.5" />
            <div className="text-xs font-medium text-[#F0EBDD]">Close Hisab</div>
            <div className="text-[10px] text-[#6B726B]">Cash Drawer</div>
          </button>
        </div>
      </div>

      {/* Bespoke Financial Overview & Ledger */}
      <div className="bg-[#131714] border border-[#202722] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#202722] gap-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
              Financial Accounting &bull; Real Time
            </span>
            <h2 className="font-display text-lg font-bold text-[#F0EBDD]">
              Today&apos;s Revenue &amp; Cash Flow
            </h2>
          </div>
          <span className="text-[11px] text-[#A6AAA3]">
            Amounts stored in integer paise &bull; Zero client estimation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-5">
          {/* Column 1: Actual Collections (Money In Hand) */}
          <div className="space-y-4 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-[#202722] pb-5 lg:pb-0">
            <div>
              <div className="text-xs font-medium text-[#187653] uppercase tracking-wider">
                Total Collections (Collected)
              </div>
              <div className="font-mono-numbers text-3xl sm:text-4xl font-bold text-[#F0EBDD] mt-1">
                {formatRupees(data.todayCollectedPaise)}
              </div>
              <p className="text-[11px] text-[#A6AAA3] mt-1">
                Actual money received today across all counters
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#202722]/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A6AAA3]">Cash in Drawer (Rokad):</span>
                <span className="font-mono-numbers font-medium text-[#F0EBDD]">
                  {formatRupees(data.cashCollectedPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A6AAA3]">UPI &amp; Bank Collections:</span>
                <span className="font-mono-numbers font-medium text-[#187653]">
                  {formatRupees(data.upiCollectedPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Billed Activity vs Expenses */}
          <div className="space-y-4 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-[#202722] pb-5 lg:pb-0">
            <div>
              <div className="text-xs font-medium text-[#A6AAA3] uppercase tracking-wider">
                Billed Revenue (Invoiced)
              </div>
              <div className="font-mono-numbers text-3xl sm:text-4xl font-bold text-[#F0EBDD] mt-1">
                {formatRupees(data.todayBilledPaise)}
              </div>
              <p className="text-[11px] text-[#6B726B] mt-1">
                Total finalized table charges + counter invoices
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#202722]/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A6AAA3]">Today&apos;s Total Expenses:</span>
                <span className="font-mono-numbers font-medium text-[#F0EBDD]">
                  {formatRupees(data.todayExpensesPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B726B]">Drawer Cash Deductions:</span>
                <span className="font-mono-numbers font-medium text-[#A6AAA3]">
                  {formatRupees(data.drawerCashExpensesPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Outstanding Customer Credit (Udhaar) */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-medium text-[#B69A62] uppercase tracking-wider">
                Outstanding Credit (Udhaar)
              </div>
              <div className="font-mono-numbers text-3xl sm:text-4xl font-bold text-[#B69A62] mt-1">
                {formatRupees(data.totalOutstandingCreditPaise)}
              </div>
              <p className="text-[11px] text-[#A6AAA3] mt-1">
                Pending balance owed by registered players
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#202722]/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A6AAA3]">Pool Games Completed:</span>
                <span className="font-mono-numbers font-medium text-[#F0EBDD]">
                  {data.poolGamesPlayedToday}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A6AAA3]">Snooker Games Completed:</span>
                <span className="font-mono-numbers font-medium text-[#F0EBDD]">
                  {data.snookerGamesPlayedToday}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Table Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#202722] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#187653]" />
            <h2 className="font-display text-lg font-semibold text-[#F0EBDD]">
              Active Table Sessions ({data.activeSessions.length})
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab("pool")}
              className="text-[#A6AAA3] hover:text-[#F0EBDD] transition-colors cursor-pointer"
            >
              Pool Tables &rarr;
            </button>
            <span className="text-[#202722]">&bull;</span>
            <button
              type="button"
              onClick={() => onNavigateTab("snooker")}
              className="text-[#A6AAA3] hover:text-[#F0EBDD] transition-colors cursor-pointer"
            >
              Snooker Tables &rarr;
            </button>
          </div>
        </div>

        {data.activeSessions.length === 0 ? (
          <div className="p-8 bg-[#131714] border border-[#202722] rounded-2xl text-center">
            <div className="w-10 h-10 rounded-xl bg-[#0E1210] border border-[#202722] flex items-center justify-center mx-auto mb-3 text-[#6B726B]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-display font-medium text-sm text-[#F0EBDD] mb-1">
              All Tables Currently Available
            </h3>
            <p className="text-xs text-[#A6AAA3] mb-4">No live sessions in play at this moment</p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onStartPoolGame}
                className="py-2 px-3.5 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Start Pool
              </button>
              <button
                type="button"
                onClick={onStartSnookerGame}
                className="py-2 px-3.5 bg-[#131714] hover:bg-[#181E19] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#202722] rounded-xl text-xs font-medium cursor-pointer transition-colors"
              >
                Start Snooker
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
                  className="p-4 bg-[#131714] border border-[#202722] rounded-xl flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#187653]">
                        {session.table_type} &bull; Live
                      </div>
                      <h3 className="font-display font-semibold text-base text-[#F0EBDD]">
                        {session.table_name || "Arena Table"}
                      </h3>
                      {session.customer_name ? (
                        <div className="text-xs text-[#A6AAA3] mt-0.5">
                          Player: <span className="text-[#F0EBDD] font-medium">{session.customer_name}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#6B726B] mt-0.5">Walk-in Player</div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#A6AAA3]">Estimated:</div>
                      <div className="font-mono-numbers text-lg font-bold text-[#F0EBDD]">
                        {formatRupees(session.final_amount_paise)}
                      </div>
                    </div>
                  </div>

                  {/* Live Timer Display */}
                  <div className="p-2.5 bg-[#0E1210] rounded-lg border border-[#202722] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#187653]" />
                      <div>
                        <div className="text-[10px] text-[#6B726B]">Started:</div>
                        <div className="font-mono-numbers text-xs text-[#F0EBDD]">
                          {formatTimeIST(session.start_time)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#6B726B]">Elapsed:</div>
                      <div className="font-mono-numbers text-sm font-semibold text-[#187653]">
                        {formatDurationMinutes(liveMins)}
                      </div>
                    </div>
                  </div>

                  {/* Add-ons line if present */}
                  {session.items && session.items.length > 0 && (
                    <div className="text-xs text-[#B69A62] flex items-center justify-between px-1">
                      <span>Add-ons ({session.items.length}):</span>
                      <span className="font-mono-numbers font-medium">{formatRupees(session.items_charge_paise)}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onAddItemsToSession(session)}
                      className="py-2 px-3 bg-[#0E1210] hover:bg-[#181E19] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#202722] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#187653]" />
                      <span>+ Add Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEndSession(session)}
                      className="py-2 px-3 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Square className="w-2.5 h-2.5 fill-[#F0EBDD]" />
                      <span>End &amp; Bill</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two Column Bottom Ledgers: Recent Arena Bills & Player Udhaar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bills */}
        <div className="bg-[#131714] border border-[#202722] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#202722]">
            <h3 className="font-display font-semibold text-sm text-[#F0EBDD]">Recent Invoices</h3>
            <button
              type="button"
              onClick={() => onNavigateTab("reports")}
              className="text-xs text-[#A6AAA3] hover:text-[#F0EBDD] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {data.recentBills.length === 0 ? (
              <div className="text-center py-6 text-[#6B726B] text-xs">No invoices created yet today</div>
            ) : (
              data.recentBills.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 bg-[#0E1210] rounded-xl border border-[#202722] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-[#F0EBDD] flex items-center gap-2">
                      <span className="font-mono-numbers">{b.bill_number}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#131714] text-[#A6AAA3] border border-[#202722] rounded font-normal">
                        {b.bill_type}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B726B] mt-0.5">
                      {b.customer_name || "Walk-in"} &bull; {formatTimeIST(b.created_at)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono-numbers font-medium text-sm text-[#F0EBDD]">
                      {formatRupees(b.final_amount_paise)}
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                        b.payment_status === "PAID"
                          ? "bg-[#123B2C] text-[#F0EBDD]"
                          : b.payment_status === "PARTIAL"
                          ? "bg-[#B69A62]/20 text-[#B69A62]"
                          : "bg-red-950/40 text-red-300"
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
        <div className="bg-[#131714] border border-[#202722] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#202722]">
            <h3 className="font-display font-semibold text-sm text-[#F0EBDD]">Player Credit Ledger</h3>
            <button
              type="button"
              onClick={() => onNavigateTab("customers")}
              className="text-xs text-[#B69A62] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {data.topDebtors.length === 0 ? (
              <div className="text-center py-6 text-[#6B726B] text-xs">
                Zero outstanding credit. All accounts settled.
              </div>
            ) : (
              data.topDebtors.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 bg-[#0E1210] rounded-xl border border-[#202722] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-[#F0EBDD]">{d.name}</div>
                    <div className="text-[11px] text-[#6B726B]">{d.phone || "No phone recorded"}</div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-numbers font-medium text-sm text-[#B69A62]">
                      {formatRupees(d.outstanding_credit_paise)}
                    </span>
                    <button
                      type="button"
                      onClick={onCollectUdhaar}
                      className="px-2.5 py-1 bg-[#131714] hover:bg-[#181E19] text-[#B69A62] border border-[#B69A62]/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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

