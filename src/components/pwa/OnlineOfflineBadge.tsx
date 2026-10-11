"use client";

import React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { usePwaInstall } from "@/lib/hooks/usePwaInstall";

export function OnlineOfflineBadge() {
  const { isOnline } = usePwaInstall();

  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-full text-xs text-emerald-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline">Online</span>
        <Wifi className="w-3 h-3 sm:hidden" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-600/50 rounded-full text-xs text-amber-300 font-medium animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline (Cached)</span>
    </div>
  );
}
