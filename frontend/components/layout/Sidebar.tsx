"use client";

import {
    CalendarDays,
    UtensilsCrossed,
    LayoutGrid,
    Truck,
    Receipt,
    LogOut,
    Settings,
    BarChart,
    Box,
    LayoutDashboard,
    Wallet,
    ShoppingBag,
    X,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

const menuItems = [
    { p: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { p: "/orders", icon: ShoppingBag, label: "Orders" },
    { p: "/reservations", icon: CalendarDays, label: "Reservations" },
    { p: "/tables", icon: UtensilsCrossed, label: "Table Services" },
    { p: "/billing", icon: LayoutGrid, label: "Billing" },
    { p: "/delivery", icon: Truck, label: "Delivery" },
    { p: "/inventory", icon: Box, label: "Inventory" },
    { p: "/dues", icon: Wallet, label: "Dues" },
    { p: "/reports", icon: BarChart, label: "Reports" },
    { p: "/menu", icon: BookOpen, label: "Menu" },
    { p: "/accounting", icon: Receipt, label: "Accounting" },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();

    // Close on route change
    useEffect(() => {
        onClose();
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const filteredMenuItems = user?.role === 'Waiter'
        ? menuItems.filter(item => ['/tables', '/orders', '/billing'].includes(item.p))
        : menuItems;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 z-50 shadow-2xl transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#d32f2f] text-white flex items-center justify-center font-bold text-lg">
                            N
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-none">Neqtra</h1>
                            <span className="text-xs text-gray-500">POS System</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                    {filteredMenuItems.map((item) => {
                        const isActive = pathname === item.p;
                        return (
                            <Link
                                key={item.p}
                                href={item.p}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm",
                                    isActive
                                        ? "bg-red-50 text-[#d32f2f] dark:bg-red-900/20"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e]">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.role || 'Staff'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="hover:text-red-500 transition-colors p-2"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
