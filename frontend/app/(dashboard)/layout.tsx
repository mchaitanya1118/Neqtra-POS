"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OfflineSync } from "@/components/shared/OfflineSync";
import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

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

    let redirectPath = "/billing"; // Default fallback
    if (isSuperAdmin) redirectPath = "/admin";
    if (isWaiter) redirectPath = "/tables";

    const isDashboard = pathname === '/dashboard';

    return (
        <AuthGuard>
            <PermissionGuard permission={requiredPermission} redirect={redirectPath}>
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
            </PermissionGuard>
        </AuthGuard>
    );
}
