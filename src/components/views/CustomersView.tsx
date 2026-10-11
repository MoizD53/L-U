"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Coins,
  History,
  Phone,
  Clock,
  CircleDot,
  Trophy,
} from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import { formatDateIST, formatTimeIST } from "@/lib/utils/date";
import type { CustomerItem } from "@/lib/types";

interface Props {
  onAddCustomer: () => void;
  onCollectUdhaar: (customer?: CustomerItem) => void;
}

export function CustomersView({ onAddCustomer, onCollectUdhaar }: Props) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{
    customer: CustomerItem;
    sessions: any[];
    bills: any[];
    payments: any[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = () => {
    fetch(`/api/customers?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCustomers(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delay = setTimeout(fetchCustomers, 250);
    return () => clearTimeout(delay);
  }, [search]);

  const handleOpenDetail = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (data.success) {
        setCustomerDetail(data.data);
      }
    } catch {
      // error handling
    } finally {
      setDetailLoading(false);
    }
  };

  const totalOutstandingPaise = customers.reduce(
    (sum, c) => sum + (c.outstanding_credit_paise || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Records &amp; Udhaar
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {customers.length} registered arena players &bull; Total arena udhaar:{" "}
            <strong className="text-amber-400 font-mono">
              {formatRupees(totalOutstandingPaise)}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onCollectUdhaar()}
            className="py-2.5 px-4 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Collect Udhaar</span>
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or mobile number..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f1420] border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none"
        />
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => {
          const hasUdhaar = customer.outstanding_credit_paise > 0;

          return (
            <div
              key={customer.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                hasUdhaar
                  ? "bg-[#111624] border-amber-600/40 shadow-lg shadow-amber-950/20"
                  : "bg-[#0f1420] border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">{customer.name}</h3>
                    {customer.phone ? (
                      <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>{customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500 mt-0.5 block">No mobile saved</span>
                    )}
                  </div>

                  {/* Udhaar Status */}
                  {hasUdhaar ? (
                    <div className="text-right">
                      <span className="text-[10px] text-amber-400 uppercase font-bold block">
                        Udhaar Baki:
                      </span>
                      <span className="text-base font-black text-amber-300 font-mono">
                        {formatRupees(customer.outstanding_credit_paise)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
                      Settled
                    </span>
                  )}
                </div>

                {/* Game & Visit Stats */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/70 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Pool</span>
                    <span className="font-bold text-white font-mono">{customer.pool_games_played || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Snooker</span>
                    <span className="font-bold text-white font-mono">{customer.snooker_games_played || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Total Games</span>
                    <span className="font-bold text-emerald-400 font-mono">{customer.total_games_played || 0}</span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="text-xs text-zinc-400 italic bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                    &quot;{customer.notes}&quot;
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(customer.id)}
                  className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <span>History</span>
                </button>

                {hasUdhaar && (
                  <button
                    type="button"
                    onClick={() => onCollectUdhaar(customer)}
                    className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Collect</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail History Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Player Ledger &amp; History
                </span>
                <h3 className="text-lg font-black text-white">
                  {customerDetail?.customer.name || "Customer Profile"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="text-zinc-400 hover:text-white p-1 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {detailLoading || !customerDetail ? (
              <div className="p-12 text-center text-xs text-zinc-400">
                <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                <span>Loading player records...</span>
              </div>
            ) : (
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {/* Balance Card */}
                <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400">Outstanding Balance (Udhaar):</span>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {formatRupees(customerDetail.customer.outstanding_credit_paise)}
                    </div>
                  </div>
                  {customerDetail.customer.outstanding_credit_paise > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const cust = customerDetail.customer;
                        setSelectedCustomerId(null);
                        setCustomerDetail(null);
                        onCollectUdhaar(cust);
                      }}
                      className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                    >
                      Collect Now
                    </button>
                  )}
                </div>

                {/* Sessions History */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Game Sessions History ({customerDetail.sessions.length})
                  </h4>
                  {customerDetail.sessions.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-2">No games recorded yet</div>
                  ) : (
                    customerDetail.sessions.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {s.table_type === "POOL" ? (
                              <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>{s.table_name || "Game Session"}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {formatDateIST(s.start_time)}, {formatTimeIST(s.start_time)} &bull; {s.duration_minutes}m played
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-white font-mono">
                            {formatRupees(s.final_amount_paise)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Repayments History */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Payments &amp; Udhaar Repayments ({customerDetail.payments.length})
                  </h4>
                  {customerDetail.payments.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-2">No repayments recorded</div>
                  ) : (
                    customerDetail.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-emerald-400 uppercase text-[10px] block">
                            {p.payment_type.replace(/_/g, " ")} ({p.payment_method})
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {formatDateIST(p.created_at)}, {formatTimeIST(p.created_at)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white text-sm">
                          {formatRupees(p.total_amount_paise)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
