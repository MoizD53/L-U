"use client";

import React, { useState } from "react";
import { Lock, User, AlertCircle } from "lucide-react";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";

interface Props {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both User ID and Password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center px-4 py-8 bg-[#090b10] text-zinc-100 select-none">
      <div />

      {/* Main Login Area */}
      <div className="w-full max-w-sm my-auto">
        {/* Brand Identity */}
        <div className="text-center mb-6">
          <div className="relative mx-auto w-32 h-32 mb-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Level Up Arena"
              className="w-full h-full object-contain rounded-2xl drop-shadow-[0_12px_30px_rgba(0,0,0,0.85)]"
            />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[#F0EBDD]">
            LEVEL UP
          </h1>
          <p className="text-[11px] text-[#A6AAA3] mt-1 font-semibold tracking-widest uppercase">
            Pool &amp; Snooker Arena &bull; Dahod
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#131714] border border-[#202722] rounded-2xl p-6 sm:p-7 shadow-2xl">
          <div className="mb-5">
            <h2 className="font-display text-lg font-semibold text-[#F0EBDD]">Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A6AAA3] mb-1.5">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B726B]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="levelup@dahod"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0E1210] border border-[#202722] focus:border-[#187653] focus:ring-1 focus:ring-[#187653]/30 rounded-xl text-sm text-[#F0EBDD] placeholder-[#6B726B] transition-colors outline-none"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A6AAA3] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B726B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0E1210] border border-[#202722] focus:border-[#187653] focus:ring-1 focus:ring-[#187653]/30 rounded-xl text-sm text-[#F0EBDD] placeholder-[#6B726B] transition-colors outline-none"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#187653] hover:bg-[#123B2C] active:bg-[#0F2F23] disabled:opacity-50 text-[#F0EBDD] font-medium text-sm rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer tracking-wide"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Install Level Up App button right here under the form */}
          <div className="mt-4 pt-4 border-t border-[#202722]">
            <PwaInstallButton variant="login" />
          </div>
        </div>
      </div>


      {/* Footer */}
      <footer className="w-full max-w-sm text-center pt-4">
        <p className="text-xs text-zinc-400">Level Up &bull; Dahod, Gujarat</p>
      </footer>
    </div>
  );
}


