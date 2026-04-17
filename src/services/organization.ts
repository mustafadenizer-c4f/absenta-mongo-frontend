// src/services/organization.ts
import { apiClient } from '../config/api';
import { Company, Group, Department, Team, HierarchyProfile, CustomMongoConfig, ConnectionTestResult } from '../types';

export interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  sender_email: string;
  sender_name: string;
  email_notifications_enabled: boolean;
}

export interface SmtpConfigInput {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  sender_email: string;
  sender_name: string;
  email_notifications_enabled: boolean;
}

export const OrganizationService = {
  // ── Companies ──────────────────────────────────────────────

  async getCompanies(): Promise<Company[]> {
    // Admin fetches their own company — the backend scopes by the token's company_id
    // For supervisor, this would go through supervisor routes instead
    const data = await apiClient.get<Company[]>('/companies');
    return data;
  },

  async createCompany(name: string): Promise<Company> {
    const data = await apiClient.post<Company>('/companies', { name });
    return data;
  },

  async updateCompany(id: string, name: string): Promise<Company> {
    const data = await apiClient.put<Company>(`/companies/${id}`, { name });
    return data;
  },

  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  },

  // ── Groups ─────────────────────────────────────────────────

  async getGroups(companyId?: string): Promise<Group[]> {
    const params: Record<string, any> = {};
    if (companyId) params.company_id = companyId;
    const data = await apiClient.get<Group[]>('/groups', params);
    return data;
  },

  async createGroup(name: string, companyId: string): Promise<Group> {
    const data = await apiClient.post<Group>('/groups', { name, company_id: companyId });
    return data;
  },

  async updateGroup(id: string, name: string): Promise<Group> {
    const data = await apiClient.put<Group>(`/groups/${id}`, { name });
    return data;
  },

  async deleteGroup(id: string): Promise<void> {
    await apiClient.delete(`/groups/${id}`);
  },

  // ── Departments ────────────────────────────────────────────

  async getDepartments(groupId?: string): Promise<Department[]> {
    const params: Record<string, any> = {};
    if (groupId) params.group_id = groupId;
    const data = await apiClient.get<Department[]>('/departments', params);
    return data;
  },

  async createDepartment(name: string, groupId?: string, companyId?: string): Promise<Department> {
    const body: Record<string, any> = { name };
    if (groupId) body.group_id = groupId;
    if (companyId) body.company_id = companyId;
    const data = await apiClient.post<Department>('/departments', body);
    return data;
  },

  async updateDepartment(id: string, name: string, groupId?: string): Promise<Department> {
    const body: any = { name };
    if (groupId !== undefined) body.group_id = groupId;
    const data = await apiClient.put<Department>(`/departments/${id}`, body);
    return data;
  },

  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  },

  // ── Teams ──────────────────────────────────────────────────

  async getTeams(departmentId?: string): Promise<Team[]> {
    const params: Record<string, any> = {};
    if (departmentId) params.department_id = departmentId;
    const data = await apiClient.get<Team[]>('/teams', params);
    return data;
  },

  async createTeam(name: string, departmentId?: string, companyId?: string): Promise<Team> {
    const body: Record<string, any> = { name };
    if (departmentId) body.department_id = departmentId;
    if (companyId) body.company_id = companyId;
    const data = await apiClient.post<Team>('/teams', body);
    return data;
  },

  async updateTeam(id: string, name: string, departmentId?: string): Promise<Team> {
    const body: any = { name };
    if (departmentId !== undefined) body.department_id = departmentId;
    const data = await apiClient.put<Team>(`/teams/${id}`, body);
    return data;
  },

  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },

  // ── Hierarchy Profile ──────────────────────────────────────

  async getCompanyProfile(companyId: string): Promise<Company> {
    const data = await apiClient.get<Company>(`/companies/${companyId}`);
    return data;
  },

  async updateHierarchyProfile(companyId: string, profile: HierarchyProfile): Promise<Company> {
    const data = await apiClient.put<Company>(`/companies/${companyId}`, {
      hierarchy_profile: profile,
    });
    return data;
  },

  async updateWorkdayConfig(companyId: string, workdayConfig: number[]): Promise<Company> {
    const data = await apiClient.put<Company>(`/companies/${companyId}`, {
      workday_config: workdayConfig,
    });
    return data;
  },

  async updateLegalWorkdays(companyId: string, legalWorkdays: number[]): Promise<Company> {
    const data = await apiClient.put<Company>(`/companies/${companyId}`, {
      legal_workdays: legalWorkdays,
    });
    return data;
  },

  // ── SMTP Configuration ─────────────────────────────────────

  async getSmtpConfig(): Promise<SmtpConfig> {
    const data = await apiClient.get<SmtpConfig>('/companies/smtp');
    return data;
  },

  async updateSmtpConfig(config: SmtpConfigInput): Promise<SmtpConfig> {
    const data = await apiClient.put<SmtpConfig>('/companies/smtp', config);
    return data;
  },

  async testSmtpConfig(): Promise<{ success: boolean; error?: string }> {
    const data = await apiClient.post<{ success: boolean; error?: string }>('/companies/smtp/test');
    return data;
  },

  // ── Custom MongoDB Configuration ───────────────────────────

  async testMongoConnection(uri: string): Promise<ConnectionTestResult> {
    const data = await apiClient.post<ConnectionTestResult>('/companies/test-mongo-connection', { uri });
    return data;
  },

  async getCustomMongoConfig(companyId: string): Promise<CustomMongoConfig> {
    const data = await apiClient.get<CustomMongoConfig>(`/companies/${companyId}/custom-mongo`);
    return data;
  },

  async saveCustomMongoConfig(companyId: string, config: CustomMongoConfig): Promise<void> {
    await apiClient.put(`/companies/${companyId}/custom-mongo`, config);
  },
};
