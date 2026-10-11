"use client";

import React from "react";
import {
  LayoutDashboard,
  CircleDot,
  Trophy,
  Users,
  ShoppingBag,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export type TabId =
  | "home"
  | "pool"
  | "snooker"
  | "customers"
  | "shop"
  | "expenses"
  | "reports"
  | "settings";

interface Props {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  userRole: UserRole;
  activePoolCount: number;
  activeSnookerCount: number;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  userRole,
  activePoolCount,
  activeSnookerCount,
}: Props) {
  const navItems = [
    { id: "home" as TabId, label: "Home", sublabel: "Today's Overview", icon: LayoutDashboard },
    {
      id: "pool" as TabId,
      label: "Pool Tables",
      sublabel: "3 Tables",
      icon: CircleDot,
      badge: activePoolCount > 0 ? `${activePoolCount} Live` : undefined,
    },
    {
      id: "snooker" as TabId,
      label: "Snooker Tables",
      sublabel: "2 Pro Tables",
      icon: Trophy,
      badge: activeSnookerCount > 0 ? `${activeSnookerCount} Live` : undefined,
    },
    { id: "customers" as TabId, label: "Customers", sublabel: "Udhaar & History", icon: Users },
    { id: "shop" as TabId, label: "Shop / Counter", sublabel: "Snacks & Drinks", icon: ShoppingBag },
    { id: "expenses" as TabId, label: "Expenses", sublabel: "Salaries & Bills", icon: Receipt },
    { id: "reports" as TabId, label: "Analysis & Reports", sublabel: "Daily / Monthly", icon: BarChart3 },
    { id: "settings" as TabId, label: "Settings", sublabel: "Rates & Tables", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0d14] border-r border-zinc-800/80 p-4 hidden lg:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Arena Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? "bg-emerald-600/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                    isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                <div>
                  <div className="text-sm leading-tight">{item.label}</div>
                  <div className="text-[11px] text-zinc-400 font-normal">{item.sublabel}</div>
                </div>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Arena Shift Badge */}
      <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-xs">
        <div className="flex items-center justify-between font-semibold text-zinc-300 mb-1">
          <span>Dahod Arena</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800/40">
            Active
          </span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Role: <strong className="text-white">{userRole}</strong>
        </p>
      </div>
    </aside>
  );
}
