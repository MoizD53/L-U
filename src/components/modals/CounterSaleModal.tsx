"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, Check, AlertCircle, DollarSign, Smartphone, Layers, User, X } from "lucide-react";
import { formatRupees, rupeesToPaise } from "@/lib/utils/money";
import type { ProductItem, PaymentMethod, CustomerItem } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CounterSaleModal({ isOpen, onClose, onSuccess }: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [discountRupees, setDiscountRupees] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
      ]).then(([prodRes, custRes]) => {
        if (prodRes.success) setProducts(prodRes.data);
        if (custRes.success) setCustomers(custRes.data);
      });
      setCart({});
      setPaymentMethod("CASH");
      setSelectedCustomerId("");
      setDiscountRupees("0");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ["ALL", "Cold drinks", "Chips", "Cigarettes", "Biscuits", "Other"];

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === "ALL") return true;
    return p.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  const handleUpdateQty = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      if (next > prod.current_stock) {
        setError(`Only ${prod.current_stock} of "${prod.name}" available in stock`);
        return prev;
      }
      setError(null);
      return { ...prev, [productId]: next };
    });
  };

  const cartTotalPaise = Object.entries(cart).reduce((sum, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return sum + (prod ? prod.selling_price_paise * qty : 0);
  }, 0);

  const discountPaise = rupeesToPaise(discountRupees || 0);
  const finalAmountPaise = Math.max(0, cartTotalPaise - discountPaise);
  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartCount === 0) {
      setError("Please select at least one product to purchase");
      return;
    }

    if (paymentMethod === "CREDIT" && !selectedCustomerId) {
      setError("Please select a registered customer for Udhaar sale");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const itemsPayload = Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      const res = await fetch("/api/shop/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload,
          paymentMethod,
          discountPaise,
          customerId: selectedCustomerId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record sale");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-xl w-full max-h-[92vh] flex flex-col text-[#F0EBDD] shadow-2xl">
        <div className="p-5 border-b border-[#222823] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Retail POS &amp; Counter Dispatch
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
              Direct Lounge Counter Sale
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
          <div className="mx-5 mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded text-xs text-rose-300 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Category Pills */}
        <div className="px-5 py-2.5 border-b border-[#222823] flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-[#187653] text-[#F0EBDD] font-semibold shadow-sm"
                  : "bg-[#0B0D0C] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Product Items */}
          <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
            {filteredProducts.map((prod) => {
              const qty = cart[prod.id] || 0;
              const isOut = prod.current_stock <= 0;

              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                    qty > 0
                      ? "bg-[#123B2C]/30 border-[#187653]/60"
                      : "bg-[#0B0D0C] border-[#222823]"
                  } ${isOut ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div>
                    <div className="font-semibold text-sm text-[#F0EBDD]">{prod.name}</div>
                    <div className="text-xs text-[#A6AAA3] mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono font-medium text-[#F0EBDD]">
                        {formatRupees(prod.selling_price_paise)}
                      </span>
                      <span className="text-[11px] text-[#A6AAA3]">&middot; Stock: {prod.current_stock}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 ? (
                      <div className="flex items-center gap-1.5 bg-[#131714] border border-[#222823] rounded p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(prod.id, -1)}
                          className="w-6 h-6 rounded bg-[#0B0D0C] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] flex items-center justify-center font-bold active:scale-95"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-[#F0EBDD]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(prod.id, 1)}
                          className="w-6 h-6 rounded bg-[#187653] hover:bg-[#1f8c63] text-[#F0EBDD] flex items-center justify-center font-bold active:scale-95"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prod.id, 1)}
                        disabled={isOut}
                        className="px-3 py-1 bg-[#131714] hover:bg-[#1a201c] border border-[#222823] text-[#F0EBDD] rounded text-xs font-medium transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checkout Controls */}
          <div className="p-4 bg-[#0B0D0C] border-t border-[#222823] space-y-3 shrink-0">
            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "CASH"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#131714] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "UPI"
                    ? "bg-[#187653] text-[#F0EBDD] border-[#187653] font-semibold"
                    : "bg-[#131714] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> UPI
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT")}
                className={`py-2 px-3 rounded border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === "CREDIT"
                    ? "bg-[#B69A62] text-[#0B0D0C] border-[#B69A62] font-semibold"
                    : "bg-[#131714] text-[#A6AAA3] border-[#222823] hover:text-[#F0EBDD]"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Udhaar
              </button>
            </div>

            {/* Optional Customer */}
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-[#131714] border border-[#222823] focus:border-[#187653] rounded text-xs text-[#F0EBDD] outline-none"
              required={paymentMethod === "CREDIT"}
            >
              <option value="">-- {paymentMethod === "CREDIT" ? "Select Player (Required for Udhaar ledger)" : "Optional Player Account"} --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A6AAA3]">Total Payable:</span>
                <div className="text-xl font-mono font-bold text-[#F0EBDD]">
                  {formatRupees(finalAmountPaise)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-3 bg-[#131714] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#222823] rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cartCount === 0 || loading}
                  className="py-2.5 px-4 bg-[#187653] hover:bg-[#1f8c63] disabled:opacity-40 text-[#F0EBDD] font-medium text-xs rounded transition-colors flex items-center gap-1.5"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#B69A62]" />
                      <span>Collect &amp; Record Sale</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
