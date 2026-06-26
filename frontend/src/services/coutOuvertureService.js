import backendApi from './backend-api'

export const coutOuvertureService = {
  getAll: async () => {
    const response = await backendApi.get('/api/cout-ouverture')
    return response.data
  },
  getById: async (id) => {
    const response = await backendApi.get(`/api/cout-ouverture/${id}`)
    return response.data
  },
  getByTicketId: async (ticketId) => {
    const response = await backendApi.get(`/api/cout-ouverture/ticket/${ticketId}`)
    return response.data
  },
  create: async (ticketId, coutOuverture, pourcentage, superCoutInitial, mode = '1') => {
    const response = await backendApi.post('/api/cout-ouverture', { 
      ticketId, 
      coutOuverture, 
      pourcentage, 
      superCoutInitial,
      mode
    })
    return response.data
  },
  update: async (id, pourcentage, mode, superCoutInitial) => {
    const response = await backendApi.put(`/api/cout-ouverture/${id}`, { 
      pourcentage, 
      mode,
      superCoutInitial 
    })
    return response.data
  },
  delete: async (id) => {
    return backendApi.delete(`/api/cout-ouverture/${id}`)
  },
  deleteAll: async () => {
    return backendApi.delete('/api/cout-ouverture')
  },
};
