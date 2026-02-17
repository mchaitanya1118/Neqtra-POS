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
    Power,
    Home,
    Package,
    Truck,
    Utensils,
    PieChart,
    Users,
    Activity
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useTableStore } from "@/store/useTableStore";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "../notifications/NotificationCenter";

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
        { icon: Home, label: "Dashboard", path: "/dashboard" },
        { icon: BookOpen, label: "Billing", path: "/billing" },
        { icon: Store, label: "Orders", path: "/orders" },
        { icon: LayoutGrid, label: "Tables", path: "/tables" },
        { icon: Clock, label: "Reservations", path: "/reservations" },
        { icon: Truck, label: "Delivery", path: "/delivery" },
        { icon: Monitor, label: "KDS", path: "/kitchen" },
        { icon: Package, label: "Inventory", path: "/inventory" },
        { icon: Utensils, label: "Menu", path: "/menu" },
        { icon: Wallet, label: "Dues", path: "/dues" },
        { icon: PieChart, label: "Accounting", path: "/accounting" },
        { icon: ClipboardList, label: "Reports", path: "/reports" },
        { icon: Users, label: "Users", path: "/users" },
    ];

    return (
        <header className="h-20 bg-background/80 backdrop-blur-md border-b border-surface-light flex items-center px-6 justify-between shrink-0 sticky top-0 z-40">
            {/* Left Section */}
            <div className="flex items-center gap-6">
                {/* Menu functionality moved to floating Sidebar toggle */}
                <button
                    onClick={() => useUIStore.getState().toggleSidebar()}
                    className="w-10 h-10 rounded-[12px] border border-surface-light flex flex-col gap-1.5 items-center justify-center text-foreground hover:bg-surface-light hover:text-primary transition-all group"
                >
                    <div className="w-5 h-0.5 bg-foreground group-hover:bg-primary transition-colors" />
                    <div className="w-5 h-0.5 bg-foreground group-hover:bg-primary transition-colors" />
                </button>

                {/* Logo - Pushed left if menu is gone, or kept for branding */}

                <div className="hidden md:flex items-center">
                    <span className="text-3xl font-bold text-primary italic font-serif tracking-tighter">
                        N
                    </span>
                </div>

                {/* New Order Button */}
                <button
                    onClick={() => {
                        useCartStore.getState().clearCart();
                        useTableStore.getState().selectTable(null);
                        router.push('/billing');
                    }}
                    className="ml-2 bg-primary hover:bg-primary/90 text-primary-fg px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(105,215,189,0.3)] hover:shadow-[0_0_20px_rgba(105,215,189,0.5)] transition-all transform hover:scale-105 active:scale-95"
                >
                    New Order
                </button>

                {/* Search Bar */}
                <div className="ml-4 relative hidden md:block w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-transparent focus:border-primary/50 rounded-full text-sm text-foreground placeholder:text-muted focus:outline-none transition-all"
                        placeholder="Search Bill No..."
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
            <div className="flex items-center gap-2 md:gap-6">
                {/* Nav Icons */}
                <div className="hidden md:flex items-center gap-1 md:gap-2 border-r border-surface-light pr-6 mr-2 overflow-x-auto max-w-2xl no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={cn(
                                    "p-2.5 rounded-full transition-all relative group flex-shrink-0",
                                    isActive
                                        ? "text-primary bg-primary/10"
                                        : "text-muted hover:text-foreground hover:bg-surface-light"
                                )}
                                title={item.label}
                            >
                                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                {/* Tooltip-ish label on hover for desktop */}
                                <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-surface border border-surface-light px-2 py-0.5 rounded-md pointer-events-none z-50">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Notification */}
                <NotificationCenter />

                {/* Help */}
                <button className="p-2.5 rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors flex-shrink-0">
                    <HelpCircle className="w-5 h-5" />
                </button>

                {/* Power / Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted transition-colors flex-shrink-0"
                    title="Logout"
                >
                    <Power className="w-5 h-5" />
                </button>

                {/* Support Info (Pink Area) */}
                <div className="hidden lg:flex flex-col items-end bg-surface-light px-4 py-1.5 rounded-full border border-surface">
                    <span className="text-[10px] text-muted font-bold tracking-wider uppercase">Support</span>
                    <span className="text-sm font-bold text-primary tracking-wide">9000072227</span>
                </div>
            </div>
        </header>
    );
}
