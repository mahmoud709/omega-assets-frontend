'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useAssets = (
  projectId?: string,
  categoryId?: string,
  search?: string,
  condition?: string,
  assignment?: string,
  custodianId?: string,
  ids?: string[],
  page = 1,
  limit = 20
) => {
  return useQuery({
    queryKey: ['assets', projectId, categoryId, search, condition, assignment, custodianId, ids?.join(','), page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (categoryId) params.append('categoryId', categoryId);
      if (search) params.append('search', search);
      if (condition) params.append('condition', condition);
      if (assignment) params.append('assignment', assignment);
      if (custodianId) params.append('custodianId', custodianId);
      if (ids && ids.length > 0) params.append('ids', ids.join(','));
      params.append('page', String(page));
      params.append('limit', String(limit));
      const response = await api.get(`/assets?${params}`);
      return response.data;
    },
    placeholderData: keepPreviousData,
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      const response = await api.get(`/assets/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/assets', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useBulkCreateAssets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assets: any[]) => {
      const response = await api.post('/assets/bulk', { assets });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/assets/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useProjects = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['projects', page, limit],
    queryFn: async () => {
      const response = await api.get(`/projects?page=${page}&limit=${limit}`);
      return response.data;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/projects', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useCategories = (projectId?: string) => {
  return useQuery({
    queryKey: ['categories', projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : '';
      const response = await api.get(`/categories${params}`);
      return response.data;
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useCustodyHistory = (assetId: string) => {
  return useQuery({
    queryKey: ['custody', assetId],
    queryFn: async () => {
      const response = await api.get(`/custody/history/${assetId}`);
      return response.data;
    },
    enabled: !!assetId,
  });
};

export const useTransferCustody = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/custody/transfer', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['custody'] });
    },
  });
};

export const useReportIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/maintenance/report', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
};

export const useMaintenanceTasks = (assetId?: string, status?: string) => {
  return useQuery({
    queryKey: ['maintenance', assetId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (assetId) params.append('assetId', assetId);
      if (status) params.append('status', status);
      const response = await api.get(`/maintenance?${params}`);
      return response.data;
    },
    enabled: assetId !== 'SKIP',
  });
};

export const useUpdateMaintenanceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/maintenance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['asset'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDueMaintenance = () => {
  return useQuery({
    queryKey: ['maintenance-due'],
    queryFn: async () => {
      const response = await api.get('/maintenance/due');
      return response.data;
    },
  });
};

export const useInventoryReport = (projectId: string) => {
  return useQuery({
    queryKey: ['report-inventory', projectId],
    queryFn: async () => {
      const response = await api.get(`/reports/inventory/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });
};

export const useFinancialReport = (projectId?: string) => {
  return useQuery({
    queryKey: ['report-financial', projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : '';
      const response = await api.get(`/reports/valuation${params}`);
      return response.data;
    },
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard-stats');
      return response.data;
    },
  });
};

export const useMaintenanceStats = () => {
  return useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/maintenance-stats');
      return response.data;
    },
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useEmployees = (projectId?: string) => {
  return useQuery({
    queryKey: ['employees', projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : '';
      const response = await api.get(`/employees${params}`);
      return response.data;
    },
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/employees', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
