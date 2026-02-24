import api from '@/lib/api';

export class SubscriptionService {
    static async createCheckoutSession(priceId: string): Promise<{ url: string }> {
        const response = await api.post('/subscriptions/create-checkout-session', { priceId });
        return response.data;
    }

    static async getPortalSession(): Promise<{ url: string }> {
        const response = await api.get('/subscriptions/portal-session');
        return response.data;
    }

    static async getQuota(): Promise<any> {
        const response = await api.get('/subscriptions/quota');
        return response.data;
    }
}
