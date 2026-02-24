import apiClient from '@/lib/api';

export class BranchService {
    static async getBranches() {
        const response = await apiClient.get('/branches');
        return response.data;
    }

    static async createBranch(data: { name: string, address?: string, phone?: string }) {
        const response = await apiClient.post('/branches', data);
        return response.data;
    }

    static async deleteBranch(id: string) {
        const response = await apiClient.delete(`/branches/${id}`);
        return response.data;
    }
}
