"use client";

import { useState, useEffect } from "react";
import { useMenuStore } from "@/store/useMenuStore";
import { useCartStore } from "@/store/useCartStore";
import { useTableStore } from "@/store/useTableStore";
import { useSearchParams } from "next/navigation";
import { BillingPanel } from "@/components/pos/BillingPanel";
import { Search, ShoppingBag as ShoppingBagIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { Suspense } from "react";

function BillingContent() {
  const { categories, fetchMenu } = useMenuStore();
  const { items: cartItems, addItem, removeItem } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auto-select first category
  useEffect(() => {
    fetchMenu();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Handle Table Selection from URL
  const searchParams = useSearchParams();
  const initTableName = searchParams.get('tableName');
  const initTableId = searchParams.get('tableId');
  const { tables, selectTable, fetchTables } = useTableStore();

  useEffect(() => {
    const handleSelection = async () => {
      // 1. If logic finds the table, select it
      if (Array.isArray(tables) && tables.length > 0) {
        if (initTableId) {
          const id = parseInt(initTableId);
          const table = tables.find(t => t.id === id);
          if (table) {
            console.log(`[BillingPage] Found table by ID: ${id}. Selecting...`);
            selectTable(id);
            return;
          } else {
            console.log(`[BillingPage] Table ID ${id} not found in current list.`);
          }
        }

        if (initTableName) {
          const targetName = decodeURIComponent(initTableName);
          const table = tables.find(t => t.label === targetName);
          if (table) {
            console.log(`[BillingPage] Found table by Name: ${targetName}. Selecting...`);
            selectTable(table.id);
            return;
          } else {
            console.log(`[BillingPage] Table Name ${targetName} not found in current list.`);
          }
        }
      }

      // 2. If we reach here, we haven't found the table.
      if (!Array.isArray(tables) || tables.length === 0) {
        console.log("[BillingPage] No tables loaded, fetching...");
        fetchTables();
      } else {
        console.warn("[BillingPage] Target table not found in loaded tables.");
      }
    };

    handleSelection();
  }, [initTableName, initTableId, tables, selectTable]);

  // Initial Fetch on mount ALWAYS to ensure fresh data
  useEffect(() => {
    fetchTables();
  }, []);


  const filteredItems = selectedCategory?.items?.filter((item: any) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex h-full w-full bg-gray-100 dark:bg-[#1a1b1e] overflow-hidden font-sans">

      {/* LEFT: Category Sidebar (Desktop) */}
      <div className="hidden md:flex w-48 flex-shrink-0 bg-[#2d3748] text-white flex-col overflow-y-auto border-r border-gray-700">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "py-4 px-4 text-left text-sm font-semibold border-l-4 transition-colors border-transparent hover:bg-gray-700",
              selectedCategory?.id === cat.id ? "bg-[#d32f2f] border-l-white" : "text-gray-300"
            )}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* CENTER: Items Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] dark:bg-[#1e1e1e] relative">
        {/* Search Bar & Mobile Categories */}
        <div className="bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-gray-700 flex flex-col gap-2 shadow-sm z-10">
          {/* Search Input */}
          <div className="p-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-[#333] border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search item"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Category Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto flex gap-2 px-3 pb-3 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border",
                  selectedCategory?.id === cat.id
                    ? "bg-[#d32f2f] text-white border-[#d32f2f]"
                    : "bg-white dark:bg-[#333] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                )}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 content-start pb-24 md:pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item: any) => {
              // Find quantity in cart
              const inCart = cartItems.find(i => i.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="bg-white dark:bg-[#333] border-l-4 border-l-green-500 rounded-r-md shadow-sm p-3 flex flex-col items-start hover:shadow-md transition-shadow active:scale-[0.98] group relative min-h-[80px]"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm text-left line-clamp-2 leading-tight">
                    {item.title}
                  </span>
                  {/* <span className="text-xs text-gray-400 mt-1">₹{item.price}</span> */}

                  {inCart && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                      {inCart.quantity}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Floating Cart Button */}
        <div className="md:hidden absolute bottom-6 right-6 z-20">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-14 h-14 bg-[#d32f2f] rounded-full shadow-lg flex items-center justify-center text-white relative animate-in zoom-in duration-200"
          >
            <ShoppingBagIcon className="w-6 h-6" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-[#d32f2f] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#d32f2f]">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: Billing Panel (Responsive Drawer) */}
      <div className={cn(
        "bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out z-30",
        // Desktop: Fixed width, always visible
        "md:w-[450px] lg:w-[500px] md:relative md:translate-y-0",
        // Mobile: Full screen fixed overlay, slide up/down
        "fixed inset-0 w-full h-full",
        isCartOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
      )}>
        {/* Mobile Close Handle */}
        <div className="md:hidden bg-[#333] text-white p-2 flex items-center justify-between shrink-0">
          <span className="font-bold pl-2">Current Order</span>
          <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-gray-700 rounded-full">
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        <BillingPanel />
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading POS...</div>}>
      <BillingContent />
    </Suspense>
  );
}
