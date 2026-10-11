"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  AlertTriangle,
  Search,
  Package,
  SlidersHorizontal,
  ShieldAlert,
} from "lucide-react";
import { formatRupees } from "@/lib/utils/money";
import type { ProductItem, UserRole } from "@/lib/types";

interface Props {
  userRole: UserRole;
  onCounterSale: () => void;
}

export function ShopView({ userRole, onCounterSale }: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Stock Adjustment State
  const [adjustingProduct, setAdjustingProduct] = useState<ProductItem | null>(null);
  const [adjustStockVal, setAdjustStockVal] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchProducts = () => {
    fetch(`/api/products?category=${encodeURIComponent(categoryFilter)}&search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProducts(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, search]);

  const categories = ["ALL", "Cold drinks", "Chips", "Cigarettes", "Biscuits", "Other"];

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const newStockNum = parseInt(adjustStockVal, 10);
    if (isNaN(newStockNum) || newStockNum < 0) {
      setAdjustError("Please enter a valid stock count");
      return;
    }

    setAdjustLoading(true);
    setAdjustError(null);

    try {
      const res = await fetch("/api/shop/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          newStock: newStockNum,
          reason: adjustReason.trim() || "Manual stock tally audit",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAdjustingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setAdjustError(err.message || "Failed to adjust stock");
    } finally {
      setAdjustLoading(false);
    }
  };

  const lowStockCount = products.filter((p) => p.current_stock <= p.low_stock_threshold).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#202722] pb-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
            Bar &amp; Pro Shop &bull; Dahod
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F0EBDD] tracking-tight mt-0.5">
            Counter Sales &amp; Inventory
          </h1>
          <p className="text-xs text-[#A6AAA3] mt-1">
            Beverages, snacks &amp; pro accessories in arena inventory
          </p>
        </div>

        <button
          type="button"
          onClick={onCounterSale}
          className="py-2.5 px-4 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-xl text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>+ New Counter Sale</span>
        </button>
      </div>

      {/* Compliance Notice: Tobacco Regulations */}
      <div className="p-3 bg-[#131714] border border-[#B69A62]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#F0EBDD]">
        <ShieldAlert className="w-4 h-4 text-[#B69A62] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#A6AAA3] leading-relaxed">
          <strong className="text-[#F0EBDD]">Statutory Notice (COTPA):</strong> Sale of tobacco products to individuals under 18 years is prohibited by law. Staff must verify age before processing tobacco transactions.
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#123B2C] text-[#F0EBDD] border border-[#187653]/50"
                  : "bg-[#131714] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#202722]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B726B]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-2 bg-[#0E1210] border border-[#202722] focus:border-[#187653] focus:ring-1 focus:ring-[#187653]/30 rounded-xl text-xs text-[#F0EBDD] placeholder-[#6B726B] outline-none transition-colors"
          />
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-3 bg-[#131714] border border-[#B69A62]/30 rounded-xl flex items-center gap-2 text-xs text-[#B69A62]">
          <AlertTriangle className="w-4 h-4 text-[#B69A62]" />
          <span>
            {lowStockCount} product(s) currently at or below low stock threshold.
          </span>
        </div>
      )}

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((prod) => {
          const isLow = prod.current_stock <= prod.low_stock_threshold;
          const isOut = prod.current_stock <= 0;

          return (
            <div
              key={prod.id}
              className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between ${
                isOut
                  ? "bg-[#131714] border-red-900/40"
                  : isLow
                  ? "bg-[#131714] border-[#B69A62]/30"
                  : "bg-[#131714] border-[#202722]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#187653]">
                      {prod.category}
                    </span>
                    <h3 className="font-display font-semibold text-sm text-[#F0EBDD] leading-snug mt-0.5">
                      {prod.name}
                    </h3>
                  </div>
                  {isOut ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40 font-medium shrink-0">
                      Out of Stock
                    </span>
                  ) : isLow ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#B69A62]/10 text-[#B69A62] border border-[#B69A62]/30 font-medium shrink-0">
                      Low Stock
                    </span>
                  ) : null}
                </div>

                {/* Price and Stock Stats */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#0E1210] rounded-xl border border-[#202722] text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B726B] block">Retail Price</span>
                    <span className="font-mono-numbers font-medium text-[#F0EBDD] text-sm">
                      {formatRupees(prod.selling_price_paise)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#6B726B] block">In Stock</span>
                    <span
                      className={`font-mono-numbers font-medium text-sm ${
                        isOut ? "text-red-400" : isLow ? "text-[#B69A62]" : "text-[#187653]"
                      }`}
                    >
                      {prod.current_stock} <span className="text-[10px] text-[#6B726B]">{prod.unit}</span>
                    </span>
                  </div>
                </div>

                {/* Cost price & pack ratio if Owner */}
                {userRole === "OWNER" && (
                  <div className="flex items-center justify-between text-[11px] text-[#6B726B] px-1">
                    <span>Cost: <span className="font-mono-numbers">{formatRupees(prod.cost_price_paise)}</span></span>
                    {prod.pack_piece_ratio > 1 && (
                      <span>Pack ratio: {prod.pack_piece_ratio}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-2">
                {userRole === "OWNER" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustingProduct(prod);
                      setAdjustStockVal(String(prod.current_stock));
                      setAdjustReason("");
                      setAdjustError(null);
                    }}
                    className="py-1.5 px-2 bg-[#0E1210] hover:bg-[#181E19] text-[#A6AAA3] hover:text-[#F0EBDD] rounded-lg text-xs font-medium flex items-center justify-center gap-1 w-full border border-[#202722] transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-[#6B726B]" />
                    <span>Audit Stock</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0D0C] border border-[#202722] rounded-2xl max-w-sm w-full p-6 text-[#F0EBDD] shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#202722]">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#B69A62]">
                  Inventory Audit
                </span>
                <h3 className="font-display text-base font-bold text-[#F0EBDD]">{adjustingProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-[#A6AAA3] hover:text-[#F0EBDD] p-1 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {adjustError && (
              <div className="mt-3 p-2.5 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-medium text-[#A6AAA3] mb-1">
                  New Physical Count:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={adjustStockVal}
                  onChange={(e) => setAdjustStockVal(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1210] border border-[#202722] focus:border-[#187653] rounded-xl text-base font-mono-numbers font-medium text-[#F0EBDD] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A6AAA3] mb-1">
                  Reason for Adjustment:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory tally audit"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E1210] border border-[#202722] focus:border-[#187653] rounded-xl text-xs text-[#F0EBDD] outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="w-1/2 py-2.5 bg-[#0E1210] hover:bg-[#181E19] text-[#A6AAA3] hover:text-[#F0EBDD] border border-[#202722] rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="w-1/2 py-2.5 bg-[#187653] hover:bg-[#123B2C] text-[#F0EBDD] rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

