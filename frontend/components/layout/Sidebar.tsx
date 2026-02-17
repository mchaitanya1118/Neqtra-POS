"use client";

import {
    X,
    ChevronRight,
    Home,
    BookOpen,
    Store,
    LayoutGrid,
    Clock,
    Truck,
    Monitor,
    Package,
    Utensils,
    Wallet,
    PieChart,
    ClipboardList,
    Users,
    Activity,
    Settings,
    HelpCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const menuGroups = [
    {
        title: "Main Navigation",
        items: [
            { p: "/dashboard", label: "Dashboard", icon: Home, permission: "Dashboard" },
            { p: "/billing", label: "Billing", icon: BookOpen, permission: "Billing" },
            { p: "/orders", label: "Orders", icon: Store, permission: "Orders" },
            { p: "/tables", label: "Table Services", icon: LayoutGrid, permission: "Table Services" },
            { p: "/kitchen", label: "KDS", icon: Monitor, permission: "KDS" },
        ]
    },
    {
        title: "Management",
        items: [
            { p: "/reservations", label: "Reservations", icon: Clock, permission: "Reservations" },
            { p: "/delivery", label: "Delivery", icon: Truck, permission: "Delivery" },
            { p: "/inventory", label: "Inventory", icon: Package, permission: "Inventory" },
            { p: "/menu", label: "Menu Catalog", icon: Utensils, permission: "Menu" },
            { p: "/dues", label: "Customer Dues", icon: Wallet, permission: "Dues" },
        ]
    },
    {
        title: "Administration",
        items: [
            { p: "/reports", label: "Analytics & Reports", icon: ClipboardList, permission: "Reports" },
            { p: "/accounting", label: "Accounting", icon: PieChart, permission: "Accounting" },
            { p: "/users", label: "Team Management", icon: Users, permission: "Users" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, hasPermission } = useAuthStore();
    const { isSidebarOpen, setSidebarOpen } = useUIStore();

    const filteredMenuGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission))
    })).filter(group => group.items.length > 0);

    const closeMenu = () => setSidebarOpen(false);

    useEffect(() => {
        if (isSidebarOpen) {
            closeMenu();
        }
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03,
                delayChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.02,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
    };

    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMenu}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 35 }}
                        className="fixed top-0 left-0 h-full z-[70] w-full max-w-[340px] bg-background border-r border-surface-light shadow-2xl flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 h-20 border-b border-surface-light shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary italic font-serif">N</span>
                                </div>
                                <span className="text-xl font-bold tracking-tight">Neqtra POS</span>
                            </div>
                            <button
                                onClick={closeMenu}
                                className="w-10 h-10 rounded-xl hover:bg-surface-light flex items-center justify-center transition-colors group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
                            <motion.nav
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                                className="px-4 space-y-8"
                            >
                                {filteredMenuGroups.map((group) => (
                                    <div key={group.title} className="space-y-2">
                                        <h3 className="px-4 text-[11px] font-bold uppercase tracking-[2px] text-muted mb-4">{group.title}</h3>
                                        <div className="space-y-1">
                                            {group.items.map((item) => {
                                                const isActive = pathname === item.p || (item.p !== '/' && pathname.startsWith(item.p));
                                                return (
                                                    <motion.div variants={itemVariants} key={item.p}>
                                                        <Link
                                                            href={item.p}
                                                            className={cn(
                                                                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden",
                                                                isActive
                                                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                                                    : "text-muted hover:text-foreground hover:bg-surface-light/50"
                                                            )}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="active-pill"
                                                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                                                />
                                                            )}
                                                            <item.icon className={cn("w-5 h-5", isActive ? "text-primary scale-110" : "group-hover:text-primary transition-all")} />
                                                            <span className="text-sm tracking-tight">{item.label}</span>
                                                            {isActive && (
                                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                            )}
                                                        </Link>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </motion.nav>
                        </div>

                        <div className="p-6 border-t border-surface-light bg-surface/30">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold truncate max-w-[120px]">{user?.name || 'User'}</span>
                                    <span className="text-[10px] text-muted uppercase tracking-wider">{user?.role || 'Staff'}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 rounded-lg bg-surface hover:bg-destructive hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider border border-surface-light shadow-sm"
                                >
                                    Sign Out
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 text-primary">
                                    <HelpCircle className="w-4 h-4" />
                                    <span className="text-[11px] font-bold">Support</span>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-primary">9000072227</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
