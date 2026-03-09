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
    Activity,
    Zap
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
    const { logout, hasPermission } = useAuthStore();
    const cartItems = useCartStore((state) => state.items);
    const lowLatencyMode = useUIStore((state) => state.lowLatencyMode);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navItems = [
        { icon: Home, label: "Dashboard", path: "/dashboard", permission: "Dashboard" },
        { icon: BookOpen, label: "Billing", path: "/billing", permission: "Billing" },
        { icon: Store, label: "Orders", path: "/orders", permission: "Orders" },
        { icon: LayoutGrid, label: "Tables", path: "/tables", permission: "Table Services" },
        { icon: Monitor, label: "KDS", path: "/kitchen", permission: "KDS" },
    ];

    const filteredNavItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

    return (
        <header className="h-16 md:h-20 bg-background/80 backdrop-blur-md border-b border-surface-light flex items-center px-4 md:px-6 justify-between shrink-0 sticky top-0 z-[50]">
            {/* Left Section */}
            <div className="flex items-center gap-3 md:gap-6">
                {/* Menu functionality moved to floating Sidebar toggle */}
                <button
                    onClick={() => useUIStore.getState().toggleSidebar()}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-[10px] md:rounded-[12px] border border-surface-light flex flex-col gap-1.5 items-center justify-center text-foreground hover:bg-surface-light hover:text-primary transition-all group shrink-0"
                >
                    <div className="w-5 h-0.5 md:w-6 md:h-0.5 bg-foreground group-hover:bg-primary transition-colors" />
                    <div className="w-5 h-0.5 md:w-6 md:h-0.5 bg-foreground group-hover:bg-primary transition-colors" />
                </button>

                {/* Logo - Pushed left if menu is gone, or kept for branding */}
                <div className="hidden md:flex items-center shrink-0">
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
                    className="ml-0 md:ml-2 bg-primary hover:bg-primary/90 text-primary-fg px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold shadow-[0_0_15px_rgba(105,215,189,0.3)] hover:shadow-[0_0_20px_rgba(105,215,189,0.5)] transition-all transform hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap"
                >
                    New Order
                </button>

                {/* Search Bar */}
                <div className="ml-4 relative hidden md:block w-64 shrink-0">
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
            <div className="flex items-center gap-1 md:gap-6 shrink-0">
                {/* Nav Icons */}
                <div className="hidden xl:flex items-center gap-2 border-r border-surface-light pr-4 mr-2 flex-shrink-0">
                    {filteredNavItems.map((item) => {
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
                <div className="scale-90 md:scale-100 origin-right">
                    <NotificationCenter />
                </div>

                {/* Low Latency Toggle */}
                <button
                    onClick={() => useUIStore.getState().toggleLowLatencyMode()}
                    className={cn(
                        "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all flex-shrink-0",
                        lowLatencyMode
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            : "bg-surface border-surface-light text-muted hover:text-foreground"
                    )}
                    title="Toggle Ultra-Low Latency Mode for slow devices"
                >
                    <Zap className={cn("w-4 h-4", lowLatencyMode && "fill-amber-500")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fast Mode</span>
                </button>

                {/* Help */}
                <button className="p-2 md:p-2.5 rounded-full hover:bg-surface-light text-muted hover:text-foreground transition-colors flex-shrink-0">
                    <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Power / Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 md:p-2.5 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted transition-colors flex-shrink-0"
                    title="Logout"
                >
                    <Power className="w-4 h-4 md:w-5 md:h-5" />
                </button>

            </div>
        </header>
    );
}
