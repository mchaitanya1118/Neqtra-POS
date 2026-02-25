import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';

type User = {
    id: number;
    name: string;
    role: string;
    tenantId?: string;
    branchId?: string;
    roleRel?: {
        id: number;
        name: string;
        permissions: string[];
    };
    subscriptionPlan?: string;
};

type AuthState = {
    user: User | null;
    token: string | null;
    hasHydrated: boolean;
    login: (credentials: { passcode?: string; username?: string; password?: string }) => Promise<{ success: boolean; error?: string; user?: User }>;
    signup: (data: any) => Promise<{ success: boolean; error?: string; user?: User; login_url?: string }>;
    logout: () => void;
    setHasHydrated: (state: boolean) => void;
    hasPermission: (permission: string) => boolean;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            hasHydrated: false,
            login: async (credentials) => {
                // Clear any lingering cache from previous sessions before logging in
                Object.keys(localStorage).forEach(key => {
                    if (key !== 'auth-storage' && key !== 'neqtra_device_id') {
                        localStorage.removeItem(key);
                    }
                });

                try {
                    const response = await apiClient.post('/auth/login', credentials);
                    const data = response.data;

                    // Temporarily set token to allow device registration call to succeed
                    set({ user: data.user, token: data.access_token });

                    // Register device
                    try {
                        const deviceId = getDeviceId();
                        const deviceName = typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 30) : 'Web Terminal';
                        await apiClient.post('/devices/register', {
                            name: deviceName,
                            identifier: deviceId,
                            branchId: data.user.branchId
                        });
                    } catch (deviceError: any) {
                        // If device registration fails (e.g. limit reached), undo login
                        set({ user: null, token: null });
                        console.error('Device registration failed:', deviceError);
                        return {
                            success: false,
                            error: deviceError.response?.data?.message || 'Device limit reached for your subscription plan.'
                        };
                    }

                    return { success: true, user: data.user };
                } catch (error: any) {
                    console.error('Login error:', error);
                    return {
                        success: false,
                        error: error.response?.data?.message || error.message || 'Login failed'
                    };
                }
            },
            signup: async (data: any) => {
                // Clear any lingering cache from previous sessions before signing up
                Object.keys(localStorage).forEach(key => {
                    if (key !== 'auth-storage' && key !== 'neqtra_device_id') {
                        localStorage.removeItem(key);
                    }
                });

                try {
                    const response = await apiClient.post('/auth/signup', data);
                    const responseData = response.data;

                    // Temporarily set token to allow device registration
                    set({ user: responseData.user, token: responseData.access_token });

                    // Register device
                    try {
                        const deviceId = getDeviceId();
                        const deviceName = typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 30) : 'Web Terminal';
                        await apiClient.post('/devices/register', {
                            name: deviceName,
                            identifier: deviceId,
                            branchId: responseData.user.branchId
                        });
                    } catch (deviceError: any) {
                        set({ user: null, token: null });
                        console.error('Device registration failed on signup:', deviceError);
                        return {
                            success: false,
                            error: deviceError.response?.data?.message || 'Device registration failed.'
                        };
                    }

                    return { success: true, user: responseData.user, login_url: responseData.login_url };
                } catch (error: any) {
                    console.error('Signup error:', error);
                    return {
                        success: false,
                        error: error.response?.data?.message || error.message || 'Signup failed'
                    };
                }
            },
            logout: async () => {
                try {
                    // Tell backend to blacklist the token
                    await apiClient.post('/auth/logout');
                } catch (e) {
                    console.error('Failed to notify backend of logout:', e);
                }

                // Wipe all tenant-specific cached stores upon logout
                Object.keys(localStorage).forEach(key => {
                    if (key !== 'auth-storage' && key !== 'neqtra_device_id') {
                        localStorage.removeItem(key);
                    }
                });
                set({ user: null, token: null });
            },
            setHasHydrated: (state) => set({ hasHydrated: state }),
            hasPermission: (perm) => {
                const user = get().user;
                if (!user) return false;

                // Case-insensitive Admin check
                const roleLower = user.role?.toLowerCase();

                // Only SuperAdmins can pass explicitly restricted platform-level permissions
                if (perm === 'Tenant' || perm === 'SaaS Admin') {
                    return roleLower === 'superadmin';
                }

                if (roleLower === 'admin' || roleLower === 'superadmin') return true;

                // Explicit permission check from roleRel
                if (user.roleRel?.permissions.includes(perm)) return true;

                // Fallback for legacy users where roleRel might not be hydrated in localStorage yet
                if (roleLower === 'staff') {
                    const staffPerms = ['Orders', 'Table Services', 'Billing'];
                    if (staffPerms.includes(perm)) return true;
                }
                if (roleLower === 'cashier') {
                    const cashierPerms = ['Orders', 'Table Services', 'Billing', 'Dues'];
                    if (cashierPerms.includes(perm)) return true;
                }

                return false;
            },
        }),
        {
            name: 'auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
