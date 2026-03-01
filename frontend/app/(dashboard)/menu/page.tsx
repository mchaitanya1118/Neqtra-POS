"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Search,
    Utensils,
    Plus,
    Download,
    FolderPlus,
    LayoutGrid,
    Coffee,
    Pizza,
    ChefHat
} from "lucide-react";
import { useMenuStore } from "@/store/useMenuStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryModal } from "@/features/pos/components/CategoryModal";
import { MenuItemModal } from "@/features/pos/components/MenuItemModal";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { useShallow } from 'zustand/react/shallow';

export default function MenuPage() {
    const { hasPermission } = useAuthStore();
    const {
        categories,
        fetchMenu,
        isLoading,
        addCategory,
        updateCategory,
        deleteCategory,
        addItem,
        updateItem,
        deleteItem
    } = useMenuStore(useShallow(state => ({
        categories: state.categories,
        fetchMenu: state.fetchMenu,
        isLoading: state.isLoading,
        addCategory: state.addCategory,
        updateCategory: state.updateCategory,
        deleteCategory: state.deleteCategory,
        addItem: state.addItem,
        updateItem: state.updateItem,
        deleteItem: state.deleteItem
    })));

    const [search, setSearch] = useState("");

    // Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    // --- Helpers ---
    const filteredCategories = useMemo(() => {
        return categories.map(cat => ({
            ...cat,
            items: cat.items.filter((item: any) =>
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                (item.description?.toLowerCase() || "").includes(search.toLowerCase())
            )
        })).filter(cat =>
            cat.title.toLowerCase().includes(search.toLowerCase()) ||
            cat.items.length > 0
        );
    }, [categories, search]);

    // Metrics
    const totalCategories = categories.length;
    const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const outOfStockItems = categories.reduce((acc, cat) =>
        acc + cat.items.filter((i: any) => !i.isAvailable).length, 0
    );

    const handleExport = () => {
        const rows: any[] = [];
        categories.forEach(cat => {
            cat.items.forEach((item: any) => {
                rows.push({
                    Category: cat.title,
                    Item: item.title,
                    Price: item.price,
                    Vegetarian: item.isVegetarian ? "Yes" : "No",
                    Spicy: item.isSpicy ? "Yes" : "No",
                    Available: item.isAvailable ? "Yes" : "No",
                    Description: item.description || ""
                });
            });
        });

        if (rows.length === 0) return;

        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(rows[0]).join(",") + "\n"
            + rows.map(r => Object.values(r).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `menu_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-lg shadow-primary/5">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight dark:text-white">Kitchen Menu</h1>
                    </div>
                    <p className="text-muted font-medium ml-1">Curate your culinary offerings and categories.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto">
                    <div className="flex flex-wrap md:flex-nowrap gap-4 p-1.5 bg-surface border border-surface-light rounded-3xl md:rounded-[28px] shadow-sm w-full lg:w-auto">
                        <div className="flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl md:rounded-[22px] flex flex-col md:flex-row items-center md:items-start md:gap-3 text-center md:text-left">
                            <LayoutGrid className="w-5 h-5 text-blue-500 mb-1 md:mb-0" />
                            <div>
                                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Categories</p>
                                <p className="text-xl font-black leading-none">{totalCategories}</p>
                            </div>
                        </div>
                        <div className="flex-1 md:flex-none px-4 md:px-6 py-2.5 bg-green-500/10 border border-green-500/20 rounded-2xl md:rounded-[22px] flex flex-col md:flex-row items-center md:items-start md:gap-3 text-center md:text-left">
                            <ChefHat className="w-5 h-5 text-green-500 mb-1 md:mb-0" />
                            <div>
                                <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest leading-none mb-1">Signature Items</p>
                                <p className="text-xl font-black leading-none">{totalItems}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-surface-light mx-2 hidden lg:block" />

                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={handleExport}
                            className="p-3 md:p-4 bg-surface border border-surface-light hover:border-primary/50 rounded-xl md:rounded-2xl text-muted hover:text-primary transition-all shadow-sm shrink-0"
                            title="Export Menu Data"
                        >
                            <Download className="w-4 h-4 md:w-5 h-5" />
                        </button>
                        <button
                            onClick={() => { setEditingCategory(null); setIsCatModalOpen(true); }}
                            disabled={!hasPermission('Admin')}
                            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 disabled:opacity-50 text-black px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 md:gap-3"
                        >
                            <FolderPlus className="w-4 h-4 md:w-5 h-5 shrink-0" />
                            <span className="whitespace-nowrap">New Category</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between bg-surface/50 backdrop-blur-md border border-surface-light p-3 rounded-3xl md:rounded-[32px] sticky top-8 z-30">
                <div className="relative flex p-1.5 bg-surface-light/40 rounded-2xl md:rounded-[24px] w-full md:w-auto">
                    <div className="px-4 md:px-6 py-2.5 md:py-3 rounded-[20px] text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center w-full md:w-auto gap-2 text-primary">
                        <Coffee className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        <span className="whitespace-nowrap">Live Catalog</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4 bg-surface-light/50 border border-surface-light/50 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl md:rounded-[24px] w-full md:w-[400px] focus-within:ring-2 ring-primary/20 focus-within:bg-surface-light transition-all group">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-muted group-focus-within:text-primary transition-colors shrink-0" />
                    <input
                        className="bg-transparent text-xs md:text-sm font-bold focus:outline-none w-full placeholder:text-muted/40"
                        placeholder="Search items by name or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="space-y-12">
                {isLoading ? (
                    <div className="space-y-12">
                        {[1, 2].map(i => (
                            <div key={i} className="space-y-6">
                                <div className="h-14 w-64 bg-surface-light/20 animate-pulse rounded-2xl" />
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(j => (
                                        <div key={j} className="h-64 bg-surface-light/20 animate-pulse rounded-[40px] border border-surface-light" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-16 pb-32">
                        {filteredCategories.map((category) => (
                            <MenuCategorySection
                                key={category.id}
                                category={category}
                                onEditCategory={(cat) => { setEditingCategory(cat); setIsCatModalOpen(true); }}
                                onDeleteCategory={deleteCategory}
                                onAddItem={(catId) => { setSelectedCategoryId(catId); setEditingItem(null); setIsItemModalOpen(true); }}
                                onEditItem={(item) => { setEditingItem(item); setIsItemModalOpen(true); }}
                            />
                        ))}

                        {filteredCategories.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-32 text-center bg-surface/30 border border-surface-light border-dashed rounded-[40px]"
                            >
                                <Pizza className="w-16 h-16 text-muted/20 mx-auto mb-6" />
                                <h2 className="text-2xl font-black text-muted/40 uppercase tracking-tighter">No Menu Items Found</h2>
                                <p className="text-muted/60 mt-2 font-medium">Try broadening your search or add new categories.</p>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CategoryModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                onSubmit={async (title, icon, variant) => {
                    if (editingCategory) {
                        await updateCategory(editingCategory.id, { title, icon, variant });
                    } else {
                        await addCategory(title, icon, variant);
                    }
                }}
                initialData={editingCategory}
                title={editingCategory ? "Update Gallery" : "Create New Gallery"}
            />

            <MenuItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSubmit={async (data) => {
                    if (editingItem) {
                        await updateItem(editingItem.id, data);
                    } else if (selectedCategoryId) {
                        await addItem(selectedCategoryId, data);
                    }
                }}
                initialData={editingItem}
                title={editingItem ? "Refine Creation" : "New Culinary Detail"}
            />
        </div>
    );
}
