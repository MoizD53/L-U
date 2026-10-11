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
    <header className="sticky top-0 z-30 h-16 bg-[#0a0d14]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Arena Location */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-950 p-0.5 shadow-md flex items-center justify-center ring-1 ring-emerald-500/30">
          <div className="w-full h-full bg-[#0b101a] rounded-[10px] flex items-center justify-center font-black text-sm text-emerald-400">
            LU
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-white tracking-tight">
              LEVEL <span className="text-emerald-400">UP</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded uppercase tracking-wider">
              Dahod
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            Pool &amp; Snooker Arena Management
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Active tables pulse badge */}
        {activeSessionsCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-600/40 rounded-full text-xs font-semibold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{activeSessionsCount} Table{activeSessionsCount > 1 ? "s" : ""} Live</span>
          </div>
        )}

        {/* Live Network status */}
        <OnlineOfflineBadge />

        {/* PWA Install Button */}
        <PwaInstallButton variant="header" />

        {/* Staff Role Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs">
          {user.role === "OWNER" ? (
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <User className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-medium text-zinc-200">{user.name}</span>
          <span className="text-[10px] uppercase font-bold text-zinc-400">({user.role})</span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Sign Out"
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/80 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
