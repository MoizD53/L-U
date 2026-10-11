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
        <div className="w-8 h-8 border-2 border-[#187653]/30 border-t-[#187653] rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = tables.filter((t) => t.active_session).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#202722] pb-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
            Arena Tournament Boards &bull; {type}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight mt-0.5">
            {type === "POOL" ? "Pool Tables" : "Snooker Tables"}
          </h1>
          <p className="text-xs text-[#A6AAA3] mt-1">
            {tables.length} arena tables &bull; Rate:{" "}
            <span className="font-mono-numbers font-medium text-[#B69A62]">
              {formatRupees(tables[0]?.hourly_rate_paise || (type === "POOL" ? 20000 : 35000))}/hr
            </span>
          </p>
        </div>

        {/* Live occupancy status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#131714] border border-[#202722] rounded-xl text-xs font-medium text-[#F0EBDD] self-start sm:self-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              activeCount > 0 ? "bg-[#187653]" : "bg-[#6B726B]"
            }`}
          />
          <span>
            {activeCount} of {tables.length} Tables In Play
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
              className={`rounded-2xl border transition-colors overflow-hidden flex flex-col justify-between shadow-xl ${
                isRunning
                  ? "bg-[#131714] border-[#187653]/50"
                  : "bg-[#131714] border-[#202722]"
              }`}
            >
              {/* Table Top Header */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isRunning
                    ? "bg-[#123B2C]/30 border-[#187653]/30"
                    : "bg-[#0E1210]/60 border-[#202722]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-numbers text-xs font-semibold ${
                      isRunning
                        ? "bg-[#187653] text-[#F0EBDD]"
                        : "bg-[#0E1210] border border-[#202722] text-[#A6AAA3]"
                    }`}
                  >
                    {table.name.replace(/[^0-9]/g, "") || table.display_order}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-[#F0EBDD] leading-tight">
                      {table.name}
                    </h3>
                    <span className="text-[10px] text-[#6B726B] font-medium tracking-wider uppercase">
                      {table.rate_plan_name || `${type} Standard`}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 ${
                    isRunning
                      ? "bg-[#123B2C] text-[#F0EBDD] border border-[#187653]/40"
                      : "bg-[#0E1210] text-[#6B726B] border border-[#202722]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRunning ? "bg-[#187653]" : "bg-[#6B726B]"
                    }`}
                  />
                  <span>{isRunning ? "Occupied" : "Available"}</span>
                </div>
              </div>

              {/* Table Body Content */}
              <div className="p-4 space-y-3.5 flex-1">
                {isRunning && session ? (
                  <>
                    {/* Running Player & Estimated Amount */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-[#6B726B] block">Current Player:</span>
                        <div className="font-medium text-sm text-[#F0EBDD]">
                          {session.customer_name || "Walk-in Player"}
                        </div>
                        {session.notes && (
                          <div className="text-[11px] text-[#A6AAA3] italic mt-0.5">
                            &quot;{session.notes}&quot;
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#6B726B] block">Estimated Total:</span>
                        <div className="font-mono-numbers text-xl font-bold text-[#F0EBDD]">
                          {formatRupees(session.final_amount_paise)}
                        </div>
                      </div>
                    </div>

                    {/* Live Independent Timer Box */}
                    <div className="p-3 bg-[#0E1210] rounded-xl border border-[#202722] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#187653]" />
                        <div>
                          <span className="text-[10px] text-[#6B726B] block">Started:</span>
                          <span className="font-mono-numbers text-xs text-[#A6AAA3]">
                            {formatTimeIST(session.start_time)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#6B726B] block">Elapsed:</span>
                        <span className="font-mono-numbers text-base font-bold text-[#187653]">
                          {formatDurationMinutes(liveMins)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown of table time and add-on items */}
                    <div className="space-y-1 text-xs border-t border-[#202722] pt-2">
                      <div className="flex items-center justify-between text-[#A6AAA3]">
                        <span>Table Play:</span>
                        <span className="font-mono-numbers text-[#F0EBDD]">
                          {formatRupees(session.table_charge_paise)}
                        </span>
                      </div>
                      {session.items_charge_paise > 0 && (
                        <div className="flex items-center justify-between text-[#B69A62]">
                          <span>Add-on Products:</span>
                          <span className="font-mono-numbers font-medium">
                            +{formatRupees(session.items_charge_paise)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Available Table Idle State */
                  <div className="py-7 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-[#0E1210] border border-[#202722] flex items-center justify-center text-[#6B726B]">
                      <CircleDot className="w-5 h-5 text-[#187653]/60" />
                    </div>
                    <div className="font-display font-medium text-sm text-[#F0EBDD]">Table Ready</div>
                    <div className="text-xs text-[#6B726B] max-w-[200px]">
                      <span className="font-mono-numbers text-[#A6AAA3]">{formatRupees(table.hourly_rate_paise || 20000)}/hr</span> &bull; Min charge:{" "}
                      <span className="font-mono-numbers text-[#A6AAA3]">{formatRupees(table.minimum_charge_paise || 5000)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Table Bottom Action Footer */}
              <div className="p-3 bg-[#0E1210]/60 border-t border-[#202722]">
                {isRunning && session ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onAddItems(session)}
                      className="py-2.5 px-3 bg-[#131714] hover:bg-[#181E19] text-[#A6AAA3] hover:text-[#F0EBDD] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-[#202722] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#187653]" />
                      <span>Add Items</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEndGame(session)}
                      className="py-2.5 px-3 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-[#F0EBDD]" />
                      <span>End &amp; Bill</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartGame(table)}
                    className="w-full py-2.5 px-4 bg-[#187653] hover:bg-[#123B2C] active:bg-[#0F2F23] text-[#F0EBDD] font-medium text-xs rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#F0EBDD]" />
                    <span>Open {type} Session</span>
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

