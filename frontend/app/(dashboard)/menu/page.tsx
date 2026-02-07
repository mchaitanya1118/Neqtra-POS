"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Search, Edit, Trash2, FolderPlus } from "lucide-react";
import { useMenuStore } from "@/store/useMenuStore";
import { API_URL } from "@/lib/config";
import { CategoryModal } from "@/components/pos/CategoryModal";
import { MenuItemModal } from "@/components/pos/MenuItemModal";
import * as Icons from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";

import { useShallow } from 'zustand/react/shallow';

export default function MenuPage() {
    const { categories, fetchMenu, isLoading } = useMenuStore(useShallow(state => ({
        categories: state.categories,
        fetchMenu: state.fetchMenu,
        isLoading: state.isLoading
    })));
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    // Modal States
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    // --- CRUD Logic ---
    const handleCreateCategory = async (title: string, icon: string, variant: string) => {
        const res = await fetch(`${API_URL}/menu/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, icon, variant })
        });
        if (res.ok) fetchMenu();
    };

    const handleUpdateCategory = async (title: string, icon: string, variant: string) => {
        if (!editingCategory) return;
        const res = await fetch(`${API_URL}/menu/categories/${editingCategory.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, icon, variant })
        });
        if (res.ok) {
            fetchMenu();
            setEditingCategory(null);
        }
    };

    const handleDeleteCategory = async (id: number, title: string) => {
        if (!confirm(`Delete category "${title}" and all its items?`)) return;
        try {
            const res = await fetch(`${API_URL}/menu/categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchMenu();
            } else {
                alert("Failed to delete category. it might contain items that cannot be deleted currently.");
            }
        } catch (e) {
            alert("Network error: Failed to delete category");
        }
    };

    const handleCreateItem = async (title: string, price: number) => {
        if (!selectedCategoryId) return;
        const res = await fetch(`${API_URL}/menu/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, price, categoryId: selectedCategoryId })
        });
        if (res.ok) fetchMenu();
    };

    const handleUpdateItem = async (title: string, price: number) => {
        if (!editingItem) return;
        const res = await fetch(`${API_URL}/menu/items/${editingItem.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, price })
        });
        if (res.ok) {
            fetchMenu();
            setEditingItem(null);
        }
    };

    const handleDeleteItem = async (id: number, title: string) => {
        if (!confirm(`Delete item "${title}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/menu/items/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchMenu();
            } else {
                alert("Failed to delete item.");
            }
        } catch (e) {
            alert("Network error: Failed to delete item");
        }
    };

    // --- Helpers ---
    const filteredCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            cat.items.some(item => item.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
        );
    }, [categories, debouncedSearch]);

    // Helper to render dynamic icon
    const renderIcon = (iconName: string) => {
        const Icon = (Icons as any)[iconName] || Icons.HelpCircle;
        return <Icon className="w-5 h-5" />;
    };

    if (isLoading) return <div className="p-8">Loading menu...</div>;

    return (
        <div className="min-h-screen bg-[#f3f4f6] dark:bg-zinc-950 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Menu Management</h1>

                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-md px-3 py-1.5 border border-gray-200 dark:border-zinc-700 w-64">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                            placeholder="Search Items or Categories"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setEditingCategory(null); setIsCatModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-md text-sm font-bold shadow-sm transition-all"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Add Category
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="p-6 space-y-8 pb-20 overflow-y-auto">
                {filteredCategories.map(category => (
                    <div key={category.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Category Header */}
                        <div className={`px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-${category.variant}-50 dark:bg-zinc-800/50`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${category.variant}-100 text-${category.variant}-600 dark:bg-zinc-700 dark:text-white`}>
                                    {renderIcon(category.icon)}
                                </div>
                                <h2 className="font-bold text-lg text-gray-800 dark:text-white">{category.title}</h2>
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                                    {category.items.length} Items
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setEditingCategory(category); setIsCatModalOpen(true); }}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit Category"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteCategory(category.id, category.title)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Category"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setSelectedCategoryId(category.id); setEditingItem(null); setIsItemModalOpen(true); }}
                                    className="ml-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded flex items-center gap-1 hover:opacity-80 transition-opacity"
                                >
                                    <Plus className="w-3 h-3" /> Add Item
                                </button>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {category.items.map(item => (
                                <div key={item.id} className="group relative flex justify-between items-center p-3 border border-gray-100 dark:border-zinc-800 rounded-lg hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm transition-all bg-gray-50/50 dark:bg-zinc-800/30">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`p-2 rounded-lg bg-${category.variant}-100 text-${category.variant}-600 dark:bg-zinc-700 dark:text-gray-300 shrink-0`}>
                                            {renderIcon(category.icon)}
                                        </div>
                                        <div className="truncate">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate" title={item.title}>{item.title}</h3>
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">₹{item.price}</p>
                                        </div>
                                    </div>

                                    {/* Item Actions Overlay */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => { setEditingItem(item); setIsItemModalOpen(true); }}
                                            className="p-1.5 bg-white dark:bg-zinc-700 rounded shadow-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 border border-gray-100 dark:border-zinc-600"
                                        >
                                            <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.id, item.title)}
                                            className="p-1.5 bg-white dark:bg-zinc-700 rounded shadow-sm text-gray-500 dark:text-gray-400 hover:text-red-600 border border-gray-100 dark:border-zinc-600"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {category.items.length === 0 && (
                                <div className="col-span-full py-6 text-center text-gray-400 text-sm italic">
                                    No items in this category yet.
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredCategories.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No menus found matching "{search}"
                    </div>
                )}
            </div>

            {/* Modals */}
            <CategoryModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                initialData={editingCategory}
                title={editingCategory ? "Edit Category" : "Add New Category"}
            />

            <MenuItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
                initialData={editingItem}
                title={editingItem ? "Edit Item" : "Add New Item"}
            />
        </div>
    );
}
