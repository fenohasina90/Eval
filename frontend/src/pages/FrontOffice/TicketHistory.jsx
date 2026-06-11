import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, H1, Loading, Error, Button } from '../../components'
import { getTicketHistory, formatStatusLabel, getTicketDetails } from '../../services/frontOfficeKanbanTicketService'
import { getKanbanCustomization } from '../../services/frontOfficeKanbanTicketService'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export default function TicketHistory() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ticket, setTicket] = useState(null)
  const [customization, setCustomization] = useState(null)

  const loadData = useCallback(async () => {
    if (!ticketId) return
    try {
      setLoading(true)
      setError('')
      const [custom, ticketData, historyData] = await Promise.all([
        getKanbanCustomization(),
        getTicketDetails(ticketId),
        getTicketHistory(Number(ticketId)),
      ])
      setCustomization(custom)
      setTicket(ticketData)
      setHistory(historyData)
    } catch (err) {
      setError(err?.message || 'Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return <Loading message="Chargement de l'historique..." />
  if (error) return <Error message={error} onRetry={loadData} />

  return (
    <Container size="5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <H1>Historique du ticket</H1>
          {ticket && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Ticket #{ticketId}: {ticket.name || 'Sans titre'}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Aucun historique disponible pour ce ticket.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(entry.changedAt)}
                </div>
                {entry.changedBy && (
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    Par: {entry.changedBy}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {entry.oldStatus !== null && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Ancien statut
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {formatStatusLabel(entry.oldStatus, customization)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Nouveau statut
                  </div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {formatStatusLabel(entry.newStatus, customization)}
                  </div>
                </div>
              </div>

              {entry.comment && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Commentaire
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    {entry.comment}
                  </div>
                </div>
              )}

              {entry.solution && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Solution
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    {entry.solution}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
