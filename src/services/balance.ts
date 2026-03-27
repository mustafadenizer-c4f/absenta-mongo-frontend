// src/services/balance.ts
import { apiClient } from '../config/api';
import { EnhancedLeaveBalanceSummary } from '../types';

/**
 * Calculate the current leave period for a user based on their hire date.
 * The period runs from hire anniversary to hire anniversary.
 * This is kept as a local utility — no API call needed.
 */
function getCurrentPeriod(hireDate: string): { start: string; end: string } {
  const hire = new Date(hireDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent anniversary
  const thisYearAnniversary = new Date(today.getFullYear(), hire.getMonth(), hire.getDate());

  let periodStart: Date;
  if (thisYearAnniversary <= today) {
    periodStart = thisYearAnniversary;
  } else {
    periodStart = new Date(today.getFullYear() - 1, hire.getMonth(), hire.getDate());
  }

  const periodEnd = new Date(periodStart);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  periodEnd.setDate(periodEnd.getDate() - 1);

  return {
    start: periodStart.toISOString().split('T')[0],
    end: periodEnd.toISOString().split('T')[0],
  };
}

export const BalanceService = {
  getCurrentPeriod,

  async getBalances(
    userId: string,
    hireDate: string,
    birthDate: string,
    companyId?: string
  ): Promise<EnhancedLeaveBalanceSummary[]> {
    const params: Record<string, any> = {
      hire_date: hireDate,
      birth_date: birthDate,
    };
    if (companyId) params.company_id = companyId;

    const data = await apiClient.get<EnhancedLeaveBalanceSummary[]>(
      `/balances/${userId}`,
      params
    );
    return data ?? [];
  },

  async calculateCarryover(
    userId: string,
    hireDate: string,
    birthDate: string,
    leaveTypeId: string
  ): Promise<number> {
    const params: Record<string, any> = {
      hire_date: hireDate,
      birth_date: birthDate,
    };
    const data = await apiClient.get<{ carryover: number }>(
      `/balances/${userId}/${leaveTypeId}/carryover`,
      params
    );
    return data?.carryover ?? 0;
  },

  async getBalance(
    userId: string,
    leaveTypeId: string,
    hireDate: string,
    birthDate: string
  ): Promise<EnhancedLeaveBalanceSummary> {
    const params: Record<string, any> = {
      hire_date: hireDate,
      birth_date: birthDate,
    };
    const data = await apiClient.get<EnhancedLeaveBalanceSummary>(
      `/balances/${userId}/${leaveTypeId}`,
      params
    );
    return data;
  },
};
