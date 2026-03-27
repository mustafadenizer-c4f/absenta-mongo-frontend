// src/services/language.ts
import { apiClient } from '../config/api';
import { User } from '../types';

export interface ILabel {
  id: string;
  labeltext: string;
  tr: string;
  en: string;
  created_at: string;
  updated_at: string;
}

export const LanguageService = {
  async getLanguagePack(lang: string): Promise<Record<string, string>> {
    const data = await apiClient.get<Record<string, string>>(`/languages/${lang}`);
    return data;
  },

  async getAllLabels(): Promise<ILabel[]> {
    const data = await apiClient.get<ILabel[]>('/languages');
    return data;
  },

  async createLabel(data: { labeltext: string; tr: string; en: string }): Promise<ILabel> {
    const result = await apiClient.post<ILabel>('/languages', data);
    return result;
  },

  async updateLabel(labeltext: string, data: { tr?: string; en?: string }): Promise<ILabel> {
    const result = await apiClient.put<ILabel>(`/languages/${labeltext}`, data);
    return result;
  },

  async updateUserLanguage(userId: string, language: string): Promise<User> {
    const data = await apiClient.put<User>(`/users/${userId}/language`, { language });
    return data;
  },
};
