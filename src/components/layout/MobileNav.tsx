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
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0B0D0C]/95 backdrop-blur-md border-t border-[#202722] px-2 py-1.5 safe-bottom select-none">
        <div className="grid grid-cols-5 items-center justify-around gap-1">
          {/* Home */}
          <button
            type="button"
            onClick={() => handleSelect("home")}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
              currentTab === "home"
                ? "text-[#F0EBDD] font-medium"
                : "text-[#A6AAA3] hover:text-[#F0EBDD]"
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 mb-1 ${currentTab === "home" ? "text-[#187653]" : "text-[#6B726B]"}`} />
            <span className="text-[10px] tracking-wide">Home</span>
          </button>

          {/* Pool */}
          <button
            type="button"
            onClick={() => handleSelect("pool")}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
              currentTab === "pool"
                ? "text-[#F0EBDD] font-medium"
                : "text-[#A6AAA3] hover:text-[#F0EBDD]"
            }`}
          >
            {activePoolCount > 0 && (
              <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#187653]" />
            )}
            <CircleDot className={`w-4 h-4 mb-1 ${currentTab === "pool" ? "text-[#187653]" : "text-[#6B726B]"}`} />
            <span className="text-[10px] tracking-wide">Pool</span>
          </button>

          {/* Snooker */}
          <button
            type="button"
            onClick={() => handleSelect("snooker")}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
              currentTab === "snooker"
                ? "text-[#F0EBDD] font-medium"
                : "text-[#A6AAA3] hover:text-[#F0EBDD]"
            }`}
          >
            {activeSnookerCount > 0 && (
              <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-[#187653]" />
            )}
            <Trophy className={`w-4 h-4 mb-1 ${currentTab === "snooker" ? "text-[#187653]" : "text-[#6B726B]"}`} />
            <span className="text-[10px] tracking-wide">Snooker</span>
          </button>

          {/* Shop */}
          <button
            type="button"
            onClick={() => handleSelect("shop")}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
              currentTab === "shop"
                ? "text-[#F0EBDD] font-medium"
                : "text-[#A6AAA3] hover:text-[#F0EBDD]"
            }`}
          >
            <ShoppingBag className={`w-4 h-4 mb-1 ${currentTab === "shop" ? "text-[#187653]" : "text-[#6B726B]"}`} />
            <span className="text-[10px] tracking-wide">Shop</span>
          </button>

          {/* More Menu */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors cursor-pointer ${
              showMoreMenu || ["customers", "expenses", "reports", "settings"].includes(currentTab)
                ? "text-[#F0EBDD] font-medium"
                : "text-[#A6AAA3] hover:text-[#F0EBDD]"
            }`}
          >
            <Menu className={`w-4 h-4 mb-1 ${["customers", "expenses", "reports", "settings"].includes(currentTab) ? "text-[#B69A62]" : "text-[#6B726B]"}`} />
            <span className="text-[10px] tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Modal for Mobile */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#0B0D0C] border-t border-[#202722] rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#202722]">
              <h3 className="font-display font-semibold text-[#F0EBDD] text-base">Arena Navigation</h3>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="text-[#A6AAA3] hover:text-[#F0EBDD] p-1 text-lg font-bold"
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
              className="w-full flex items-center justify-between p-3 bg-[#131714] border border-[#B69A62]/30 rounded-xl text-left text-[#F0EBDD] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#B69A62]/10 rounded-lg text-[#B69A62]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Daily Hisab Closing</div>
                  <div className="text-[10px] text-[#A6AAA3]">Cash drawer reconciliation</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#B69A62]/20 text-[#B69A62] rounded">
                Close
              </span>
            </button>

            <div className="space-y-1.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#131714] text-[#F0EBDD] font-medium border border-[#187653]/40"
                        : "bg-[#131714]/60 text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#202722]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#187653] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-[#F0EBDD]">{item.label}</div>
                      <div className="text-[10px] text-[#6B726B]">{item.desc}</div>
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

