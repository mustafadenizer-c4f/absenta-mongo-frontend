// src/services/users.ts
import { apiClient } from '../config/api';

export const UsersService = {
  async getAll(companyId?: string) {
    const params: Record<string, any> = {};
    if (companyId) params.company_id = companyId;

    const data = await apiClient.get('/users', params);
    return data;
  },

  async getById(id: string) {
    const data = await apiClient.get(`/users/${id}`);
    return data;
  },

  async update(id: string, userData: any) {
    const data = await apiClient.put(`/users/${id}`, userData);
    return data;
  },

  async create(userData: any) {
    const data = await apiClient.post('/users', userData);
    return data;
  },

  async delete(id: string) {
    await apiClient.delete(`/users/${id}`);
  },

  async resetPassword(userId: string) {
    const data = await apiClient.post(`/users/${userId}/reset-password`);
    return data;
  },
};
