"use client";

import React, { useState, useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, type TabId } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { HomeView } from "@/components/views/HomeView";
import { TablesView } from "@/components/views/TablesView";
import { CustomersView } from "@/components/views/CustomersView";
import { ShopView } from "@/components/views/ShopView";
import { ExpensesView } from "@/components/views/ExpensesView";
import { ReportsView } from "@/components/views/ReportsView";
import { SettingsView } from "@/components/views/SettingsView";

// Modals
import { StartGameModal } from "@/components/modals/StartGameModal";
import { AddItemsModal } from "@/components/modals/AddItemsModal";
import { EndGameModal } from "@/components/modals/EndGameModal";
import { CounterSaleModal } from "@/components/modals/CounterSaleModal";
import { CollectUdhaarModal } from "@/components/modals/CollectUdhaarModal";
import { AddExpenseModal } from "@/components/modals/AddExpenseModal";
import { AddCustomerModal } from "@/components/modals/AddCustomerModal";
import { DailyClosingModal } from "@/components/modals/DailyClosingModal";

import type { UserSession, TableItem, GameSessionItem, CustomerItem } from "@/lib/types";

export default function ArenaApp() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabId>("home");

  // Active count for badges
  const [activePoolCount, setActivePoolCount] = useState(0);
  const [activeSnookerCount, setActiveSnookerCount] = useState(0);

  // Modal states
  const [startGameTable, setStartGameTable] = useState<TableItem | null>(null);
  const [addItemsSession, setAddItemsSession] = useState<GameSessionItem | null>(null);
  const [endGameSession, setEndGameSession] = useState<GameSessionItem | null>(null);
  const [showCounterSale, setShowCounterSale] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [collectUdhaarCust, setCollectUdhaarCust] = useState<CustomerItem | null>(null);
  const [showCollectUdhaar, setShowCollectUdhaar] = useState(false);
  const [showDailyClosing, setShowDailyClosing] = useState(false);

  // Global refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // Check auth on load
  const verifyAuth = () => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.authenticated) {
          setSession(res.user);
        } else {
          setSession(null);
        }
      })
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
  };

  useEffect(() => {
    verifyAuth();

    // Check PWA shortcut URL params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabId;
      if (tabParam && ["home", "pool", "snooker", "customers", "shop", "expenses", "reports", "settings"].includes(tabParam)) {
        setCurrentTab(tabParam);
      }
    }
  }, []);

  // Poll active session counts
  useEffect(() => {
    if (!session) return;
    const fetchCounts = () => {
      fetch("/api/tables")
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            const pools = res.data.filter((t: TableItem) => t.type === "POOL" && t.active_session).length;
            const snookers = res.data.filter((t: TableItem) => t.type === "SNOOKER" && t.active_session).length;
            setActivePoolCount(pools);
            setActiveSnookerCount(snookers);
          }
        })
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [session, refreshKey]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setSession(null);
  };

  // Quick action openers from anywhere
  const handleStartPoolQuick = async () => {
    try {
      const res = await fetch("/api/tables?type=POOL");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const available = data.data.find((t: TableItem) => !t.active_session) || data.data[0];
        setStartGameTable(available);
      }
    } catch {}
  };

  const handleStartSnookerQuick = async () => {
    try {
      const res = await fetch("/api/tables?type=SNOOKER");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const available = data.data.find((t: TableItem) => !t.active_session) || data.data[0];
        setStartGameTable(available);
      }
    } catch {}
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm onSuccess={verifyAuth} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] text-zinc-100">
      {/* Top Header */}
      <Navbar
        user={session}
        activeSessionsCount={activePoolCount + activeSnookerCount}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={session.role}
          activePoolCount={activePoolCount}
          activeSnookerCount={activeSnookerCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentTab === "home" && (
            <HomeView
              key={`home-${refreshKey}`}
              onNavigateTab={setCurrentTab}
              onStartPoolGame={handleStartPoolQuick}
              onStartSnookerGame={handleStartSnookerQuick}
              onCounterSale={() => setShowCounterSale(true)}
              onAddExpense={() => setShowAddExpense(true)}
              onAddCustomer={() => setShowAddCustomer(true)}
              onCollectUdhaar={() => {
                setCollectUdhaarCust(null);
                setShowCollectUdhaar(true);
              }}
              onCloseHisab={() => setShowDailyClosing(true)}
              onAddItemsToSession={(s) => setAddItemsSession(s)}
              onEndSession={(s) => setEndGameSession(s)}
            />
          )}

          {currentTab === "pool" && (
            <TablesView
              key={`pool-${refreshKey}`}
              type="POOL"
              onStartGame={(t) => setStartGameTable(t)}
              onAddItems={(s) => setAddItemsSession(s)}
              onEndGame={(s) => setEndGameSession(s)}
            />
          )}

          {currentTab === "snooker" && (
            <TablesView
              key={`snooker-${refreshKey}`}
              type="SNOOKER"
              onStartGame={(t) => setStartGameTable(t)}
              onAddItems={(s) => setAddItemsSession(s)}
              onEndGame={(s) => setEndGameSession(s)}
            />
          )}

          {currentTab === "customers" && (
            <CustomersView
              key={`customers-${refreshKey}`}
              onAddCustomer={() => setShowAddCustomer(true)}
              onCollectUdhaar={(c) => {
                setCollectUdhaarCust(c || null);
                setShowCollectUdhaar(true);
              }}
            />
          )}

          {currentTab === "shop" && (
            <ShopView
              key={`shop-${refreshKey}`}
              userRole={session.role}
              onCounterSale={() => setShowCounterSale(true)}
            />
          )}

          {currentTab === "expenses" && (
            <ExpensesView
              key={`expenses-${refreshKey}`}
              onAddExpense={() => setShowAddExpense(true)}
            />
          )}

          {currentTab === "reports" && (
            <ReportsView key={`reports-${refreshKey}`} />
          )}

          {currentTab === "settings" && (
            <SettingsView key={`settings-${refreshKey}`} userRole={session.role} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activePoolCount={activePoolCount}
        activeSnookerCount={activeSnookerCount}
        onOpenClosingModal={() => setShowDailyClosing(true)}
      />

      {/* Global Modals */}
      {startGameTable && (
        <StartGameModal
          table={startGameTable}
          isOpen={!!startGameTable}
          onClose={() => setStartGameTable(null)}
          onSuccess={triggerRefresh}
        />
      )}

      {addItemsSession && (
        <AddItemsModal
          session={addItemsSession}
          isOpen={!!addItemsSession}
          onClose={() => setAddItemsSession(null)}
          onSuccess={triggerRefresh}
        />
      )}

      {endGameSession && (
        <EndGameModal
          session={endGameSession}
          isOpen={!!endGameSession}
          onClose={() => setEndGameSession(null)}
          onSuccess={triggerRefresh}
        />
      )}

      <CounterSaleModal
        isOpen={showCounterSale}
        onClose={() => setShowCounterSale(false)}
        onSuccess={triggerRefresh}
      />

      <CollectUdhaarModal
        preselectedCustomer={collectUdhaarCust}
        isOpen={showCollectUdhaar}
        onClose={() => {
          setShowCollectUdhaar(false);
          setCollectUdhaarCust(null);
        }}
        onSuccess={triggerRefresh}
      />

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSuccess={triggerRefresh}
      />

      <AddCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={triggerRefresh}
      />

      <DailyClosingModal
        isOpen={showDailyClosing}
        onClose={() => setShowDailyClosing(false)}
        onSuccess={triggerRefresh}
      />
    </div>
  );
}
