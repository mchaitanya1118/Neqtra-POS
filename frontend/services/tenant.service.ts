import apiClient from '@/lib/api';

export class TenantService {
    static async getProfile() {
        // Technically, `auth/login` currently returns the user tenant object.
        // We could fetch a fresh profile via `GET /tenants/profile` if we add it,
        // but for now we expect the page to be instantiated with `authStore` data
        // and only require a `PATCH` update mechanism.
    }

    static async updateProfile(data: { name?: string, email?: string, phone?: string, currency?: string, taxRate?: number }) {
        const response = await apiClient.patch('/tenants/profile', data);
        return response.data;
    }
}
