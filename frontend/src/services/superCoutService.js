import backendApi from './backend-api';

export const superCoutService = {
  getAll: async () => {
    const response = await backendApi.get('/api/super-cout');
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
  delete: async (id) => {
    return backendApi.delete(`/api/super-cout/${id}`);
  },
  deleteAll: async () => {
    return backendApi.delete('/api/super-cout');
  },
};
