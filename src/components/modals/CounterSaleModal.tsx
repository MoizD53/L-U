"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, Check, AlertCircle, DollarSign, Smartphone, Layers, User } from "lucide-react";
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
      <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Direct Counter Sale
            </span>
            <h3 className="text-lg font-black text-white">Sell Snacks, Drinks &amp; Cigarettes</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 text-xl font-bold"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Category Pills */}
        <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Product Items */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2">
            {filteredProducts.map((prod) => {
              const qty = cart[prod.id] || 0;
              const isOut = prod.current_stock <= 0;

              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    qty > 0
                      ? "bg-emerald-950/30 border-emerald-500/40"
                      : "bg-zinc-900/60 border-zinc-800/80"
                  } ${isOut ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">{prod.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      <span className="font-semibold text-emerald-400">
                        {formatRupees(prod.selling_price_paise)}
                      </span>
                      <span className="text-[11px] text-zinc-500 ml-1.5">
                        Stock: {prod.current_stock}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(prod.id, -1)}
                          className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-emerald-400">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(prod.id, 1)}
                          className="w-7 h-7 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prod.id, 1)}
                        disabled={isOut}
                        className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-600/40 text-emerald-300 rounded-lg text-xs font-bold"
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
          <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 space-y-3 shrink-0">
            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "CASH"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "UPI"
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> UPI
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 ${
                  paymentMethod === "CREDIT"
                    ? "bg-amber-600 text-white border-amber-500"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Udhaar
              </button>
            </div>

            {/* Optional Customer */}
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 rounded-lg text-xs text-white outline-none"
              required={paymentMethod === "CREDIT"}
            >
              <option value="">-- {paymentMethod === "CREDIT" ? "Select Customer (Required for Udhaar)" : "Optional Customer"} --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs text-zinc-400">Total Billed:</span>
                <div className="text-xl font-black text-white">
                  {formatRupees(finalAmountPaise)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-3 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cartCount === 0 || loading}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Collect &amp; Print Bill</span>
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
