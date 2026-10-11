"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Plus,
  Square,
  Clock,
  CircleDot,
  Trophy,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import { formatTimeIST, formatDurationMinutes, calculateElapsedMinutes } from "@/lib/utils/date";
import type { TableItem, GameType, GameSessionItem } from "@/lib/types";

interface Props {
  type: GameType;
  onStartGame: (table: TableItem) => void;
  onAddItems: (session: GameSessionItem) => void;
  onEndGame: (session: GameSessionItem) => void;
}

export function TablesView({ type, onStartGame, onAddItems, onEndGame }: Props) {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTicker] = useState(0);

  const fetchTables = () => {
    fetch(`/api/tables?type=${type}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTables(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000);
    return () => clearInterval(interval);
  }, [type]);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = tables.filter((t) => t.active_session).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {type === "POOL" ? (
              <CircleDot className="w-5 h-5 text-emerald-400" />
            ) : (
              <Trophy className="w-5 h-5 text-emerald-400" />
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {type === "POOL" ? "Pool Tables" : "Snooker Tables"}
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {tables.length} {type.toLowerCase()} tables configured &bull; Rate:{" "}
            <strong className="text-emerald-400">
              {formatRupees(tables[0]?.hourly_rate_paise || (type === "POOL" ? 20000 : 35000))}/hr
            </strong>
          </p>
        </div>

        {/* Live occupancy status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 self-start sm:self-auto">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              activeCount > 0 ? "bg-emerald-400 animate-ping" : "bg-zinc-600"
            }`}
          />
          <span>
            {activeCount} of {tables.length} Tables In Use
          </span>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tables.map((table) => {
          const isRunning = !!table.active_session;
          const session = table.active_session;
          const liveMins = session ? calculateElapsedMinutes(session.start_time) : 0;

          return (
            <div
              key={table.id}
              className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xl ${
                isRunning
                  ? "bg-[#0d1424] border-emerald-500/50 ring-1 ring-emerald-500/20"
                  : "bg-[#0f1420] border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              {/* Table Top Banner */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isRunning
                    ? "bg-emerald-950/40 border-emerald-800/40"
                    : "bg-zinc-900/50 border-zinc-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      isRunning
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {table.name.replace(/[^0-9]/g, "") || table.display_order}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white leading-tight">
                      {table.name}
                    </h3>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      {table.rate_plan_name || `${type} Standard`}
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isRunning
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm"
                      : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/60"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRunning ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                    }`}
                  />
                  <span>{isRunning ? "Running" : "Available"}</span>
                </div>
              </div>

              {/* Table Body Content */}
              <div className="p-4 space-y-4 flex-1">
                {isRunning && session ? (
                  <>
                    {/* Running Player & Estimated Amount */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Current Player:</span>
                        <div className="font-bold text-sm text-white">
                          {session.customer_name || "Casual Walk-in"}
                        </div>
                        {session.notes && (
                          <div className="text-[11px] text-zinc-400 italic mt-0.5">
                            &quot;{session.notes}&quot;
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 block">Current Bill:</span>
                        <div className="text-xl font-black text-emerald-400 font-mono">
                          {formatRupees(session.final_amount_paise)}
                        </div>
                      </div>
                    </div>

                    {/* Live Independent Timer Box */}
                    <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/90 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Started IST:</span>
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            {formatTimeIST(session.start_time)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block">Elapsed Duration:</span>
                        <span className="text-lg font-black text-white font-mono">
                          {formatDurationMinutes(liveMins)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown of table time and add-on items */}
                    <div className="space-y-1 text-xs text-zinc-400 border-t border-zinc-800/80 pt-2">
                      <div className="flex items-center justify-between">
                        <span>Table Play Charge:</span>
                        <span className="font-mono text-zinc-200">
                          {formatRupees(session.table_charge_paise)}
                        </span>
                      </div>
                      {session.items_charge_paise > 0 && (
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Add-on Snacks &amp; Drinks:</span>
                          <span className="font-mono font-bold">
                            +{formatRupees(session.items_charge_paise)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Available Table Idle State */
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/40 border border-zinc-700/40 flex items-center justify-center text-zinc-500">
                      <CheckCircle className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="font-bold text-sm text-zinc-200">Table Ready to Play</div>
                    <div className="text-xs text-zinc-500 max-w-[200px]">
                      {formatRupees(table.hourly_rate_paise || 20000)}/hr &bull; Min charge:{" "}
                      {formatRupees(table.minimum_charge_paise || 5000)}
                    </div>
                  </div>
                )}
              </div>

              {/* Table Bottom Action Footer */}
              <div className="p-3 bg-zinc-900/60 border-t border-zinc-800/80">
                {isRunning && session ? (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Mandatory "Add Items" button on every table card */}
                    <button
                      type="button"
                      onClick={() => onAddItems(session)}
                      className="py-3 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-zinc-700/60 shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Add Items</span>
                    </button>

                    {/* End Game Button */}
                    <button
                      type="button"
                      onClick={() => onEndGame(session)}
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>End Game</span>
                    </button>
                  </div>
                ) : (
                  /* Start Game Button */
                  <button
                    type="button"
                    onClick={() => onStartGame(table)}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start {type} Game</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
