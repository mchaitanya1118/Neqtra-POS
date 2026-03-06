import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from './config';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token & Tenant ID
apiClient.interceptors.request.use(
    (config) => {
        const state = useAuthStore.getState();
        const token = state.token;
        const user = state.user;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (user?.roleRel?.name === 'SuperAdmin' && config.headers['x-tenant-override']) {
            // Allow SuperAdmin to override tenant if needed (future proofing)
        } else if (user?.roleRel?.id) { // Assuming roleRel contains tenant info in future, but currently User has tenant
            // We need to access the user's tenant. 
            // Since useAuthStore user object might not have tenant hydrated fully if deep nested, 
            // let's rely on what's in the store. 
            // However, the User type in useAuthStore might need updating to include tenantId if not present.
            // Let's check useAuthStore again.
        }

        // For now, let's assume the user object in store has tenantId or we decode it. 
        // Actually, the login response returns user with tenantId.
        // Let's cast user to any for now to access tenantId until we update types.
        const tenantId = (user as any)?.tenantId;

        if (tenantId) {
            config.headers['x-tenant-id'] = tenantId;
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

        if ((status === 401 || status === 403) && !originalRequest._retry) {
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
