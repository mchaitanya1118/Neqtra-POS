"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { OfflineSync } from "@/components/OfflineSync";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthGuard>
            <div className="flex flex-col h-screen overflow-hidden bg-background">
                {/* Top Navigation */}
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Sidebar Drawer */}
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <OfflineSync />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <main className="flex-1 overflow-y-auto relative">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    );
}
