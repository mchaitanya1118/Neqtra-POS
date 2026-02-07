"use client";

import { useState, useEffect } from "react";
import { useMenuStore } from "@/store/useMenuStore";
import { useCartStore } from "@/store/useCartStore";
import { useTableStore } from "@/store/useTableStore";
import { useSearchParams } from "next/navigation";
import { BillingPanel } from "@/components/pos/BillingPanel";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { Suspense } from "react";

function BillingContent() {
  const { categories, fetchMenu } = useMenuStore();
  const { items: cartItems, addItem, removeItem } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

      {/* LEFT: Category Sidebar */}
      <div className="w-48 flex-shrink-0 bg-[#2d3748] text-white flex flex-col overflow-y-auto border-r border-gray-700">
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
      <div className="flex-1 flex flex-col min-w-0 bg-[#f1f5f9] dark:bg-[#1e1e1e]">
        {/* Search Bar */}
        <div className="p-3 bg-white dark:bg-[#252526] border-b border-gray-200 dark:border-gray-700 flex gap-2">
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

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 content-start">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item: any) => {
              // Find quantity in cart
              const inCart = cartItems.find(i => i.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="bg-white dark:bg-[#333] border-l-4 border-l-green-500 rounded-r-md shadow-sm p-3 flex flex-col items-start hover:shadow-md transition-shadow active:scale-[0.98] group relative"
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
      </div>

      {/* RIGHT: Billing Panel */}
      <div className="w-[500px] flex-shrink-0 bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-gray-700 flex flex-col relative">
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
