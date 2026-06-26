import backendApi from './backend-api'

export const configurationService = {
  getPlafondReouverture: async () => {
    const response = await backendApi.get('/api/configuration/plafond-reouverture')
    return response.data
  },
  setPlafondReouverture: async (valeur) => {
    const response = await backendApi.put('/api/configuration/plafond-reouverture', { valeur })
    return response.data
  }
}
