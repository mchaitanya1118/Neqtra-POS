"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { API_URL } from "@/lib/config";

export function OfflineSync() {
    const { pendingOrders, removeOrder } = useOfflineStore();

    useEffect(() => {
        const handleOnline = async () => {
            console.log("Back Online! Syncing orders...");
            if (pendingOrders.length === 0) return;

            for (const order of pendingOrders) {
                try {
                    const res = await fetch(`${API_URL}/orders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tableName: order.tableName,
                            items: order.items
                        })
                    });

                    if (res.ok) {
                        removeOrder(order.id);
                        console.log(`Synced order for ${order.tableName}`);
                    }
                } catch (e) {
                    console.error("Sync failed for order", order.id);
                }
            }
        };

        window.addEventListener("online", handleOnline);

        // Sync immediately if already online and we have pending orders
        if (navigator.onLine && pendingOrders.length > 0) {
            handleOnline();
        }

        return () => window.removeEventListener("online", handleOnline);
    }, [pendingOrders, removeOrder]);

    return null; // Headless component
}
