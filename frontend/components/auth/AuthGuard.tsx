"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (hasHydrated && !user) {
            router.replace("/");
        }
    }, [user, hasHydrated, router]);

    if (!hasHydrated) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-[#1a1b1e]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d32f2f]"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
