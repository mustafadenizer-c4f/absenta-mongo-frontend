// src/services/importantDays.ts
import { apiClient } from '../config/api';

export const ImportantDaysService = {
  async getAll(companyId?: string) {
    const params: Record<string, any> = {};
    if (companyId) params.company_id = companyId;

    const data = await apiClient.get('/important-days', params);
    return data;
  },

  async create(importantDayData: any) {
    const data = await apiClient.post('/important-days', importantDayData);
    return data;
  },

  async update(id: string, importantDayData: any) {
    const data = await apiClient.put(`/important-days/${id}`, importantDayData);
    return data;
  },

  async delete(id: string) {
    await apiClient.delete(`/important-days/${id}`);
  },
};
