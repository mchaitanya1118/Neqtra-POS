import apiClient from '@/lib/api';
import { db } from '@/lib/db';

export const syncOfflineOrders = async () => {
    const offlineOrders = await db.orders.where('status').equals('PENDING').toArray();

    if (offlineOrders.length === 0) return;

    console.log(`Syncing ${offlineOrders.length} offline orders...`);

    for (const order of offlineOrders) {
        try {
            // Remove local-only fields before sending to server
            const { id, status, tempId, ...orderData } = order;

            const response = await apiClient.post('/orders', orderData);

            if (response.status === 201 || response.status === 200) {
                // Successfully synced
                await db.orders.update(order.id!, { status: 'SYNCED' });
                console.log(`Order ${tempId} synced successfully.`);
            }
        } catch (error) {
            console.error(`Failed to sync order ${order.tempId}:`, error);
            // If it's a validation error, we might need to handle it differently 
            // but for now we just try again on the next sync cycle.
        }
    }
};

// Start a background interval for syncing
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('Online detected. Starting sync...');
        syncOfflineOrders();
    });

    // Check every 5 minutes just in case
    setInterval(syncOfflineOrders, 5 * 60 * 1000);
}
