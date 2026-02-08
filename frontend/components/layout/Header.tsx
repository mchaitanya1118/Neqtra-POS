"use client";

import {
    Menu,
    Search,
    BookOpen,
    Store,
    Wallet,
    LayoutGrid,
    Monitor,
    ClipboardList,
    Clock,
    Bell,
    HelpCircle,
    Power
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useTableStore } from "@/store/useTableStore";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = [
        { icon: BookOpen, label: "Billing", path: "/billing" },
        { icon: Store, label: "Orders", path: "/orders" },
        { icon: Wallet, label: "Dues", path: "/dues" },
        { icon: LayoutGrid, label: "Tables", path: "/tables" }, // 'Grid' icon for Tables
        { icon: Monitor, label: "KDS", path: "/kitchen" },
        { icon: ClipboardList, label: "Reports", path: "/reports" },
        { icon: Clock, label: "Reservations", path: "/reservations" },
    ];

    return (
        <header className="h-14 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between shrink-0 shadow-sm z-50">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Logo */}
                <div className="hidden md:flex items-center">
                    <span className="text-2xl font-bold text-[#d32f2f] italic font-serif tracking-tighter">
                        Neqtra
                    </span>
                </div>

                {/* New Order Button */}
                <button
                    onClick={() => {
                        useCartStore.getState().clearCart();
                        useTableStore.getState().selectTable(null);
                        router.push('/billing');
                    }}
                    className="ml-2 bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm transition-colors"
                >
                    New Order
                </button>

                {/* Search Bar */}
                <div className="ml-2 relative hidden md:block w-48">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:border-[#d32f2f]"
                        placeholder="Bill No"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = (e.target as HTMLInputElement).value;
                                if (val.trim()) {
                                    router.push(`/orders?search=${encodeURIComponent(val)}`);
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 md:gap-4">
                {/* Nav Icons */}
                <div className="hidden md:flex items-center gap-1 md:gap-2 border-r border-gray-200 dark:border-gray-700 pr-4 mr-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={cn(
                                    "p-2 rounded-lg transition-all relative group",
                                    isActive
                                        ? "text-[#d32f2f] bg-red-50 dark:bg-red-900/20"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                                title={item.label}
                            >
                                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            </Link>
                        );
                    })}
                </div>

                {/* Notification */}
                <button className="relative p-2 text-gray-500 hover:text-gray-800">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#e65100] text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                        22
                    </span>
                </button>

                {/* Help */}
                <button className="p-2 text-gray-500 hover:text-gray-800">
                    <HelpCircle className="w-5 h-5" />
                </button>

                {/* Power / Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-[#d32f2f] transition-colors"
                    title="Logout"
                >
                    <Power className="w-5 h-5" />
                </button>

                {/* Support Info (Pink Area) */}
                <div className="hidden lg:flex flex-col items-end bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded border-l-4 border-l-[#f8bbd0]">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Call For Support</span>
                    <span className="text-sm font-bold text-[#d32f2f]">07969 223344</span>
                </div>
            </div>
        </header>
    );
}
