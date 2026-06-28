import api from './api';

// Projects
export const projectsAPI = {
  create: (data: any) => api.post('/projects', data),
  getAll: (params?: any) => api.get('/projects', { params }),
  getById: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Categories
export const categoriesAPI = {
  create: (data: any) => api.post('/categories', data),
  getAll: (params?: any) => api.get('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Assets
export const assetsAPI = {
  create: (data: any) => api.post('/assets', data),
  getAll: (params?: any) => api.get('/assets', { params }),
  getById: (id: string) => api.get(`/assets/${id}`),
  update: (id: string, data: any) => api.put(`/assets/${id}`, data),
  delete: (id: string) => api.delete(`/assets/${id}`),
  assignCustodian: (id: string, custodianId: string, notes?: string) =>
    api.post(`/assets/${id}/assign-custodian`, { custodianId, notes }),
};

// Custody
export const custodyAPI = {
  transfer: (data: any) => api.post('/custody/transfer', data),
  getHistory: (assetId: string, params?: any) =>
    api.get(`/custody/history/${assetId}`, { params }),
  getCurrentCustodian: (assetId: string) => api.get(`/custody/current/${assetId}`),
  return: (assetId: string, notes?: string) =>
    api.post(`/custody/return/${assetId}`, { notes }),
};

// Maintenance
export const maintenanceAPI = {
  schedule: (data: any) => api.post('/maintenance', data),
  getAll: (params?: any) => api.get('/maintenance', { params }),
  getDue: () => api.get('/maintenance/due'),
  updateStatus: (id: string, data: any) => api.put(`/maintenance/${id}`, data),
};

// Reports
export const reportsAPI = {
  getInventory: (projectId: string) => api.get(`/reports/inventory/${projectId}`),
  getValuation: (params?: any) => api.get('/reports/valuation', { params }),
  exportSheet: (params?: any) => api.get('/reports/export', { params }),
};
