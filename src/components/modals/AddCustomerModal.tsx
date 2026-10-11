"use client";

import React, { useState } from "react";
import { UserPlus, AlertCircle, Check, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter player full name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register player");
      }

      setName("");
      setPhone("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create player profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-sm w-full p-6 text-[#F0EBDD] shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#222823]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Player Directory &amp; Membership
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
              Enroll Arena Player
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#A6AAA3] hover:text-[#F0EBDD] p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Player Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Mohit Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#A6AAA3] mb-1.5">
              Preferences / Group Info (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Regular pool member, Dahod Club"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D0C] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] placeholder-[#A6AAA3]/50 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-[#0B0D0C] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823] rounded font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-[#187653] hover:bg-[#1f8c63] disabled:opacity-40 text-[#F0EBDD] rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#B69A62]" />
                  <span>Register</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
