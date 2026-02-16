"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OfflineSync } from "@/components/OfflineSync";
import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // We don't need local state for sidebar anymore if Sidebar handles it internally, 
    // OR we can keep it if we want the layout to control the initial open state (e.g. from Header).
    // For now, let's allow Sidebar to handle its own toggle state via the Floating Button.

    return (
        <AuthGuard>
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
        </AuthGuard>
    );
}
