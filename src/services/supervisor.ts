// src/services/supervisor.ts
import { apiClient } from '../config/api';
import { Company, CompanyWithAdmin, HierarchyProfile, ConnectionTestResult } from '../types';

interface CreateCompanyRequest {
  name: string;
  hierarchy_profile: HierarchyProfile;
  phone: string;
  contact_email: string;
  contract_number: string;
}

export const SupervisorService = {
  async createCompanyWithAdmin(data: CreateCompanyRequest): Promise<{ company: Company; admin_user_id: string }> {
    const result = await apiClient.post<{ company: Company; admin_user_id: string }>(
      '/supervisor/companies',
      data
    );
    return result;
  },

  async updateCompanyStatus(companyId: string, status: boolean): Promise<Company> {
    const data = await apiClient.put<Company>(
      `/supervisor/companies/${companyId}/status`,
      { status }
    );
    return data;
  },

  async updateCompany(companyId: string, name: string): Promise<Company> {
    const data = await apiClient.put<Company>(`/companies/${companyId}`, { name });
    return data;
  },

  async resetAdminPassword(userId: string): Promise<void> {
    await apiClient.post(`/supervisor/reset-password/${userId}`);
  },

  async getCompaniesWithAdmins(): Promise<CompanyWithAdmin[]> {
    const data = await apiClient.get<CompanyWithAdmin[]>('/supervisor/companies');
    return data;
  },

  async resetToSystemDatabase(companyId: string): Promise<void> {
    await apiClient.post(`/supervisor/companies/${companyId}/reset-database`);
  },

  async testMongoConnection(uri: string): Promise<ConnectionTestResult> {
    const data = await apiClient.post<ConnectionTestResult>('/supervisor/test-mongo-connection', { uri });
    return data;
  },
};
