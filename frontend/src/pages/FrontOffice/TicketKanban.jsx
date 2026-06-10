import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Container, Error, H1, Input, Kanban, Loading, Textarea } from '../../components'
import Modal from '../../components/Modal'
import { CreateTicketForm } from './CreateTicket'
import {
  fetchKanbanTickets,
  formatStatusLabel,
  getKanbanColumns,
  getMoveDialogConfig,
  getTicketActors,
  getTicketDetails,
  getTicketStatusId,
  updateTicketStatus,
} from '../../services/frontOfficeKanbanTicketService'

function FieldRow({ label, value }) {
  if (value === undefined || value === null || String(value).trim().length === 0) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="sm:col-span-2 text-sm text-gray-800 whitespace-pre-wrap">{value}</div>
    </div>
  )
}

function formatTicketTypeLabel(typeValue) {
  if (typeValue && typeof typeValue === 'object' && typeValue.name) return typeValue.name
  const n = Number(typeValue)
  if (n === 1) return 'Incident'
  if (n === 2) return 'Demande'
  return '—'
}

function formatPriorityLabel(priorityValue) {
  const n = Number(priorityValue)
  if (n === 1) return 'Très basse'
  if (n === 2) return 'Basse'
  if (n === 3) return 'Moyenne'
  if (n === 4) return 'Haute'
  if (n === 5) return 'Très haute'
  if (n === 6) return 'Majeure'
  return '—'
}

function formatActorsList(list) {
  const items = Array.isArray(list) ? list : []
  if (items.length === 0) return '—'
  return items
    .map((u) => {
      // kind='group' → préfixe 👥, kind='user' ou absent → préfixe 👤
      const prefix = u?.kind === 'group' ? '👥 ' : '👤 '
      if (u?.name) return `${prefix}${u.name} (#${u.id || '?'})`
      if (u?.id)   return `${prefix}#${u.id}`
      return '—'
    })
    .join(', ')
}

export default function TicketKanban() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customizationRevision, setCustomizationRevision] = useState(0)

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

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  useEffect(() => {
    const onChanged = () => setCustomizationRevision((v) => v + 1)
    window.addEventListener('kanban-customization-changed', onChanged)
    window.addEventListener('storage', onChanged)
    return () => {
      window.removeEventListener('kanban-customization-changed', onChanged)
      window.removeEventListener('storage', onChanged)
    }
  }, [])

  const columns = useMemo(() => getKanbanColumns(), [customizationRevision])

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

  const applyMove = useCallback(async ({ ticketId, toStatus, extra }) => {
    setMoveSubmitting(true)
    setMoveError('')
    try {
      const updated = await updateTicketStatus(ticketId, toStatus, extra)
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

    applyMove({ ticketId, toStatus, extra: {} })
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
  const detailsStatus = detailsTicket ? formatStatusLabel(detailsTicket.status) : ''

  const pendingTicket = pendingMove ? ticketsById.get(Number(pendingMove.ticketId)) : null
  const moveDialog = pendingMove ? getMoveDialogConfig({ fromStatus: pendingMove.fromStatus, toStatus: pendingMove.toStatus }) : null

  if (loading) return <Loading message="Chargement des tickets…" />
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

      <Modal
        isOpen={detailsOpen}
        onClose={closeDetails}
        title={detailsTicketId ? `Ticket #${detailsTicketId}` : 'Détails du ticket'}
        className="max-w-3xl"
      >
        {detailsLoading && (
          <div className="text-sm text-gray-500">Chargement des détails…</div>
        )}
        {detailsError && (
          <div className="text-sm text-red-600">{detailsError}</div>
        )}
        {detailsActorsLoading && (
          <div className="text-sm text-gray-500">Chargement des acteurs…</div>
        )}
        {detailsActorsError && (
          <div className="text-sm text-red-600">{detailsActorsError}</div>
        )}
        {detailsTicket && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">
                {detailsTicket.name || 'Sans titre'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Statut: {detailsStatus}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white px-4">
              <FieldRow label="ID" value={detailsTicket.id} />
              <FieldRow label="Type" value={formatTicketTypeLabel(detailsTicket.type)} />
              <FieldRow label="Priorité" value={formatPriorityLabel(detailsTicket.priority)} />
              <FieldRow label="Date de création" value={detailsTicket.date_creation} />
              <FieldRow label="Dernière modification" value={detailsTicket.date_mod} />
              <FieldRow label="Demandeur" value={formatActorsList(detailsActors?.requesters)} />
              <FieldRow label="Attribué à" value={formatActorsList(detailsActors?.assignees)} />
              <FieldRow label="Observateurs" value={formatActorsList(detailsActors?.observers)} />
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <div className="text-xs font-semibold text-gray-500 mb-2">Description</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {detailsTicket.content || '—'}
              </div>
            </div>
          </div>
        )}
      </Modal>

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
                {formatStatusLabel(pendingMove?.fromStatus)} → {formatStatusLabel(pendingMove?.toStatus)}
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
                applyMove({ ticketId: pendingMove.ticketId, toStatus: pendingMove.toStatus, extra: moveForm })
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
