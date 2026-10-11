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
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#202722] pb-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
            Player Directory &bull; Dahod
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight mt-0.5">
            Customer Credit &amp; History
          </h1>
          <p className="text-xs text-[#A6AAA3] mt-1">
            {customers.length} registered players &bull; Total outstanding credit:{" "}
            <span className="font-mono-numbers font-medium text-[#B69A62]">
              {formatRupees(totalOutstandingPaise)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onCollectUdhaar()}
            className="py-2.5 px-3.5 bg-[#131714] hover:bg-[#181E19] text-[#B69A62] border border-[#B69A62]/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-[#B69A62]" />
            <span>Collect Udhaar</span>
          </button>

          <button
            type="button"
            onClick={onAddCustomer}
            className="py-2.5 px-3.5 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B726B]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by player name or mobile number..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0E1210] border border-[#202722] focus:border-[#187653] focus:ring-1 focus:ring-[#187653]/30 rounded-xl text-xs text-[#F0EBDD] placeholder-[#6B726B] outline-none transition-colors"
        />
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => {
          const hasUdhaar = customer.outstanding_credit_paise > 0;

          return (
            <div
              key={customer.id}
              className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between ${
                hasUdhaar
                  ? "bg-[#131714] border-[#B69A62]/40"
                  : "bg-[#131714] border-[#202722]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-base text-[#F0EBDD]">{customer.name}</h3>
                    {customer.phone ? (
                      <div className="flex items-center gap-1 text-xs text-[#A6AAA3] mt-0.5">
                        <Phone className="w-3 h-3 text-[#187653]" />
                        <span className="font-mono-numbers">{customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#6B726B] mt-0.5 block">No mobile registered</span>
                    )}
                  </div>

                  {/* Udhaar Status */}
                  {hasUdhaar ? (
                    <div className="text-right">
                      <span className="text-[10px] text-[#B69A62] uppercase font-medium block">
                        Credit Baki:
                      </span>
                      <span className="font-mono-numbers text-base font-bold text-[#B69A62]">
                        {formatRupees(customer.outstanding_credit_paise)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#123B2C] text-[#F0EBDD] border border-[#187653]/40 font-medium">
                      Settled
                    </span>
                  )}
                </div>

                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-[#0E1210] rounded-xl border border-[#202722] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B726B] block">Pool</span>
                    <span className="font-mono-numbers font-medium text-[#F0EBDD]">{customer.pool_games_played || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B726B] block">Snooker</span>
                    <span className="font-mono-numbers font-medium text-[#F0EBDD]">{customer.snooker_games_played || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B726B] block">Total</span>
                    <span className="font-mono-numbers font-medium text-[#187653]">{customer.total_games_played || 0}</span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="text-xs text-[#A6AAA3] italic bg-[#0E1210] p-2 rounded-lg border border-[#202722]">
                    &quot;{customer.notes}&quot;
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(customer.id)}
                  className="flex-1 py-2 px-3 bg-[#0E1210] hover:bg-[#181E19] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#202722] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-[#6B726B]" />
                  <span>Ledger</span>
                </button>

                {hasUdhaar && (
                  <button
                    type="button"
                    onClick={() => onCollectUdhaar(customer)}
                    className="flex-1 py-2 px-3 bg-[#131714] hover:bg-[#181E19] text-[#B69A62] border border-[#B69A62]/40 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5 text-[#B69A62]" />
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
          <div className="bg-[#0B0D0C] border border-[#202722] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col text-[#F0EBDD] shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-[#202722] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
                  Player Ledger &bull; Dahod Arena
                </span>
                <h3 className="font-display text-lg font-bold text-[#F0EBDD]">
                  {customerDetail?.customer.name || "Customer Profile"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerDetail(null);
                }}
                className="text-[#A6AAA3] hover:text-[#F0EBDD] p-1 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {detailLoading || !customerDetail ? (
              <div className="p-12 text-center text-xs text-[#A6AAA3]">
                <div className="w-6 h-6 border-2 border-[#187653]/30 border-t-[#187653] rounded-full animate-spin mx-auto mb-2" />
                <span>Loading player records...</span>
              </div>
            ) : (
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {/* Balance Card */}
                <div className="p-4 bg-[#131714] rounded-xl border border-[#202722] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#A6AAA3]">Outstanding Balance (Udhaar):</span>
                    <div className="font-mono-numbers text-2xl font-bold text-[#B69A62]">
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
                      className="py-2 px-4 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-xl text-xs font-medium cursor-pointer transition-colors"
                    >
                      Collect Now
                    </button>
                  )}
                </div>

                {/* Sessions History */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#6B726B]">
                    Game Sessions History ({customerDetail.sessions.length})
                  </h4>
                  {customerDetail.sessions.length === 0 ? (
                    <div className="text-xs text-[#6B726B] py-2">No games recorded yet</div>
                  ) : (
                    customerDetail.sessions.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3 bg-[#131714] rounded-xl border border-[#202722] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-[#F0EBDD] flex items-center gap-1.5">
                            {s.table_type === "POOL" ? (
                              <CircleDot className="w-3.5 h-3.5 text-[#187653]" />
                            ) : (
                              <Trophy className="w-3.5 h-3.5 text-[#187653]" />
                            )}
                            <span>{s.table_name || "Game Session"}</span>
                          </div>
                          <div className="text-[11px] text-[#6B726B] mt-0.5">
                            {formatDateIST(s.start_time)}, {formatTimeIST(s.start_time)} &bull; {s.duration_minutes}m played
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono-numbers font-medium text-sm text-[#F0EBDD]">
                            {formatRupees(s.final_amount_paise)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Repayments History */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#6B726B]">
                    Payments &amp; Udhaar Repayments ({customerDetail.payments.length})
                  </h4>
                  {customerDetail.payments.length === 0 ? (
                    <div className="text-xs text-[#6B726B] py-2">No repayments recorded</div>
                  ) : (
                    customerDetail.payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 bg-[#131714] rounded-xl border border-[#202722] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-[#187653] uppercase text-[10px] block">
                            {p.payment_type.replace(/_/g, " ")} ({p.payment_method})
                          </span>
                          <span className="text-[11px] text-[#6B726B]">
                            {formatDateIST(p.created_at)}, {formatTimeIST(p.created_at)}
                          </span>
                        </div>
                        <span className="font-mono-numbers font-medium text-[#F0EBDD] text-sm">
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

