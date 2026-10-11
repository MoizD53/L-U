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
          <div className="relative mx-auto w-28 h-28 mb-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Level Up Arena"
              className="w-full h-full object-contain rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            LEVEL UP
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium tracking-wide">
            Pool &amp; Snooker Lounge &bull; Dahod
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0e121a] border border-zinc-800/80 rounded-2xl p-6 sm:p-7 shadow-2xl">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. owner or manager"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#090b10] border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 transition-colors outline-none"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#090b10] border border-zinc-800 focus:border-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 transition-colors outline-none"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Install Level Up App button right here under the form */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
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


