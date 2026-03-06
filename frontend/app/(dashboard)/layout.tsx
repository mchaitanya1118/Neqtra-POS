"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const Sidebar = dynamic(() => import("@/components/layout/Sidebar").then(mod => mod.Sidebar), { ssr: false });
const Header = dynamic(() => import("@/components/layout/Header").then(mod => mod.Header), { ssr: false });
const OfflineSync = dynamic(() => import("@/components/shared/OfflineSync").then(mod => mod.OfflineSync), { ssr: false });
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";

const ROUTE_PERMISSIONS: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/billing": "Billing",
    "/orders": "Orders",
    "/tables": "Table Services",
    "/kitchen": "KDS",
    "/reservations": "Reservations",
    "/delivery": "Delivery",
    "/inventory": "Inventory",
    "/menu": "Menu",
    "/dues": "Dues",
    "/reports": "Reports",
    "/accounting": "Accounting",
    "/users": "Users",
    "/subscription": "Tenant",
    "/settings": "Tenant",
    "/branches": "Tenant",
    "/admin": "SaaS Admin",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const requiredPermission = ROUTE_PERMISSIONS[pathname] ||
        Object.entries(ROUTE_PERMISSIONS).find(([path]) => pathname.startsWith(path))?.[1];

    // Determine safe redirect if unauthorized
    // If they can't access current page, where should they go?
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === 'SuperAdmin' || user?.roleRel?.name === 'SuperAdmin';
    const isWaiter = user?.role === 'Waiter' || user?.roleRel?.name === 'Waiter';
    const isLowLatency = useUIStore((state) => state.lowLatencyMode);

    let redirectPath = "/billing"; // Default fallback
    if (isSuperAdmin) redirectPath = "/admin";
    if (isWaiter) redirectPath = "/tables";

    const isDashboard = pathname === '/dashboard';

    return (
        <AuthGuard>
            <PermissionGuard permission={requiredPermission} redirect={redirectPath}>
                <MotionConfig reducedMotion={isLowLatency ? "always" : "user"}>
                    {isDashboard ? (
                        <>
                            <Sidebar />
                            <OfflineSync />
                            {children}
                        </>
                    ) : (
                        <div className="flex flex-col h-screen overflow-hidden bg-background">
                            {/* Header - Still useful for Title/Search/User, but standard Menu button might be redundant. */}
                            <Header onMenuClick={() => { }} />

                            {/* Mobile/Overlay Navigation */}
                            <Sidebar />

                            <OfflineSync />

                            {/* Main Content Area - Full width now */}
                            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                                    {children}
                                </main>
                            </div>
                        </div>
                    )}
                </MotionConfig>
            </PermissionGuard>
        </AuthGuard>
    );
}
