import apiClient from '@/lib/api';

export interface Device {
    id: string;
    name: string;
    identifier: string;
    status: string;
    lastActive: string;
    createdAt: string;
}

export const DevicesService = {
    getAllDevices: async () => {
        const { data } = await apiClient.get<Device[]>('/devices');
        return data;
    },

    revokeDevice: async (id: string) => {
        const { data } = await apiClient.patch<Device>(`/devices/${id}/revoke`);
        return data;
    }
};
