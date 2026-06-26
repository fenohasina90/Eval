import backendApi from './backend-api';

export const superCoutService = {
  getAll: async () => {
    const response = await backendApi.get('/api/super-cout');
    return response.data;
  },
  getById: async (id) => {
    const response = await backendApi.get(`/api/super-cout/${id}`);
    return response.data;
  },
  getByTicketId: async (ticketId) => {
    const response = await backendApi.get(`/api/super-cout/ticket/${ticketId}`);
    return response.data;
  },
  create: async (ticketId, cout) => {
    const response = await backendApi.post('/api/super-cout', { ticketId, cout });
    return response.data;
  },
  update: async (id, cout) => {
    const response = await backendApi.put(`/api/super-cout/${id}`, { cout });
    return response.data;
  },
  delete: async (id) => {
    return backendApi.delete(`/api/super-cout/${id}`);
  },
  deleteAll: async () => {
    return backendApi.delete('/api/super-cout');
  },
};
