"use client";

import React, { useState, useEffect } from "react";
import { Download, Calendar, CircleDot, Trophy, DollarSign, TrendingUp } from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import { formatDurationMinutes } from "@/lib/utils/date";

export function ReportsView() {
  const [range, setRange] = useState<"today" | "yesterday" | "week" | "month" | "custom">("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    let url = `/api/reports?range=${range}`;
    if (range === "custom" && customStart && customEnd) {
      url += `&start=${customStart}&end=${customEnd}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [range, customStart, customEnd]);

  const handleDownloadCsv = (type: "bills" | "expenses" | "customers" | "products") => {
    window.open(`/api/reports/export?type=${type}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Date Range Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Financial Analysis &amp; Reports
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real database audit records &bull; Billed revenue, actual collections, profits &amp; table analytics
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0f1420] p-1.5 rounded-2xl border border-zinc-800 self-start md:self-auto">
          {(["today", "yesterday", "week", "month", "custom"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                range === r
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {r === "week" ? "This Week" : r === "month" ? "This Month" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Date Pickers */}
      {range === "custom" && (
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 bg-[#090d14] border border-zinc-800 rounded-lg text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 bg-[#090d14] border border-zinc-800 rounded-lg text-white"
            />
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : !data ? null : (
        <>
          {/* Top Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <div className="p-4 bg-[#0f1420] border border-zinc-800 rounded-2xl">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Total Billed</span>
              <div className="text-xl font-black text-white font-mono">
                {formatRupees(data.overview.totalBilledPaise)}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">Invoices generated</span>
            </div>

            <div className="p-4 bg-emerald-950/30 border border-emerald-600/40 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-400 block mb-1">Total Collections</span>
              <div className="text-xl font-black text-emerald-300 font-mono">
                {formatRupees(data.overview.totalCollectedPaise)}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">
                Cash: {formatRupees(data.overview.cashCollectedPaise)} | UPI: {formatRupees(data.overview.upiCollectedPaise)}
              </span>
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-2xl">
              <span className="text-[11px] font-semibold text-rose-400 block mb-1">Total Expenses</span>
              <div className="text-xl font-black text-rose-300 font-mono">
                {formatRupees(data.overview.totalExpensesPaise)}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Cash out: {formatRupees(data.overview.cashExpensesPaise)}
              </span>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-600/40 rounded-2xl">
              <span className="text-[11px] font-bold text-amber-400 block mb-1">New Udhaar Created</span>
              <div className="text-xl font-black text-amber-300 font-mono">
                {formatRupees(data.overview.creditCreatedPaise)}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Udhaar collected: {formatRupees(data.overview.creditCollectedPaise)}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border ${
              data.overview.netOperatingResultPaise >= 0
                ? "bg-emerald-950/40 border-emerald-500/50"
                : "bg-rose-950/40 border-rose-500/50"
            }`}>
              <span className="text-[11px] font-bold text-zinc-300 block mb-1">
                Net Operating Cash Result
              </span>
              <div className="text-xl font-black text-white font-mono">
                {formatRupees(data.overview.netOperatingResultPaise)}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Total Collections - Expenses
              </span>
            </div>
          </div>

          {/* Pool vs Snooker Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pool Games Card */}
            <div className="p-5 bg-[#0f1420] border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <CircleDot className="w-5 h-5 text-emerald-400" />
                  <span>Pool Tables Performance</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold">
                  {data.overview.poolGames} Games
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Total Occupied Time:</span>
                  <span className="text-base font-bold text-white font-mono">
                    {formatDurationMinutes(data.overview.poolMinutes)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Pool Play Revenue:</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {formatRupees(data.overview.poolRevenuePaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Snooker Games Card */}
            <div className="p-5 bg-[#0f1420] border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-white text-base">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                  <span>Snooker Tables Performance</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold">
                  {data.overview.snookerGames} Games
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Total Occupied Time:</span>
                  <span className="text-base font-bold text-white font-mono">
                    {formatDurationMinutes(data.overview.snookerMinutes)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Snooker Play Revenue:</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {formatRupees(data.overview.snookerRevenuePaise)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Profit & Low Stock Estimates */}
          <div className="p-5 bg-[#0f1420] border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Shop Counter Sales &amp; Gross Profit Estimate</span>
              </div>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                Profit: {formatRupees(data.overview.shopGrossProfitPaise)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Shop Gross Sales:</span>
                <span className="text-base font-bold text-white font-mono">
                  {formatRupees(data.overview.shopSalesPaise)}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 block">Cost of Goods Sold (COGS):</span>
                <span className="text-base font-bold text-zinc-300 font-mono">
                  {formatRupees(data.overview.shopCogsPaise)}
                </span>
              </div>
              <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-800/40">
                <span className="text-emerald-400 block font-semibold">Estimated Gross Profit:</span>
                <span className="text-base font-black text-emerald-300 font-mono">
                  {formatRupees(data.overview.shopGrossProfitPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Table by Table Occupancy Breakdown */}
          <div className="bg-[#0f1420] border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Table by Table Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2">Table Name</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-right">Sessions</th>
                    <th className="py-2 text-right">Occupied Duration</th>
                    <th className="py-2 text-right">Play Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {data.tables.map((t: any) => (
                    <tr key={t.id} className="hover:bg-zinc-900/30">
                      <td className="py-2.5 font-bold text-white">{t.name}</td>
                      <td className="py-2.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono">{t.sessionsCount}</td>
                      <td className="py-2.5 text-right font-mono">
                        {formatDurationMinutes(t.totalDurationMinutes)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        {formatRupees(t.totalRevenuePaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CSV Export Bar */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="font-bold text-sm text-white block">Download Audit Records</span>
              <span className="text-xs text-zinc-400">Export filtered data as Excel-compatible CSV files</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadCsv("bills")}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Bills</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv("expenses")}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                <span>Export Expenses</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv("customers")}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Customers</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv("products")}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Stock</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
