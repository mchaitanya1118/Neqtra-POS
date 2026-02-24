
import { db, Order } from '@/lib/db';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

class SyncService {
    private isSyncing = false;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.sync());
        }
    }

    async sync() {
        if (this.isSyncing || !navigator.onLine) return;
        this.isSyncing = true;

        try {
            console.log('Starting sync...');
            await this.pushOrders();
            await this.pullData();
            console.log('Sync completed.');
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    // Push pending orders to backend
    private async pushOrders() {
        const pendingOrders = await db.orders.where('status').equals('PENDING').toArray();

        for (const order of pendingOrders) {
            try {
                // Prepare payload (adapt as per backend requirement)
                const payload = {
                    items: order.items,
                    totalAmount: order.totalAmount,
                    // Add other fields mapped from local order
                    tenantId: order.tenantId,
                };

                await apiClient.post('/orders', payload);

                // Mark as synced
                await db.orders.update(order.id!, { status: 'SYNCED' });
            } catch (error) {
                console.error(`Failed to push order ${order.id}:`, error);
                // If 400 error, maybe mark as FAILED?
            }
        }
    }

    // Pull latest products and categories
    private async pullData() {
        const tenantId = useAuthStore.getState().user?.tenantId;
        if (!tenantId) return;

        // Fetch Categories
        try {
            const { data: categories } = await apiClient.get('/menu/categories'); // Adjust endpoint
            await db.categories.clear();
            await db.categories.bulkPut(categories.map((c: any) => ({
                id: c.id,
                name: c.name,
                tenantId: c.tenantId
            })));
        } catch (e) { console.error('Failed to pull categories', e); }

        // Fetch Products
        try {
            const { data: products } = await apiClient.get('/menu/items'); // Adjust endpoint
            await db.products.clear();
            await db.products.bulkPut(products.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                categoryId: p.category?.id, // Ensure backend returns category object or ID
                tenantId: p.tenantId,
                image: p.image,
                description: p.description,
                isVeg: p.isVeg
            })));
        } catch (e) { console.error('Failed to pull products', e); }
    }
}

export const syncService = new SyncService();
