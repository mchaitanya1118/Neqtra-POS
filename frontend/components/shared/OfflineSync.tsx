"use client";

import { useEffect } from "react";
import { syncOfflineOrders } from "@/services/sync-manager";

export function OfflineSync() {
    useEffect(() => {
        // Run sync on mount
        syncOfflineOrders();

        const handleOnline = () => {
            console.log("Back Online! Syncing orders...");
            syncOfflineOrders();
        };

        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, []);

    return null; // Headless component
}
