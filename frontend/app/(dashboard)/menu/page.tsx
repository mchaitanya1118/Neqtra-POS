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
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryModal } from "@/components/pos/CategoryModal";
import { MenuItemModal } from "@/components/pos/MenuItemModal";
import { MenuCategorySection } from "@/components/menu/MenuCategorySection";
import { useShallow } from 'zustand/react/shallow';

export default function MenuPage() {
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

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-4 p-1.5 bg-surface border border-surface-light rounded-[28px] shadow-sm">
                        <div className="px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-[22px] flex items-center gap-3">
                            <LayoutGrid className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Categories</p>
                                <p className="text-xl font-black leading-none">{totalCategories}</p>
                            </div>
                        </div>
                        <div className="px-6 py-2.5 bg-green-500/10 border border-green-500/20 rounded-[22px] flex items-center gap-3">
                            <ChefHat className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-[10px] font-black text-green-500/60 uppercase tracking-widest">Signature Items</p>
                                <p className="text-xl font-black leading-none">{totalItems}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-surface-light mx-2 hidden lg:block" />

                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="p-4 bg-surface border border-surface-light hover:border-primary/50 rounded-2xl text-muted hover:text-primary transition-all shadow-sm"
                            title="Export Menu Data"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => { setEditingCategory(null); setIsCatModalOpen(true); }}
                            className="bg-primary hover:bg-primary/90 text-black px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <FolderPlus className="w-5 h-5" />
                            New Category
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-surface/50 backdrop-blur-md border border-surface-light p-3 rounded-[32px] sticky top-8 z-30">
                <div className="relative flex p-1.5 bg-surface-light/40 rounded-[24px] w-full md:w-auto">
                    <div className="px-6 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                        <Coffee className="w-4 h-4" />
                        Live Catalog
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-surface-light/50 border border-surface-light/50 px-5 py-3 rounded-[24px] w-full md:w-[400px] focus-within:ring-2 ring-primary/20 focus-within:bg-surface-light transition-all group">
                    <Search className="w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        className="bg-transparent text-sm font-bold focus:outline-none w-full placeholder:text-muted/40"
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
