"use client";

import {
    X,
    ChevronRight,

} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const menuItems = [
    { p: "/dashboard", label: "Dashboard" },
    { p: "/orders", label: "Orders" },
    { p: "/reservations", label: "Reservations" },
    { p: "/tables", label: "Table Services" },
    { p: "/billing", label: "Billing" },
    { p: "/delivery", label: "Delivery" },
    { p: "/kitchen", label: "KDS" },
    { p: "/inventory", label: "Inventory" },
    { p: "/dues", label: "Dues" },
    { p: "/reports", label: "Reports" },
    { p: "/menu", label: "Menu" },
    { p: "/accounting", label: "Accounting" },
    { p: "/users", label: "Users" },
];



export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { isSidebarOpen, setSidebarOpen } = useUIStore();

    const closeMenu = () => setSidebarOpen(false);

    // Close on route change
    useEffect(() => {
        closeMenu();
    }, [pathname]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Staggered animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMenu}
                        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Floating Sidebar Panel */}
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full z-[70] w-[85vw] md:w-[400px] bg-background/95 backdrop-blur-3xl border-r border-surface-light shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="flex items-center justify-between p-6 shrink-0 h-20">
                            {/* Close Button */}
                            <button
                                onClick={closeMenu}
                                className="w-10 h-10 rounded-[12px] border border-surface-light flex items-center justify-center hover:bg-surface-light transition-colors group bg-background/50"
                            >
                                <X className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                            </button>

                            {/* Logo */}
                            <div className="text-2xl font-bold tracking-tighter font-serif italic text-foreground">
                                NEQTRA
                            </div>

                            {/* Spacer */}
                            <div className="w-10" />
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-hidden px-6 md:px-12 pb-6">
                            <div className="max-w-md mx-auto flex flex-col h-full">

                                {/* Main Navigation Links */}
                                <motion.nav
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    exit="exit"
                                    className="flex flex-col gap-1 py-4 md:py-6"
                                >
                                    {menuItems.map((item) => (
                                        <motion.div variants={itemVariants} key={item.p}>
                                            <Link
                                                href={item.p}
                                                className="group flex items-center justify-between text-lg md:text-xl font-medium tracking-tight hover:text-primary transition-colors py-2"
                                            >
                                                <span className="group-hover:translate-x-2 transition-transform duration-300">{item.label}</span>
                                                <div className="w-8 h-8 rounded-full bg-surface-light text-foreground group-hover:bg-primary group-hover:text-primary-fg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </motion.nav>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-auto pt-4"
                                >


                                    {/* Footer / Socials */}
                                    <div className="flex flex-col gap-4 p-5 rounded-[24px] border border-surface-light bg-surface/30 hover:bg-surface/50 transition-colors">
                                        {/* User Info */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">{user?.name || 'User'}</p>
                                                <p className="text-[10px] text-muted uppercase tracking-wider">{user?.role || 'Staff'}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="px-5 py-2 rounded-full bg-surface text-foreground hover:bg-destructive hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider border border-surface-light shadow-sm hover:shadow-md"
                                            >
                                                Log Out
                                            </button>
                                        </div>




                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
