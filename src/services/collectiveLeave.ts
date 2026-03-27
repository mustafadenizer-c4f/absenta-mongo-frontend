// src/services/collectiveLeave.ts
import { apiClient } from '../config/api';
import { CollectiveLeave } from '../types';

export interface CollectiveLeaveInput {
  startDate: string;
  endDate: string;
  scope: 'company' | 'group' | 'department' | 'team';
  scopeId: string;
  companyId: string;
  createdBy: string;
}

export interface CollectiveLeaveResult {
  collectiveLeaveId: string;
  totalDays: number;
  affectedEmployees: number;
  negativeBalanceEmployees: string[];
}

export const CollectiveLeaveService = {
  async createCollectiveLeave(input: CollectiveLeaveInput): Promise<CollectiveLeaveResult> {
    const body = {
      start_date: input.startDate,
      end_date: input.endDate,
      scope: input.scope,
      scope_id: input.scopeId,
      company_id: input.companyId,
      created_by: input.createdBy,
    };
    const data: any = await apiClient.post('/collective-leaves', body);
    return {
      collectiveLeaveId: data.id,
      totalDays: data.total_days,
      affectedEmployees: data.affected_employees,
      negativeBalanceEmployees: data.negative_balance_employees || [],
    };
  },

  async getCollectiveLeaves(companyId: string): Promise<CollectiveLeave[]> {
    const data = await apiClient.get<CollectiveLeave[]>('/collective-leaves', {
      company_id: companyId,
    });
    return data ?? [];
  },

  async deleteCollectiveLeave(id: string): Promise<void> {
    await apiClient.delete(`/collective-leaves/${id}`);
  },
};
