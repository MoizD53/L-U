"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Check, ShieldCheck, User, CircleDot, Trophy, DollarSign, X } from "lucide-react";
import { formatRupees, rupeesToPaise } from "@/lib/utils/money";
import type { UserRole } from "@/lib/types";

interface Props {
  userRole: UserRole;
}

export function SettingsView({ userRole }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Add Table Form State
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<"POOL" | "SNOOKER">("POOL");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [tableLoading, setTableLoading] = useState(false);

  // Edit Rate Plan State
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editHourlyRupees, setEditHourlyRupees] = useState("");
  const [editMinRupees, setEditMinRupees] = useState("");
  const [editIncrement, setEditIncrement] = useState("1");
  const [editRounding, setEditRounding] = useState("CEIL");
  const [planLoading, setPlanLoading] = useState(false);

  const fetchSettings = () => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    setTableLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_TABLE",
          payload: {
            name: newTableName.trim(),
            type: newTableType,
            ratePlanId: selectedPlanId || null,
          },
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setNewTableName("");
      setShowAddTable(false);
      fetchSettings();
    } catch {
      // error handling
    } finally {
      setTableLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setPlanLoading(true);

    try {
      const hourlyPaise = rupeesToPaise(editHourlyRupees || 0);
      const minPaise = rupeesToPaise(editMinRupees || 0);

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_RATE_PLAN",
          payload: {
            id: editingPlan.id,
            name: editingPlan.name,
            hourlyRatePaise: hourlyPaise,
            minimumChargePaise: minPaise,
            billingIncrementMinutes: parseInt(editIncrement, 10) || 1,
            roundingMode: editRounding,
          },
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      setEditingPlan(null);
      fetchSettings();
    } catch {
      // error handling
    } finally {
      setPlanLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-[#187653]/30 border-t-[#187653] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-[#222823] pb-5">
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#B69A62]">
          Arena Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F0EBDD] tracking-tight mt-1">
          Settings &amp; Tariff Configuration
        </h1>
        <p className="text-xs text-[#A6AAA3] mt-1 max-w-xl">
          Define table hourly tariffs, minimum game duration rules, rounding methods, and management permissions for Dahod arena.
        </p>
      </div>

      {/* Arena Profile Banner */}
      <div className="p-5 bg-[#131714] border border-[#222823] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-[#0B0D0C] border border-[#222823] p-1.5 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="Level Up Logo"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-[#F0EBDD]">LEVEL UP</h2>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#0B0D0C] text-[#B69A62] border border-[#222823] rounded font-mono font-medium">
                Dahod, Gujarat
              </span>
            </div>
            <p className="text-xs text-[#A6AAA3] mt-0.5">
              Premier Pool &amp; Snooker Lounge &middot; Base Currency: INR (₹ Paise)
            </p>
          </div>
        </div>

        <div className="text-xs text-[#A6AAA3] self-start sm:self-auto flex items-center gap-2 font-mono">
          <span>Active Role:</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#0B0D0C] text-[#187653] border border-[#222823] rounded font-bold">
            {userRole}
          </span>
        </div>
      </div>

      {/* Rate Plans Section */}
      <div className="bg-[#131714] border border-[#222823] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
          <div>
            <h3 className="font-serif font-bold text-[#F0EBDD] text-base">Tariff Rules &amp; Pricing</h3>
            <p className="text-xs text-[#A6AAA3]">
              Hourly rates, minimum play thresholds, and bill rounding logic
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.ratePlans.map((plan: any) => (
            <div
              key={plan.id}
              className="p-4 bg-[#0B0D0C] rounded-lg border border-[#222823] flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {plan.game_type === "POOL" ? (
                      <CircleDot className="w-3.5 h-3.5 text-[#187653]" />
                    ) : (
                      <Trophy className="w-3.5 h-3.5 text-[#B69A62]" />
                    )}
                    <h4 className="font-serif font-bold text-[#F0EBDD] text-sm">{plan.name}</h4>
                  </div>
                  <span className="text-[10px] text-[#A6AAA3] uppercase tracking-wider font-mono">
                    {plan.game_type} Table Standard
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block">Hourly Tariff</span>
                  <span className="text-base font-mono font-bold text-[#F0EBDD]">
                    {formatRupees(plan.hourly_rate_paise)}/hr
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#131714] rounded border border-[#222823] text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block">Min Charge</span>
                  <span className="font-mono font-semibold text-[#F0EBDD]">{formatRupees(plan.minimum_charge_paise)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block">Increment</span>
                  <span className="font-mono font-semibold text-[#F0EBDD]">{plan.billing_increment_minutes} min</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3] block">Rounding</span>
                  <span className="font-mono font-semibold text-[#F0EBDD]">{plan.rounding_mode}</span>
                </div>
              </div>

              {userRole === "OWNER" && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan(plan);
                    setEditHourlyRupees(String(plan.hourly_rate_paise / 100));
                    setEditMinRupees(String(plan.minimum_charge_paise / 100));
                    setEditIncrement(String(plan.billing_increment_minutes));
                    setEditRounding(plan.rounding_mode);
                  }}
                  className="py-1.5 px-3 bg-[#131714] hover:bg-[#1a201c] text-[#F0EBDD] border border-[#222823] rounded text-xs font-medium self-end transition-colors"
                >
                  Adjust Rates
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tables Configuration */}
      <div className="bg-[#131714] border border-[#222823] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
          <div>
            <h3 className="font-serif font-bold text-[#F0EBDD] text-base">Arena Tables</h3>
            <p className="text-xs text-[#A6AAA3]">Registered pool &amp; snooker tables in Dahod premises</p>
          </div>

          {userRole === "OWNER" && (
            <button
              type="button"
              onClick={() => setShowAddTable(!showAddTable)}
              className="py-2 px-3.5 bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#B69A62]" />
              <span>Add Table</span>
            </button>
          )}
        </div>

        {/* Add Table Form */}
        {showAddTable && (
          <form
            onSubmit={handleAddTable}
            className="p-4 bg-[#0B0D0C] rounded-lg border border-[#222823] space-y-3"
          >
            <span className="text-xs font-semibold text-[#F0EBDD] block">Configure New Arena Table</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Table Name (e.g. Pool Table 4)"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="px-3 py-2 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none"
                required
              />

              <select
                value={newTableType}
                onChange={(e) => setNewTableType(e.target.value as any)}
                className="px-3 py-2 bg-[#131714] border border-[#222823] rounded text-xs text-[#F0EBDD] outline-none"
              >
                <option value="POOL">Pool Table</option>
                <option value="SNOOKER">Snooker Table</option>
              </select>

              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="px-3 py-2 bg-[#131714] border border-[#222823] rounded text-xs text-[#F0EBDD] outline-none"
              >
                <option value="">-- Default Rate Plan --</option>
                {data.ratePlans
                  .filter((p: any) => p.game_type === newTableType)
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatRupees(p.hourly_rate_paise)}/hr)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddTable(false)}
                className="py-1.5 px-3 bg-[#131714] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823] rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={tableLoading}
                className="py-1.5 px-4 bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] rounded text-xs font-medium"
              >
                Save Table
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {data.tables.map((t: any) => (
            <div
              key={t.id}
              className="p-3.5 bg-[#0B0D0C] rounded-lg border border-[#222823] flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-[#F0EBDD] block">{t.name}</span>
                <span className="text-[10px] text-[#A6AAA3] font-mono">
                  {t.type} &middot; {t.rate_plan_name || `${t.type} Standard`}
                </span>
              </div>
              <span className="font-mono font-semibold text-[#F0EBDD]">
                {formatRupees(t.hourly_rate_paise || 20000)}/hr
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Accounts (Owner only) */}
      {userRole === "OWNER" && data.users && data.users.length > 0 && (
        <div className="bg-[#131714] border border-[#222823] rounded-lg p-5 space-y-4">
          <div className="pb-3 border-b border-[#222823]">
            <h3 className="font-serif font-bold text-[#F0EBDD] text-base">Arena Operators &amp; Access</h3>
            <p className="text-xs text-[#A6AAA3]">Authorized credentials configured for Level Up Dahod</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.users.map((u: any) => (
              <div
                key={u.id}
                className="p-3.5 bg-[#0B0D0C] rounded-lg border border-[#222823] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#131714] rounded border border-[#222823] text-[#A6AAA3]">
                    {u.role === "OWNER" ? (
                      <ShieldCheck className="w-4 h-4 text-[#B69A62]" />
                    ) : (
                      <User className="w-4 h-4 text-[#187653]" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-[#F0EBDD] block">{u.name}</span>
                    <span className="text-[10px] text-[#A6AAA3] font-mono">
                      Username: {u.username}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-[#131714] text-[#B69A62] border border-[#222823] font-medium">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Rate Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-sm w-full p-6 text-[#F0EBDD] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222823]">
              <h3 className="font-serif font-bold text-[#F0EBDD] text-base">Adjust {editingPlan.name}</h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-[#A6AAA3] hover:text-[#F0EBDD] p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                  Hourly Rate (₹):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editHourlyRupees}
                  onChange={(e) => setEditHourlyRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-sm text-[#F0EBDD] font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                  Minimum Charge (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editMinRupees}
                  onChange={(e) => setEditMinRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-sm text-[#F0EBDD] font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                  Billing Increment:
                </label>
                <select
                  value={editIncrement}
                  onChange={(e) => setEditIncrement(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] rounded text-xs text-[#F0EBDD] outline-none"
                >
                  <option value="1">1 minute (Continuous per-minute)</option>
                  <option value="15">15 minutes (Quarter-hour blocks)</option>
                  <option value="30">30 minutes (Half-hour blocks)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
                  Rounding Mode:
                </label>
                <select
                  value={editRounding}
                  onChange={(e) => setEditRounding(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] rounded text-xs text-[#F0EBDD] outline-none"
                >
                  <option value="CEIL">CEIL (Round up to nearest ₹1)</option>
                  <option value="ROUND">ROUND (Round to nearest ₹1)</option>
                  <option value="EXACT">EXACT (Exact paise)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="w-1/2 py-2 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823] rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={planLoading}
                  className="w-1/2 py-2 bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] rounded text-xs font-medium"
                >
                  Update Rates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
