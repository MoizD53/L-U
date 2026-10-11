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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Counter Sales &amp; Inventory
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Snacks, cold drinks, water bottles &amp; tobacco stock in Dahod arena
          </p>
        </div>

        <button
          type="button"
          onClick={onCounterSale}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>+ New Counter Sale</span>
        </button>
      </div>

      {/* Compliance Notice: Tobacco Regulations (COTPA 2003 India) */}
      <div className="p-3 bg-amber-950/30 border border-amber-600/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Statutory Compliance Notice:</strong> Sale of cigarettes and tobacco products to persons under 18 years of age is strictly prohibited under Indian law. Arena staff must verify age for all tobacco sales.
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[#0f1420] text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 bg-[#0f1420] border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none"
          />
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>
            {lowStockCount} product(s) currently at or below low stock threshold. Consider reordering.
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
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isOut
                  ? "bg-[#140f12] border-rose-900/60"
                  : isLow
                  ? "bg-[#14120f] border-amber-800/60"
                  : "bg-[#0f1420] border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {prod.category}
                    </span>
                    <h3 className="font-bold text-sm text-white leading-snug mt-0.5">
                      {prod.name}
                    </h3>
                  </div>
                  {isOut ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold shrink-0">
                      Out of Stock
                    </span>
                  ) : isLow ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold shrink-0">
                      Low Stock
                    </span>
                  ) : null}
                </div>

                {/* Price and Stock Stats */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Selling Price</span>
                    <span className="font-bold text-white font-mono text-sm">
                      {formatRupees(prod.selling_price_paise)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Current Stock</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {prod.current_stock} <span className="text-[10px] text-zinc-500">{prod.unit}</span>
                    </span>
                  </div>
                </div>

                {/* Cost price & pack ratio if Owner */}
                {userRole === "OWNER" && (
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                    <span>Cost: {formatRupees(prod.cost_price_paise)}</span>
                    {prod.pack_piece_ratio > 1 && (
                      <span>Pack ratio: {prod.pack_piece_ratio} sticks</span>
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
                    className="py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 w-full"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
                    <span>Adjust Stock</span>
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
          <div className="bg-[#101522] border border-zinc-800 rounded-2xl max-w-sm w-full p-6 text-zinc-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Inventory Audit
                </span>
                <h3 className="text-base font-bold text-white">{adjustingProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="text-zinc-400 hover:text-white p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {adjustError && (
              <div className="mt-3 p-2.5 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-300">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  New Physical Stock Count:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={adjustStockVal}
                  onChange={(e) => setAdjustStockVal(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-base font-mono font-bold text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Reason for Adjustment:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken bottle, physical count audit"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d14] border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="w-1/2 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
