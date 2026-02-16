"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useMenuStore } from "@/store/useMenuStore";
import { useCartStore } from "@/store/useCartStore";
import { useTableStore } from "@/store/useTableStore";
import { useSearchParams } from "next/navigation";
import { BillingPanel } from "@/components/pos/BillingPanel";
import { VirtualProductGrid } from "@/components/pos/VirtualProductGrid";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag as ShoppingBagIcon,
  ChevronDown,
  List,
  RotateCw,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Suspense } from "react";

function BillingContent() {
  const { categories, fetchMenu } = useMenuStore();
  const { items: cartItems, addItem, removeItem } = useCartStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auto-select first category
  useEffect(() => {
    fetchMenu();
  }, []);

  // Derive active category object from ID
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return categories[0] || null;
    return categories.find(c => c.id === selectedCategoryId) || categories[0] || null;
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Handle Table Selection from URL
  const searchParams = useSearchParams();
  const initTableName = searchParams.get('tableName');
  const initTableId = searchParams.get('tableId');
  const { tables, selectTable, fetchTables } = useTableStore();

  useEffect(() => {
    const handleSelection = async () => {
      if (Array.isArray(tables) && tables.length > 0) {
        if (initTableId) {
          const id = parseInt(initTableId);
          const table = tables.find(t => t.id === id);
          if (table) {
            selectTable(id);
            return;
          }
        }

        if (initTableName) {
          const targetName = decodeURIComponent(initTableName);
          const table = tables.find(t => t.label === targetName);
          if (table) {
            selectTable(table.id);
            return;
          }
        }
      }

      if (!Array.isArray(tables) || tables.length === 0) {
        fetchTables();
      }
    };

    handleSelection();
  }, [initTableName, initTableId, tables, selectTable]);

  // Initial Fetch on mount
  useEffect(() => {
    fetchTables();
  }, []);


  // Select first category after categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const filteredItems = useMemo(() => {
    // If a category is selected, use its items. Otherwise, show all items from all categories.
    const baseItems = activeCategory ? (activeCategory.items || []) : categories.flatMap(cat => cat.items || []);

    return baseItems.filter((item: any) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeCategory, categories, searchTerm]);

  return (
    <div className="flex h-full w-full bg-background overflow-hidden font-sans relative">

      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background/95 to-background/80 pointer-events-none" />

      {/* LEFT: Category Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-surface/30 backdrop-blur-md border-r border-surface-light flex-col overflow-y-auto custom-scrollbar relative z-10 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
              <LayoutGrid className="w-3 h-3" />
              Registry
            </h2>
            <button onClick={() => fetchMenu()} className="text-muted hover:text-primary transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "w-full py-3.5 px-6 text-left text-sm font-bold rounded-[32px] transition-all duration-300 relative group overflow-hidden",
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-fg shadow-[0_8px_20px_rgba(105,215,189,0.25)]"
                    : "text-muted hover:text-foreground hover:bg-surface-light"
                )}
              >
                {cat.title}
                {selectedCategoryId === cat.id && (
                  <motion.div
                    layoutId="activeCategoryDot"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-fg/50"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER: Items Grid */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-10">

        {/* Search Bar & Mobile Headers */}
        <div className="bg-background/80 backdrop-blur-xl border-b border-surface-light flex flex-col gap-4 z-10 p-4 md:p-6 transition-all">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                className="w-full pl-12 pr-6 py-3.5 bg-surface-light/50 border border-transparent focus:border-primary/50 rounded-full text-sm text-foreground focus:outline-none transition-all placeholder:text-muted/50 backdrop-blur-md ring-1 ring-transparent focus:ring-primary/20"
                placeholder="Search menu patterns..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="hidden lg:flex items-center gap-3 bg-surface/50 backdrop-blur-sm border border-surface-light rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest whitespace-nowrap">Live Menu Bridge</span>
            </div>
          </div>

          {/* Mobile Category Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto flex gap-2 pb-1 no-scrollbar pt-2 border-t border-surface-light/50">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-fg shadow-lg shadow-primary/20"
                    : "bg-surface-light/50 text-muted hover:text-foreground border border-surface-light"
                )}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid - Virtualized */}
        <div className="flex-1 p-4 md:p-6 w-full h-[600px] min-h-0 bg-transparent overflow-hidden">
          <VirtualProductGrid items={filteredItems} onAddItem={addItem} />
        </div>

        {/* Mobile Floating Cart Button */}
        <div className="md:hidden absolute bottom-8 right-8 z-20">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-16 h-16 bg-primary rounded-full shadow-[0_10px_30px_rgba(105,215,189,0.4)] flex items-center justify-center text-primary-fg relative transition-transform active:scale-95 group"
          >
            <ShoppingBagIcon className="w-7 h-7" />
            <AnimatePresence>
              {cartItems.length > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-4 border-background shadow-lg"
                >
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </main>

      {/* RIGHT: Billing Panel (Responsive Drawer) */}
      <div className={cn(
        "bg-surface/90 backdrop-blur-2xl border-l border-surface-light flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-30 shadow-2xl overflow-hidden",
        "md:w-[480px] lg:w-[540px] md:relative md:translate-y-0",
        "fixed inset-0 w-full h-full md:h-auto",
        isCartOpen ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-0 opacity-0 md:opacity-100"
      )}>
        {/* Mobile Close Handle */}
        <div className="md:hidden bg-surface/50 backdrop-blur px-6 py-6 flex items-center justify-between shrink-0 border-b border-surface-light">
          <div>
            <span className="font-serif italic font-bold text-2xl tracking-tight">Active Ledger</span>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Transaction Node #8291</p>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-12 h-12 bg-surface-light rounded-full flex items-center justify-center text-foreground transition-all active:scale-90"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <BillingPanel />
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full bg-background text-primary font-bold animate-pulse">Initializing Flux POS...</div>}>
      <BillingContent />
    </Suspense>
  );
}
