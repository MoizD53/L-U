"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart, Check, AlertCircle } from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import type { GameSessionItem, ProductItem } from "@/lib/types";

interface Props {
  session: GameSessionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemsModal({ session, isOpen, onClose, onSuccess }: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/products")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setProducts(res.data);
        })
        .catch(() => {});
      setCart({});
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

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
        setError(`Only ${prod.current_stock} ${prod.unit} of "${prod.name}" available in stock`);
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

  const cartCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const handleSubmit = async () => {
    if (cartCount === 0) return;
    setLoading(true);
    setError(null);

    try {
      const itemsPayload = Object.entries(cart).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      const res = await fetch("/api/tables/add-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          items: itemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add items to table session");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add items");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Quick Add-ons
            </span>
            <h3 className="text-lg font-black text-white">
              Add Items to {session.table_name || "Table Session"}
            </h3>
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

        {/* Category Tabs */}
        <div className="px-4 py-2 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
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

        {/* Product Grid */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filteredProducts.map((prod) => {
            const qtyInCart = cart[prod.id] || 0;
            const isOutOfStock = prod.current_stock <= 0;

            return (
              <div
                key={prod.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  qtyInCart > 0
                    ? "bg-emerald-950/20 border-emerald-500/40"
                    : "bg-zinc-900/60 border-zinc-800/80"
                } ${isOutOfStock ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{prod.name}</span>
                    {prod.current_stock <= prod.low_stock_threshold && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-800/40 rounded">
                        Stock: {prod.current_stock}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    <span className="font-semibold text-emerald-400">
                      {formatRupees(prod.selling_price_paise)}
                    </span>
                    <span className="text-[11px] text-zinc-500 ml-1.5">per {prod.unit}</span>
                  </div>
                </div>

                {/* Touch Quantity Controls */}
                <div className="flex items-center gap-2">
                  {qtyInCart > 0 ? (
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/80 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prod.id, -1)}
                        className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-emerald-400">
                        {qtyInCart}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prod.id, 1)}
                        className="w-7 h-7 rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(prod.id, 1)}
                      disabled={isOutOfStock}
                      className="px-3.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-600/40 hover:border-emerald-500 text-emerald-300 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Cart Subtotal & Confirmation */}
        <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 shrink-0 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">
              Selected: <strong className="text-white">{cartCount} items</strong>
            </div>
            <div className="text-lg font-black text-emerald-400">
              Subtotal: {formatRupees(cartTotalPaise)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={cartCount === 0 || loading}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Attach to Table Bill</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
