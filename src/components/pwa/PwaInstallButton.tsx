"use client";

import React, { useState } from "react";
import { Download, CheckCircle, Share, Smartphone, Info } from "lucide-react";
import { usePwaInstall } from "@/lib/hooks/usePwaInstall";

interface Props {
  variant?: "header" | "login" | "card";
}

export function PwaInstallButton({ variant = "header" }: Props) {
  const { isInstallable, isInstalled, isIos, promptInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed and running standalone:
  if (isInstalled) {
    if (variant === "login") {
      return (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-full font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>App Installed on Device</span>
        </div>
      );
    }
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/30 rounded-full font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Installed</span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      await promptInstall();
    } else {
      setShowModal(true);
    }
  };

  const buttonClasses =
    variant === "login"
      ? "w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-emerald-700/20 hover:bg-emerald-700/30 text-emerald-300 hover:text-emerald-200 border border-emerald-600/40 hover:border-emerald-500 rounded-xl font-medium text-sm transition-all shadow-sm active:scale-[0.99]"
      : variant === "card"
      ? "flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-all shadow-md active:scale-95"
      : "flex items-center gap-2 px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-600/40 rounded-lg text-xs font-semibold transition-all active:scale-95";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={buttonClasses}
        aria-label="Install Level Up PWA"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>Install Level Up App</span>
      </button>

      {/* Instructional Modal when browser prompt is not directly available (e.g. iOS or desktop Chrome menu) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-emerald-700/40 rounded-2xl max-w-sm w-full p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Install Level Up</h3>
                  <p className="text-xs text-zinc-400">Add to Home Screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-zinc-300">
              {isIos ? (
                <>
                  <p className="text-zinc-200">
                    To install on your iPhone or iPad:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <span>1. Tap the</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200 font-medium">
                        <Share className="w-3 h-3 text-emerald-400" /> Share
                      </span>
                      <span>button in Safari toolbar</span>
                    </li>
                    <li>2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                    <li>3. Tap <strong>&quot;Add&quot;</strong> in the top-right corner</li>
                  </ol>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-xs bg-zinc-800/80 p-3 rounded-lg border border-zinc-700/50">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>
                      In Chrome/Edge: Click the install icon in the URL address bar or open the 3-dot browser menu and select <strong>&quot;Install Level Up...&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
