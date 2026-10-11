"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart, Check, AlertCircle, X } from "lucide-react";
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
        setError(`Only ${prod.current_stock} ${prod.unit} of "${prod.name}" available in arena stock`);
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
      <div className="bg-[#131714] border border-[#222823] rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col text-[#F0EBDD] shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#222823] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-[#B69A62]">
              Lounge Service &amp; Refreshments
            </span>
            <h3 className="text-xl font-serif font-bold text-[#F0EBDD] mt-0.5">
              Add Items &middot; {session.table_name || "Table Session"}
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

        {/* Category Tabs */}
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

        {/* Product Grid */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          {filteredProducts.map((prod) => {
            const qtyInCart = cart[prod.id] || 0;
            const isOutOfStock = prod.current_stock <= 0;

            return (
              <div
                key={prod.id}
                className={`p-3 rounded-lg border transition-colors flex items-center justify-between ${
                  qtyInCart > 0
                    ? "bg-[#123B2C]/30 border-[#187653]/60"
                    : "bg-[#0B0D0C] border-[#222823]"
                } ${isOutOfStock ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div>
                  <div className="font-semibold text-sm text-[#F0EBDD] flex items-center gap-2">
                    <span>{prod.name}</span>
                    {prod.current_stock <= prod.low_stock_threshold && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#0B0D0C] text-[#B69A62] border border-[#222823] rounded font-mono">
                        Stock: {prod.current_stock}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#A6AAA3] mt-0.5 flex items-center gap-1">
                    <span className="font-mono font-medium text-[#F0EBDD]">
                      {formatRupees(prod.selling_price_paise)}
                    </span>
                    <span className="text-[11px] text-[#A6AAA3]">&middot; per {prod.unit}</span>
                  </div>
                </div>

                {/* Touch Quantity Controls */}
                <div className="flex items-center gap-2">
                  {qtyInCart > 0 ? (
                    <div className="flex items-center gap-1.5 bg-[#131714] border border-[#222823] rounded p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(prod.id, -1)}
                        className="w-6 h-6 rounded bg-[#0B0D0C] hover:bg-[#1a201c] text-[#A6AAA3] hover:text-[#F0EBDD] flex items-center justify-center font-bold active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs text-[#F0EBDD]">
                        {qtyInCart}
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
                      disabled={isOutOfStock}
                      className="px-3 py-1 bg-[#131714] hover:bg-[#1a201c] border border-[#222823] text-[#F0EBDD] rounded text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-[#187653]" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Cart Subtotal & Confirmation */}
        <div className="p-4 bg-[#0B0D0C] border-t border-[#222823] shrink-0 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#A6AAA3]">
              Selected: <strong className="text-[#F0EBDD] font-mono">{cartCount} items</strong>
            </div>
            <div className="text-base font-mono font-bold text-[#F0EBDD]">
              Subtotal: {formatRupees(cartTotalPaise)}
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
              type="button"
              onClick={handleSubmit}
              disabled={cartCount === 0 || loading}
              className="py-2 px-4 bg-[#187653] hover:bg-[#1f8c63] disabled:opacity-40 text-[#F0EBDD] font-medium text-xs rounded transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#F0EBDD]/30 border-t-[#F0EBDD] rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#B69A62]" />
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
