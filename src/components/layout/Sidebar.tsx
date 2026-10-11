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

interface NavItem {
  id: TabId;
  label: string;
  icon: any;
  badge?: string;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  userRole,
  activePoolCount,
  activeSnookerCount,
}: Props) {
  const operationsGroup: NavItem[] = [
    { id: "home", label: "Overview", icon: LayoutDashboard },
    {
      id: "pool",
      label: "Pool Tables",
      icon: CircleDot,
      badge: activePoolCount > 0 ? `${activePoolCount}` : undefined,
    },
    {
      id: "snooker",
      label: "Snooker Tables",
      icon: Trophy,
      badge: activeSnookerCount > 0 ? `${activeSnookerCount}` : undefined,
    },
    { id: "shop", label: "Shop & Counter", icon: ShoppingBag },
  ];

  const financialGroup: NavItem[] = [
    { id: "customers", label: "Customers & Udhaar", icon: Users },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "reports", label: "Reports & Ledger", icon: BarChart3 },
  ];

  const systemGroup: NavItem[] = [
    { id: "settings", label: "Settings & Rates", icon: Settings },
  ];

  const renderGroup = (title: string, items: NavItem[]) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-[#6B726B] uppercase">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors relative cursor-pointer ${
                isActive
                  ? "bg-[#131714] text-[#F0EBDD] font-medium"
                  : "text-[#A6AAA3] hover:text-[#F0EBDD] hover:bg-[#131714]/60 font-normal"
              }`}
            >
              {/* Subtle active vertical indicator */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#187653] rounded-r" />
              )}

              <div className="flex items-center gap-2.5 pl-1">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-[#187653]" : "text-[#6B726B]"
                  }`}
                />
                <span className="text-xs tracking-wide">{item.label}</span>
              </div>

              {item.badge && (
                <span className="font-mono-numbers text-[10px] px-1.5 py-0.2 rounded bg-[#123B2C] text-[#F0EBDD] border border-[#187653]/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-56 bg-[#0B0D0C] border-r border-[#202722] p-3 hidden lg:flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <nav className="pt-2">
        {renderGroup("Arena Operations", operationsGroup)}
        {renderGroup("Financials & Clients", financialGroup)}
        {renderGroup("System", systemGroup)}
      </nav>

      {/* Arena Shift Status */}
      <div className="p-3 bg-[#131714] rounded-xl border border-[#202722] text-xs">
        <div className="flex items-center justify-between text-[#A6AAA3] mb-1">
          <span className="text-[11px] font-medium">Session Status</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#187653] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#187653]" />
            Live
          </span>
        </div>
        <p className="text-[11px] text-[#6B726B]">
          Signed in as <span className="text-[#F0EBDD] font-medium">{userRole}</span>
        </p>
      </div>
    </aside>
  );
}

