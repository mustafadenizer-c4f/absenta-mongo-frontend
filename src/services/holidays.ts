// src/services/holidays.ts
import { apiClient } from '../config/api';

export const HolidaysService = {
  async getAll(companyId?: string) {
    const params: Record<string, any> = {};
    if (companyId) params.company_id = companyId;

    const data = await apiClient.get('/holidays', params);
    return data;
  },

  async create(holidayData: any) {
    const data = await apiClient.post('/holidays', holidayData);
    return data;
  },

  async update(id: string, holidayData: any) {
    const data = await apiClient.put(`/holidays/${id}`, holidayData);
    return data;
  },

  async delete(id: string) {
    await apiClient.delete(`/holidays/${id}`);
  },
};
