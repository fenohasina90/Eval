import backendApi from './backend-api';

export const coutOuvertureService = {
  getAll: async () => {
    const response = await backendApi.get('/api/cout-ouverture');
    return response.data;
  },
  getByTicketId: async (ticketId) => {
    const response = await backendApi.get(`/api/cout-ouverture/ticket/${ticketId}`);
    return response.data;
  },
  create: async (ticketId, coutOuverture, pourcentage, superCoutInitial) => {
    const response = await backendApi.post('/api/cout-ouverture', { 
      ticketId, 
      coutOuverture, 
      pourcentage, 
      superCoutInitial 
    });
    return response.data;
  },
  delete: async (id) => {
    return backendApi.delete(`/api/cout-ouverture/${id}`);
  },
  deleteAll: async () => {
    return backendApi.delete('/api/cout-ouverture');
  },
};
