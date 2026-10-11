"use client";

import React, { useState, useEffect } from "react";
import { Plus, Check, ShieldCheck, User, CircleDot, Trophy, DollarSign } from "lucide-react";
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
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Arena Setup &amp; Pricing
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure pool &amp; snooker table rates, minimum charges, increment rules &amp; staff permissions
        </p>
      </div>

      {/* Arena Profile Banner */}
      <div className="p-5 bg-[#0f1420] border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-lg">
            LU
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">LEVEL UP</h2>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase font-bold">
                Dahod, Gujarat
              </span>
            </div>
            <p className="text-xs text-zinc-400">Pool &amp; Snooker Arena &bull; Currency: INR (₹ Paise)</p>
          </div>
        </div>

        <div className="text-xs text-zinc-400 self-start sm:self-auto">
          Logged in role: <strong className="text-white uppercase">{userRole}</strong>
        </div>
      </div>

      {/* Rate Plans Section */}
      <div className="bg-[#0f1420] border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-white text-base">Rate Plans &amp; Billing Rules</h3>
            <p className="text-xs text-zinc-400">
              Pricing per hour, minimum play charges &amp; rounding rules
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.ratePlans.map((plan: any) => (
            <div
              key={plan.id}
              className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {plan.game_type === "POOL" ? (
                      <CircleDot className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Trophy className="w-4 h-4 text-emerald-400" />
                    )}
                    <h4 className="font-bold text-white text-sm">{plan.name}</h4>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                    {plan.game_type} Table Plan
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">Hourly Rate:</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatRupees(plan.hourly_rate_paise)}/hr
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-800/60 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Min Charge</span>
                  <span className="font-bold text-white">{formatRupees(plan.minimum_charge_paise)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Increment</span>
                  <span className="font-bold text-white">{plan.billing_increment_minutes} min</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Rounding</span>
                  <span className="font-bold text-white">{plan.rounding_mode}</span>
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
                  className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-semibold self-end"
                >
                  Edit Rates
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tables Configuration */}
      <div className="bg-[#0f1420] border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-white text-base">Arena Tables</h3>
            <p className="text-xs text-zinc-400">Configured pool &amp; snooker tables in Dahod arena</p>
          </div>

          {userRole === "OWNER" && (
            <button
              type="button"
              onClick={() => setShowAddTable(!showAddTable)}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Table</span>
            </button>
          )}
        </div>

        {/* Add Table Form */}
        {showAddTable && (
          <form
            onSubmit={handleAddTable}
            className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-3"
          >
            <span className="text-xs font-bold text-white block">Add New Arena Table</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Table Name (e.g. Pool Table 4)"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-lg text-xs text-white outline-none"
                required
              />

              <select
                value={newTableType}
                onChange={(e) => setNewTableType(e.target.value as any)}
                className="px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
              >
                <option value="POOL">Pool Table</option>
                <option value="SNOOKER">Snooker Table</option>
              </select>

              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
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

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTable(false)}
                className="py-1.5 px-3 bg-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={tableLoading}
                className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
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
              className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white block">{t.name}</span>
                <span className="text-[10px] text-zinc-400">
                  {t.type} &bull; {t.rate_plan_name || `${t.type} Standard`}
                </span>
              </div>
              <span className="font-mono font-semibold text-emerald-400">
                {formatRupees(t.hourly_rate_paise || 20000)}/hr
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Users (Owner only) */}
      {userRole === "OWNER" && data.users && data.users.length > 0 && (
        <div className="bg-[#0f1420] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-white text-base">Arena Operators &amp; Accounts</h3>
            <p className="text-xs text-zinc-400">Active credentials configured for Level Up Dahod</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.users.map((u: any) => (
              <div
                key={u.id}
                className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
                    {u.role === "OWNER" ? (
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                    ) : (
                      <User className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Username: {u.username}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
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
          <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base">Edit {editingPlan.name}</h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-zinc-400 hover:text-white p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Hourly Rate (₹):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editHourlyRupees}
                  onChange={(e) => setEditHourlyRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-sm text-white font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Minimum Charge (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editMinRupees}
                  onChange={(e) => setEditMinRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Billing Increment (Minutes):
                </label>
                <select
                  value={editIncrement}
                  onChange={(e) => setEditIncrement(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
                >
                  <option value="1">1 minute (Continuous per-minute)</option>
                  <option value="15">15 minutes (Quarter-hour blocks)</option>
                  <option value="30">30 minutes (Half-hour blocks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Rounding Mode:
                </label>
                <select
                  value={editRounding}
                  onChange={(e) => setEditRounding(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
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
                  className="w-1/2 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={planLoading}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
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
