import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from './config';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Tenant ID & Tenant Slug
apiClient.interceptors.request.use(
    (config) => {
        const state = useAuthStore.getState();
        const token = state.token;
        const user = state.user;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Attach tenant ID from logged in user
        const tenantId = (user as any)?.tenantId;
        if (tenantId) {
            config.headers['x-tenant-id'] = tenantId;
        }

        // Attach tenant slug from URL for the backend middleware (because proxy drops Host header)
        if (typeof window !== 'undefined') {
            const host = window.location.hostname;
            const base = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'neqtra.com';
            let sub = null;

            if (host.endsWith(base) && host !== base) {
                sub = host.replace(`.${base}`, '');
            } else if (host.includes('localhost') || host.split('.').length > 2) {
                const parts = host.split('.');
                if (parts.length > 2 || (parts.length === 2 && parts[1] === 'localhost')) {
                    sub = parts[0];
                }
            }

            if (sub && sub !== 'www' && sub !== 'app') {
                config.headers['x-tenant-slug'] = sub;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const status = Number(error.response?.status);

        // Skip automatic logout/redirect for authentication or device registration endpoints
        // because those functions have their own localized try/catch blocks to display custom error messages
        const isAuthOrDeviceEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/devices/register');

        if ((status === 401 || status === 403) && !originalRequest._retry && !isAuthOrDeviceEndpoint) {
            originalRequest._retry = true;

            // Session has expired or access is revoked (e.g. tenant DB missing)
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
