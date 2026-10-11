"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  CircleDot,
  Trophy,
  ShoppingBag,
  Menu,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Lock,
} from "lucide-react";
import type { TabId } from "./Sidebar";

interface Props {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  activePoolCount: number;
  activeSnookerCount: number;
  onOpenClosingModal: () => void;
}

export function MobileNav({
  currentTab,
  onSelectTab,
  activePoolCount,
  activeSnookerCount,
  onOpenClosingModal,
}: Props) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleSelect = (tab: TabId) => {
    onSelectTab(tab);
    setShowMoreMenu(false);
  };

  const moreItems = [
    { id: "customers" as TabId, label: "Customers & Udhaar", desc: "Player balance & repayments", icon: Users },
    { id: "expenses" as TabId, label: "Expenses", desc: "Salaries, rent & utilities", icon: Receipt },
    { id: "reports" as TabId, label: "Reports & Analysis", desc: "Daily & monthly accounting", icon: BarChart3 },
    { id: "settings" as TabId, label: "Arena Settings", desc: "Hourly rates & table setup", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Fixed Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-zinc-800/90 px-2 py-2 safe-bottom shadow-2xl">
        <div className="grid grid-cols-5 items-center justify-around gap-1">
          {/* Home */}
          <button
            type="button"
            onClick={() => handleSelect("home")}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              currentTab === "home"
                ? "text-emerald-400 bg-emerald-950/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* Pool */}
          <button
            type="button"
            onClick={() => handleSelect("pool")}
            className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              currentTab === "pool"
                ? "text-emerald-400 bg-emerald-950/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {activePoolCount > 0 && (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
            <CircleDot className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Pool</span>
          </button>

          {/* Snooker */}
          <button
            type="button"
            onClick={() => handleSelect("snooker")}
            className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              currentTab === "snooker"
                ? "text-emerald-400 bg-emerald-950/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {activeSnookerCount > 0 && (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Snooker</span>
          </button>

          {/* Shop */}
          <button
            type="button"
            onClick={() => handleSelect("shop")}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              currentTab === "shop"
                ? "text-emerald-400 bg-emerald-950/40 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Shop</span>
          </button>

          {/* More Menu */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
              showMoreMenu || ["customers", "expenses", "reports", "settings"].includes(currentTab)
                ? "text-amber-400 bg-amber-950/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal for Mobile */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#101522] border-t border-zinc-800 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base">Arena Navigation</h3>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="text-zinc-400 hover:text-white p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Quick Closing Button */}
            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(false);
                onOpenClosingModal();
              }}
              className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-500/40 rounded-xl text-left text-amber-200 font-bold"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm">Close Today&apos;s Hisab</div>
                  <div className="text-[11px] text-amber-400/80 font-normal">Daily cash drawer balance check</div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded">
                Close
              </span>
            </button>

            <div className="space-y-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? "bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40"
                        : "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/80 border border-zinc-800"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-sm">{item.label}</div>
                      <div className="text-[11px] text-zinc-400">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
