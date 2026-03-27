// src/services/leave.ts
import { apiClient } from '../config/api';
import { User } from '../types';

export interface LeaveRequestFilters {
  status?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  company_id?: string;
  group_id?: string;
  department_id?: string;
}

function buildLeaveQueryParams(filters?: LeaveRequestFilters): Record<string, any> {
  const params: Record<string, any> = {};
  if (!filters) return params;
  if (filters.status) params.status = filters.status;
  if (filters.leaveTypeId) params.leave_type_id = filters.leaveTypeId;
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;
  if (filters.page !== undefined) params.page = filters.page;
  if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
  if (filters.company_id) params.company_id = filters.company_id;
  if (filters.group_id) params.group_id = filters.group_id;
  if (filters.department_id) params.department_id = filters.department_id;
  return params;
}

export const LeaveService = {
  async getRequests(userId?: string) {
    if (userId) {
      const result = await apiClient.get('/leave-requests/my', { user_id: userId });
      // The backend may return { data, count } or an array — normalize
      return Array.isArray(result) ? result : result.data ?? result;
    }
    const result = await apiClient.get('/leave-requests/scope');
    return Array.isArray(result) ? result : result.data ?? result;
  },

  async getRequestsByUser(
    userId: string,
    filters?: LeaveRequestFilters
  ) {
    const params = buildLeaveQueryParams(filters);
    params.user_id = userId;
    const result = await apiClient.get<{ data: any[]; count: number }>(
      '/leave-requests/my',
      params
    );
    return { data: result.data ?? [], count: result.count ?? 0 };
  },

  async getRequestsByUsers(
    userIds: string[],
    filters?: LeaveRequestFilters & { userId?: string }
  ) {
    const params = buildLeaveQueryParams(filters);
    if (filters?.userId) {
      params.user_id = filters.userId;
    } else if (userIds.length > 0) {
      params.user_ids = userIds.join(',');
    }
    const result: any = await apiClient.get('/leave-requests/scope', params);
    // /scope returns a flat array, wrap it for consistency
    const data = Array.isArray(result) ? result : (result.data ?? []);
    return { data, count: data.length };
  },

  async getTeamRequests(filters?: LeaveRequestFilters) {
    const params = buildLeaveQueryParams(filters);
    params.status = params.status || 'pending';
    const result: any = await apiClient.get('/leave-requests/scope', params);
    const data = Array.isArray(result) ? result : (result.data ?? []);
    return { data, count: data.length };
  },

  async createRequest(requestData: any) {
    const data = await apiClient.post('/leave-requests', requestData);
    return data;
  },

  async updateStatus(
    id: string,
    status: string,
    approvedBy: string,
    approvalComment?: string
  ) {
    const body: Record<string, any> = {
      status,
      approved_by: approvedBy,
    };
    if (approvalComment !== undefined) {
      body.approval_comment = approvalComment;
    }
    const data = await apiClient.put(`/leave-requests/${id}/status`, body);
    return data;
  },

  async cancelRequest(requestId: string) {
    const data = await apiClient.put(`/leave-requests/${requestId}/cancel`);
    return data;
  },

  async editRequest(requestId: string, updates: {
    start_date: string;
    end_date: string;
    is_half_day?: boolean;
    half_day_period?: string | null;
    reason?: string;
  }) {
    const data = await apiClient.put(`/leave-requests/${requestId}/edit`, updates);
    return data;
  },

  async deleteRequest(requestId: string) {
    const data = await apiClient.delete(`/leave-requests/${requestId}`);
    return data;
  },

  async checkOverlap(
    userId: string,
    startDate: string,
    endDate: string,
    excludeRequestId?: string
  ) {
    const body: Record<string, any> = {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    };
    if (excludeRequestId) {
      body.exclude_request_id = excludeRequestId;
    }
    const data = await apiClient.post('/leave-requests/overlap', body);
    return data ?? [];
  },

  async getRequestsByScope(
    currentUser: User,
    filters?: LeaveRequestFilters
  ): Promise<{ data: any[]; count: number }> {
    const params = buildLeaveQueryParams(filters);
    const result: any = await apiClient.get('/leave-requests/scope', params);
    const data = Array.isArray(result) ? result : (result.data ?? []);
    return { data, count: data.length };
  },

  async resolveApprover(userId: string): Promise<{ approverId: string; approverRole: string }> {
    const data = await apiClient.get<{ approverId: string; approverRole: string }>(
      `/leave-requests/resolve-approver/${userId}`
    );
    return data;
  },
};
