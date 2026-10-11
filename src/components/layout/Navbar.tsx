"use client";

import React from "react";
import { LogOut, ShieldCheck, User } from "lucide-react";
import { OnlineOfflineBadge } from "@/components/pwa/OnlineOfflineBadge";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import type { UserSession } from "@/lib/types";

interface Props {
  user: UserSession;
  activeSessionsCount: number;
  onLogout: () => void;
}

export function Navbar({ user, activeSessionsCount, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0D0C] border-b border-[#202722] px-4 sm:px-6 flex items-center justify-between select-none">
      {/* Brand & Arena Location */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#131714] border border-[#202722] flex items-center justify-center overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Level Up"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-base text-[#F0EBDD] tracking-wide">
              LEVEL UP
            </span>
            <span className="text-[10px] text-[#A6AAA3] font-medium tracking-widest uppercase">
              Dahod
            </span>
          </div>
          <p className="text-[10px] text-[#6B726B] font-medium tracking-wider uppercase hidden sm:block">
            Billiards &amp; Snooker Lounge
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active tables indicator */}
        {activeSessionsCount > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#123B2C]/50 border border-[#187653]/40 rounded-lg text-xs text-[#F0EBDD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#187653]" />
            <span className="font-mono-numbers text-xs font-medium">{activeSessionsCount}</span>
            <span className="text-[#A6AAA3] text-[11px] hidden sm:inline">Active</span>
          </div>
        )}

        {/* Live Network status */}
        <OnlineOfflineBadge />

        {/* PWA Install Button */}
        <PwaInstallButton variant="header" />

        {/* Staff Identity */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#202722] text-xs">
          <div className="w-7 h-7 rounded-lg bg-[#131714] border border-[#202722] flex items-center justify-center text-[#B69A62]">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-[#F0EBDD] leading-tight text-xs">{user.name}</span>
            <span className="text-[9px] uppercase tracking-wider text-[#A6AAA3] font-semibold">{user.role}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Sign Out"
          className="p-2 text-[#A6AAA3] hover:text-[#F0EBDD] hover:bg-[#131714] border border-transparent hover:border-[#202722] rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

