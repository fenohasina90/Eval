import backendApi from './backend-api'

export async function getTicketHistory(ticketId) {
  try {
    const response = await backendApi.get(`/api/ticket-history/ticket/${ticketId}`)
    return response.data || []
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'historique du ticket:', err)
    return []
  }
}

export default {
  getTicketHistory
}
