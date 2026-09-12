import { http } from './http';

/**
 * Contrato REST esperado do backend Spring Boot (br.inatel.*).
 * Enquanto os controllers nao existirem, use VITE_USE_MOCK=true.
 */
export const realApi = {
  auth: {
    login: (email, password) => http.post('/auth/login', { email, password }),
    me: () => http.get('/auth/me'),
  },

  // br.inatel.users
  users: {
    list: (params) => http.get('/users', params),
    get: (id) => http.get(`/users/${id}`),
    create: (payload) => http.post('/users', payload),
    update: (id, payload) => http.put(`/users/${id}`, payload),
    remove: (id) => http.delete(`/users/${id}`),
  },

  // br.inatel.labs (laboratorios)
  labs: {
    list: (params) => http.get('/labs', params),
    get: (id) => http.get(`/labs/${id}`),
    create: (payload) => http.post('/labs', payload),
    update: (id, payload) => http.put(`/labs/${id}`, payload),
    remove: (id) => http.delete(`/labs/${id}`),
    members: (id) => http.get(`/labs/${id}/members`),
    addMember: (id, payload) => http.post(`/labs/${id}/members`, payload),
    removeMember: (id, userId) => http.delete(`/labs/${id}/members/${userId}`),
  },

  // br.inatel.labs (projetos)
  projects: {
    list: (params) => http.get('/projects', params),
    get: (id) => http.get(`/projects/${id}`),
    create: (payload) => http.post('/projects', payload),
    update: (id, payload) => http.put(`/projects/${id}`, payload),
    remove: (id) => http.delete(`/projects/${id}`),
    addMember: (id, userId) => http.post(`/projects/${id}/members`, { userId }),
    removeMember: (id, userId) => http.delete(`/projects/${id}/members/${userId}`),
    addDevice: (id, deviceId) => http.post(`/projects/${id}/devices`, { deviceId }),
    removeDevice: (id, deviceId) => http.delete(`/projects/${id}/devices/${deviceId}`),
  },

  // br.inatel.devices
  devices: {
    list: (params) => http.get('/devices', params),
    get: (id) => http.get(`/devices/${id}`),
    create: (payload) => http.post('/devices', payload),
    update: (id, payload) => http.put(`/devices/${id}`, payload),
    remove: (id) => http.delete(`/devices/${id}`),
    updateStatus: (id, status) => http.patch(`/devices/${id}/status`, { status }),
  },

  // br.inatel.loans
  loans: {
    list: (params) => http.get('/loans', params),
    get: (id) => http.get(`/loans/${id}`),
    create: (payload) => http.post('/loans', payload),
    approve: (id) => http.post(`/loans/${id}/approve`),
    reject: (id, reason) => http.post(`/loans/${id}/reject`, { reason }),
    markReturn: (id) => http.post(`/loans/${id}/return`),
  },

  // br.inatel.loans (relatorios)
  reports: {
    overview: () => http.get('/reports/overview'),
    movements: (params) => http.get('/reports/movements', params),
    overdue: () => http.get('/reports/overdue'),
    allocationsByProject: () => http.get('/reports/allocations-by-project'),
  },
};
