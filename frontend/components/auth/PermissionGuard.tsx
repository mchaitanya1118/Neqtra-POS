"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: string;
    fallback?: React.ReactNode;
    redirect?: string;
}

export function PermissionGuard({
    children,
    permission,
    fallback = null,
    redirect
}: PermissionGuardProps) {
    const { hasPermission, hasHydrated, user } = useAuthStore();
    const router = useRouter();

    const allowed = !permission || hasPermission(permission);

    useEffect(() => {
        if (hasHydrated && !allowed && redirect) {
            router.replace(redirect);
        }
    }, [allowed, hasHydrated, redirect, router]);

    if (!hasHydrated) return null;

    if (!allowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
