"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

// Simple string hash function
function hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

// Generate an elegant vibrant HSL color from string
function generateTenantColor(tenantId: string) {
    const hash = Math.abs(hashString(tenantId));
    const hue = hash % 360;
    // Keep saturation high (70%) and lightness around 60% for dark mode visibility
    // This generates beautiful vibrant colors that map consistently to the exact same tenant
    return `hsl(${hue}, 70%, 60%)`;
}

// Calculate foreground color (text ON the primary color)
function generateTenantFgColor(tenantId: string) {
    const hash = Math.abs(hashString(tenantId));
    const hue = hash % 360;
    // Extremely dark version of the same hue for maximum contrast on the bright primary background
    return `hsl(${hue}, 90%, 10%)`;
}

export function TenantThemeProvider() {
    const { user } = useAuthStore();

    useEffect(() => {
        if (user?.tenantId) {
            const primaryColor = generateTenantColor(user.tenantId);
            const primaryFgColor = generateTenantFgColor(user.tenantId);

            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--primary-fg', primaryFgColor);
            document.documentElement.style.setProperty('--success', primaryColor);
        } else {
            // Revert to default Zoox Mint if logged out
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--primary-fg');
            document.documentElement.style.removeProperty('--success');
        }
    }, [user?.tenantId]);

    return null;
}
