"use client";

import React, { useState, useEffect } from "react";
import { Download, Calendar, CircleDot, Trophy, DollarSign, TrendingUp, ArrowDownToLine } from "lucide-react";
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
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Header & Date Range Selectors */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222823] pb-5">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#B69A62]">
            Dahod Financial Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F0EBDD] tracking-tight mt-1">
            Financial Audit &amp; Performance
          </h1>
          <p className="text-xs text-[#A6AAA3] mt-1 max-w-xl">
            Real-time ledger audit reconciling billed invoices, physical cash intake, bank transfers, disbursements, and table utilization.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#131714] p-1 rounded-lg border border-[#222823] self-start md:self-auto">
          {(["today", "yesterday", "week", "month", "custom"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded text-xs font-medium capitalize tracking-wide transition-colors ${
                range === r
                  ? "bg-[#187653] text-[#F0EBDD] font-semibold shadow-sm"
                  : "text-[#A6AAA3] hover:text-[#F0EBDD]"
              }`}
            >
              {r === "week" ? "This Week" : r === "month" ? "This Month" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Date Pickers */}
      {range === "custom" && (
        <div className="p-3.5 bg-[#131714] rounded-lg border border-[#222823] flex flex-wrap items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-[#B69A62] shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-[#A6AAA3]">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 bg-[#0B0D0C] border border-[#222823] rounded text-[#F0EBDD] text-xs font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A6AAA3]">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 bg-[#0B0D0C] border border-[#222823] rounded text-[#F0EBDD] text-xs font-mono"
            />
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-[#187653]/30 border-t-[#187653] rounded-full animate-spin" />
        </div>
      ) : !data ? null : (
        <>
          {/* Executive P&L Overview Statement */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="p-4 bg-[#131714] border border-[#222823] rounded-lg">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A6AAA3] block mb-1.5">
                Total Billed
              </span>
              <div className="text-xl font-mono font-bold text-[#F0EBDD]">
                {formatRupees(data.overview.totalBilledPaise)}
              </div>
              <span className="text-[10px] text-[#A6AAA3] mt-1.5 block">Invoices generated</span>
            </div>

            <div className="p-4 bg-[#131714] border border-[#222823] rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#187653]" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#187653] block mb-1.5">
                Actual Collections
              </span>
              <div className="text-xl font-mono font-bold text-[#F0EBDD]">
                {formatRupees(data.overview.totalCollectedPaise)}
              </div>
              <span className="text-[10px] text-[#A6AAA3] mt-1.5 block font-mono">
                Cash: {formatRupees(data.overview.cashCollectedPaise)} &middot; UPI: {formatRupees(data.overview.upiCollectedPaise)}
              </span>
            </div>

            <div className="p-4 bg-[#131714] border border-[#222823] rounded-lg">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A6AAA3] block mb-1.5">
                Total Expenses
              </span>
              <div className="text-xl font-mono font-bold text-[#F0EBDD]">
                {formatRupees(data.overview.totalExpensesPaise)}
              </div>
              <span className="text-[10px] text-[#A6AAA3] mt-1.5 block font-mono">
                Drawer rokad: {formatRupees(data.overview.cashExpensesPaise)}
              </span>
            </div>

            <div className="p-4 bg-[#131714] border border-[#222823] rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#B69A62]/50" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B69A62] block mb-1.5">
                New Udhaar Extended
              </span>
              <div className="text-xl font-mono font-bold text-[#F0EBDD]">
                {formatRupees(data.overview.creditCreatedPaise)}
              </div>
              <span className="text-[10px] text-[#A6AAA3] mt-1.5 block font-mono">
                Collected back: {formatRupees(data.overview.creditCollectedPaise)}
              </span>
            </div>

            <div className="col-span-2 md:col-span-1 p-4 bg-[#131714] border border-[#222823] rounded-lg relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${data.overview.netOperatingResultPaise >= 0 ? "bg-[#187653]" : "bg-rose-500"}`} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A6AAA3] block mb-1.5">
                Net Operating Result
              </span>
              <div className={`text-xl font-mono font-bold ${data.overview.netOperatingResultPaise >= 0 ? "text-[#F0EBDD]" : "text-rose-400"}`}>
                {formatRupees(data.overview.netOperatingResultPaise)}
              </div>
              <span className="text-[10px] text-[#A6AAA3] mt-1.5 block">
                Collections minus disbursements
              </span>
            </div>
          </div>

          {/* Table Sports Occupancy Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pool Games Card */}
            <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
                <div className="flex items-center gap-2.5">
                  <CircleDot className="w-4 h-4 text-[#187653]" />
                  <span className="font-serif font-bold text-[#F0EBDD] text-base">Pool Table Utilization</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B0D0C] text-[#B69A62] border border-[#222823]">
                  {data.overview.poolGames} Session{data.overview.poolGames === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Total Play Time</span>
                  <span className="text-base font-bold text-[#F0EBDD] font-mono">
                    {formatDurationMinutes(data.overview.poolMinutes)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Pool Revenue</span>
                  <span className="text-base font-bold text-[#F0EBDD] font-mono">
                    {formatRupees(data.overview.poolRevenuePaise)}
                  </span>
                </div>
              </div>
            </div>

            {/* Snooker Games Card */}
            <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-[#B69A62]" />
                  <span className="font-serif font-bold text-[#F0EBDD] text-base">Snooker Table Utilization</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B0D0C] text-[#B69A62] border border-[#222823]">
                  {data.overview.snookerGames} Session{data.overview.snookerGames === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Total Play Time</span>
                  <span className="text-base font-bold text-[#F0EBDD] font-mono">
                    {formatDurationMinutes(data.overview.snookerMinutes)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Snooker Revenue</span>
                  <span className="text-base font-bold text-[#F0EBDD] font-mono">
                    {formatRupees(data.overview.snookerRevenuePaise)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lounge Retail Margin Overview */}
          <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-[#187653]" />
                <span className="font-serif font-bold text-[#F0EBDD] text-sm sm:text-base">
                  Lounge Counter Sales &amp; Margin Analysis
                </span>
              </div>
              <span className="font-mono font-bold text-[#B69A62] text-sm">
                Est. Gross Margin: {formatRupees(data.overview.shopGrossProfitPaise)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-[#0B0D0C] rounded border border-[#222823]">
                <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Gross Sales Billed</span>
                <span className="text-base font-bold text-[#F0EBDD] font-mono">
                  {formatRupees(data.overview.shopSalesPaise)}
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0D0C] rounded border border-[#222823]">
                <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block mb-1">Cost of Goods (COGS)</span>
                <span className="text-base font-bold text-[#A6AAA3] font-mono">
                  {formatRupees(data.overview.shopCogsPaise)}
                </span>
              </div>
              <div className="p-3.5 bg-[#0B0D0C] rounded border border-[#187653]/30">
                <span className="text-[10px] uppercase tracking-wider text-[#187653] block mb-1 font-semibold">Estimated Gross Profit</span>
                <span className="text-base font-bold text-[#F0EBDD] font-mono">
                  {formatRupees(data.overview.shopGrossProfitPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Table by Table Occupancy Breakdown */}
          <div className="bg-[#131714] border border-[#222823] rounded-lg p-5 space-y-3">
            <h3 className="font-serif font-bold text-[#F0EBDD] text-sm sm:text-base">
              Individual Table Performance Ledger
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase tracking-[0.2em] text-[#A6AAA3] border-b border-[#222823]">
                  <tr>
                    <th className="py-2.5">Table Designation</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">Sessions</th>
                    <th className="py-2.5 text-right">Occupied Duration</th>
                    <th className="py-2.5 text-right">Table Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222823]">
                  {data.tables.map((t: any) => (
                    <tr key={t.id} className="hover:bg-[#181d1a]/40 transition-colors">
                      <td className="py-3 font-semibold text-[#F0EBDD]">{t.name}</td>
                      <td className="py-3">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#0B0D0C] text-[#A6AAA3] border border-[#222823]">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-[#F0EBDD]">{t.sessionsCount}</td>
                      <td className="py-3 text-right font-mono text-[#A6AAA3]">
                        {formatDurationMinutes(t.totalDurationMinutes)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-[#F0EBDD]">
                        {formatRupees(t.totalRevenuePaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CSV Export Bar */}
          <div className="p-4 bg-[#131714] border border-[#222823] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-serif font-bold text-sm text-[#F0EBDD] block">Export Verified Audit Data</span>
              <span className="text-xs text-[#A6AAA3]">Generate raw data archives in standard comma-separated format</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadCsv("bills")}
                className="py-2 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#F0EBDD] rounded border border-[#222823] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#187653]" />
                <span>Export Bills</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv("expenses")}
                className="py-2 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#F0EBDD] rounded border border-[#222823] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#B69A62]" />
                <span>Export Expenses</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv("customers")}
                className="py-2 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#F0EBDD] rounded border border-[#222823] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#A6AAA3]" />
                <span>Export Customers</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv("products")}
                className="py-2 px-3 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#F0EBDD] rounded border border-[#222823] text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-[#A6AAA3]" />
                <span>Export Inventory</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
