import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Container, Error, H1, Input, Kanban, Loading, Textarea } from '../../components'
import Modal from '../../components/Modal'
import TicketDetailsModal from '../../components/TicketDetailsModal'
import { CreateTicketForm } from './CreateTicket'
import {
  fetchKanbanTickets,
  formatStatusLabel,
  getKanbanColumnsSync,
  getMoveDialogConfig,
  getTicketActors,
  getTicketDetails,
  getTicketStatusId,
  getKanbanCustomization,
  updateTicketStatus,
} from '../../services/frontOfficeKanbanTicketService'

function formatDate(dateStr) {
  if (!dateStr) return '—'

  // Handle date strings in different formats (ISO, GLPI format, etc.)
  let date
  if (typeof dateStr === 'string') {
    // Try parsing as ISO string first
    date = new Date(dateStr)
    // If that fails, try GLPI's format (YYYY-MM-DD HH:mm:ss)
    if (isNaN(date.getTime())) {
      const [datePart, timePart] = dateStr.split(' ')
      if (datePart) {
        const [year, month, day] = datePart.split('-')
        let hours = 0, minutes = 0, seconds = 0
        if (timePart) {
          const [h, m, s] = timePart.split(':')
          hours = parseInt(h) || 0
          minutes = parseInt(m) || 0
          seconds = parseInt(s) || 0
        }
        if (year && month && day) {
          date = new Date(year, month - 1, day, hours, minutes, seconds)
        }
      }
    }
  } else if (dateStr instanceof Date) {
    date = dateStr
  }

  if (!date || isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const DEFAULT_CUSTOMIZATION = {
  colorsByStatus: {
    1: 'blue',
    2: 'amber',
    6: 'green',
  },
  labelsByStatus: {
    1: 'Nouveau',
    2: 'En cours (Attribué)',
    6: 'Terminé (Clos)',
  },
}

export default function TicketKanban() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION)
  const [customizationLoading, setCustomizationLoading] = useState(true)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTicket, setDetailsTicket] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsActors, setDetailsActors] = useState(null)
  const [detailsActorsLoading, setDetailsActorsLoading] = useState(false)
  const [detailsActorsError, setDetailsActorsError] = useState('')

  const [moveOpen, setMoveOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState(null)
  const [moveForm, setMoveForm] = useState({ assigneeId: '', comment: '', solution: '' })
  const [moveError, setMoveError] = useState('')
  const [moveSubmitting, setMoveSubmitting] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchKanbanTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Erreur lors de la récupération des tickets.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCustomization = useCallback(async () => {
    try {
      const cust = await getKanbanCustomization()
      setCustomization(cust)
    } finally {
      setCustomizationLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
    loadCustomization()
  }, [loadTickets, loadCustomization])

  useEffect(() => {
    const onChanged = () => loadCustomization()
    window.addEventListener('kanban-customization-changed', onChanged)
    return () => {
      window.removeEventListener('kanban-customization-changed', onChanged)
    }
  }, [loadCustomization])

  const columns = useMemo(() => getKanbanColumnsSync(customization), [customization])

  const ticketsById = useMemo(() => {
    const map = new Map()
    tickets.forEach((t) => {
      if (t?.id != null) map.set(Number(t.id), t)
    })
    return map
  }, [tickets])

  const openDetails = useCallback(async (ticket) => {
    const ticketId = ticket?.id
    if (!ticketId) return

    // #region debug-point C:ui-open-details
    // fetch('http://127.0.0.1:7777/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'ticket-actors-missing', runId: 'post', hypothesisId: 'C', location: 'TicketKanban.jsx:openDetails', msg: '[DEBUG] UI openDetails', data: { ticketId: Number(ticketId) }, ts: Date.now() }) }).catch(() => { })
    // #endregion

    setDetailsOpen(true)
    setDetailsError('')
    setDetailsLoading(true)
    setDetailsActors(null)
    setDetailsActorsError('')
    setDetailsActorsLoading(true)
    setDetailsTicket(ticket)
    try {
      const [detailsResult, actorsResult] = await Promise.allSettled([
        getTicketDetails(ticketId),
        getTicketActors(ticketId),
      ])

      if (detailsResult.status === 'fulfilled' && detailsResult.value) {
        setDetailsTicket(detailsResult.value)
      }
      if (actorsResult.status === 'fulfilled' && actorsResult.value) {
        setDetailsActors(actorsResult.value)
      }
      if (detailsResult.status === 'rejected') {
        setDetailsError(detailsResult.reason?.message || 'Erreur lors du chargement des détails.')
      }
      if (actorsResult.status === 'rejected') {
        setDetailsActorsError(actorsResult.reason?.message || 'Erreur lors du chargement des acteurs.')
      }

      // #region debug-point C:ui-open-details-result
      // fetch('http://127.0.0.1:7777/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'ticket-actors-missing', runId: 'post', hypothesisId: 'C', location: 'TicketKanban.jsx:openDetails', msg: '[DEBUG] UI openDetails resolved', data: { ticketId: Number(ticketId), detailsStatus: detailsResult.status, actorsStatus: actorsResult.status, actorsCounts: actorsResult.status === 'fulfilled' ? { requesters: actorsResult.value?.requesters?.length || 0, assignees: actorsResult.value?.assignees?.length || 0, observers: actorsResult.value?.observers?.length || 0 } : null }, ts: Date.now() }) }).catch(() => { })
      // #endregion
    } catch (err) {
      setDetailsError(err?.message || 'Erreur lors du chargement des détails.')
    } finally {
      setDetailsLoading(false)
      setDetailsActorsLoading(false)
    }
  }, [])

  const closeDetails = useCallback(() => {
    setDetailsOpen(false)
    setDetailsTicket(null)
    setDetailsError('')
    setDetailsLoading(false)
    setDetailsActors(null)
    setDetailsActorsError('')
    setDetailsActorsLoading(false)
  }, [])

  const resetMoveState = useCallback(() => {
    setMoveOpen(false)
    setPendingMove(null)
    setMoveForm({ assigneeId: '', comment: '', solution: '' })
    setMoveError('')
    setMoveSubmitting(false)
  }, [])

  const applyMove = useCallback(async ({ ticketId, toStatus, extra, fromStatus }) => {
    setMoveSubmitting(true)
    setMoveError('')
    try {
      const updated = await updateTicketStatus(ticketId, toStatus, extra, fromStatus)
      setTickets((prev) =>
        prev.map((t) => {
          if (Number(t?.id) !== Number(ticketId)) return t
          if (updated) return { ...t, ...updated }
          return { ...t, status: Number(toStatus) }
        })
      )
      resetMoveState()
    } catch (err) {
      setMoveError(err?.message || 'Erreur lors du changement de statut.')
      setMoveSubmitting(false)
    }
  }, [resetMoveState])

  const handleItemMove = useCallback((itemId, fromColumnId, toColumnId) => {
    const ticketId = Number(itemId)
    const fromStatus = Number(fromColumnId)
    const toStatus = Number(toColumnId)
    if (!ticketId || fromStatus === toStatus) return

    const dialog = getMoveDialogConfig({ fromStatus, toStatus })
    if (dialog) {
      setPendingMove({ ticketId, fromStatus, toStatus })
      setMoveForm({ assigneeId: '', comment: '', solution: '' })
      setMoveError('')
      setMoveOpen(true)
      return
    }

    applyMove({ ticketId, toStatus, extra: {}, fromStatus })
  }, [applyMove])

  const openCreate = useCallback(() => {
    setCreateOpen(true)
  }, [])

  const closeCreate = useCallback(() => {
    setCreateOpen(false)
  }, [])

  const renderTicketCard = useCallback((ticket) => {
    return (
      <Kanban.TicketCard
        ticket={ticket}
        onClick={() => openDetails(ticket)}
      />
    )
  }, [openDetails])

  const detailsTicketId = detailsTicket?.id
  const detailsStatus = detailsTicket ? formatStatusLabel(detailsTicket.status, customization) : ''

  const pendingTicket = pendingMove ? ticketsById.get(Number(pendingMove.ticketId)) : null
  const moveDialog = pendingMove ? getMoveDialogConfig({ fromStatus: pendingMove.fromStatus, toStatus: pendingMove.toStatus }) : null

  if (loading || customizationLoading) return <Loading message="Chargement des tickets…" />
  if (error) return <Error message={error} onRetry={loadTickets} />

  return (
    <Container size="7xl">
      <div className="flex items-center justify-between gap-3 mb-5">
        <H1>Tickets (Kanban)</H1>
        <Button variant="outline" onClick={loadTickets}>
          Rafraîchir
        </Button>
      </div>

      <Kanban
        columns={columns}
        items={tickets}
        getColumnId={(t) => getTicketStatusId(t)}
        onItemMove={handleItemMove}
        renderCard={renderTicketCard}
        renderColumnActions={(column) => {
          if (Number(column?.id) !== 1) return null
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={openCreate}
            >
              Ajouter
            </Button>
          )
        }}
        emptyMessage="Aucun ticket"
      />

      <Modal
        isOpen={createOpen}
        onClose={closeCreate}
        title="Créer un ticket"
        className="max-w-5xl"
      >
        <CreateTicketForm
          forcedStatus="1"
          lockStatus
          onCreated={async () => {
            closeCreate()
            await loadTickets()
          }}
        />
      </Modal>

      <TicketDetailsModal
        isOpen={detailsOpen}
        onClose={closeDetails}
        ticket={detailsTicket}
        detailsLoading={detailsLoading}
        detailsError={detailsError}
        detailsActors={detailsActors}
        detailsActorsLoading={detailsActorsLoading}
        detailsActorsError={detailsActorsError}
        customization={customization}
      />

      <Modal
        isOpen={moveOpen}
        onClose={resetMoveState}
        title={moveDialog?.title || 'Changer de statut'}
        className="max-w-lg"
      >
        <div className="space-y-4">
          {pendingTicket && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">
                #{pendingTicket.id} — {pendingTicket.name || 'Sans titre'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatStatusLabel(pendingMove?.fromStatus, customization)} → {formatStatusLabel(pendingMove?.toStatus, customization)}
              </div>
            </div>
          )}

          {moveError && <div className="text-sm text-red-600">{moveError}</div>}

          {moveDialog?.fields?.map((field) => {
            if (field.type === 'textarea') {
              return (
                <div key={field.key} className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">{field.label}</div>
                  <Textarea
                    value={moveForm[field.key] || ''}
                    onChange={(e) => setMoveForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    rows={4}
                  />
                </div>
              )
            }

            return (
              <div key={field.key} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{field.label}</div>
                <Input
                  type={field.type || 'text'}
                  value={moveForm[field.key] || ''}
                  onChange={(e) => setMoveForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            )
          })}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={resetMoveState} disabled={moveSubmitting}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!pendingMove) return
                applyMove({
                  ticketId: pendingMove.ticketId,
                  toStatus: pendingMove.toStatus,
                  extra: moveForm,
                  fromStatus: pendingMove.fromStatus
                })
              }}
              disabled={moveSubmitting || !pendingMove}
            >
              Valider
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}
