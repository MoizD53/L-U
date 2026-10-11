"use client";

import React, { useState } from "react";
import { Lock, User, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
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

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#080b11] relative overflow-hidden">
      {/* Background Decorative Billiards Table Geometry */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 p-0.5 shadow-2xl shadow-emerald-950/60 mb-4 ring-1 ring-emerald-500/30">
            <div className="w-full h-full bg-[#0b101a] rounded-[22px] flex flex-col items-center justify-center">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-0.5">
                <span className="text-emerald-400">LU</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-amber-400 uppercase">Dahod</span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">
            LEVEL <span className="text-emerald-400">UP</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
            Pool &amp; Snooker Arena
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Arena Business Management</span>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-[#0f1420]/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-1">Staff Sign In</h2>
            <p className="text-xs text-zinc-400">Enter your arena operator ID and password</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                User / Business ID
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
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0d14] border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
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
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0d14] border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-500 transition-all outline-none"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Login (Arena Operators):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("owner", "admin123")}
                className="py-2 px-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-emerald-400">
                  <span>Owner</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-[10px] text-zinc-500">Full Access</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("manager", "manager123")}
                className="py-2 px-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-emerald-400">
                  <span>Manager</span>
                  <User className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-[10px] text-zinc-500">Shift Operations</div>
              </button>
            </div>
          </div>

          {/* PWA Install Button on Login Page */}
          <div className="mt-5 pt-4 border-t border-zinc-800/60">
            <PwaInstallButton variant="login" />
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-zinc-500">
          <p>Level Up Arena &bull; Dahod, Gujarat, India</p>
          <p className="text-[10px] mt-1 text-zinc-600">All data encrypted and saved locally in secure libSQL database</p>
        </div>
      </div>
    </div>
  );
}
