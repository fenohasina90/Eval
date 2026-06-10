import api, { legacy, Legacy } from './api'

function extractItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

function isDeletedOrTemplate(item) {
  const isDeleted = item?.is_deleted === true || item?.is_deleted === 1 || item?.is_deleted === '1'
  const isTemplate = item?.is_template === true || item?.is_template === 1 || item?.is_template === '1'
  return isDeleted || isTemplate
}

function compactObject(obj) {
  const out = {}
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && value.trim().length === 0) return
    out[key] = value
  })
  return out
}

export const KANBAN_TICKET_STATUSES = {
  NEW: 1,
  IN_PROGRESS: 2,
  CLOSED: 6,
}

export const KANBAN_COLUMNS = [
  { id: KANBAN_TICKET_STATUSES.NEW, title: 'Nouveau', color: 'blue', icon: '🆕' },
  { id: KANBAN_TICKET_STATUSES.IN_PROGRESS, title: 'En cours (Attribué)', color: 'amber', icon: '⚡' },
  { id: KANBAN_TICKET_STATUSES.CLOSED, title: 'Terminé (Clos)', color: 'green', icon: '✅' },
]

export function normalizeTicketStatus(value) {
  let n
  if (value && typeof value === 'object' && value.id !== undefined) {
    n = Number(value.id)
  } else {
    n = Number(value)
  }
  if ([1, 2, 3, 4, 5, 6].includes(n)) return n
  return null
}

export function getTicketStatusId(ticket) {
  return normalizeTicketStatus(ticket?.status)
}

export function formatStatusLabel(statusValue) {
  const status = normalizeTicketStatus(statusValue)
  if (status === 1) return 'Nouveau'
  if (status === 2) return 'En cours (Attribué)'
  if (status === 6) return 'Clos'
  if (status === 3) return 'Planifié'
  if (status === 4) return 'En attente'
  if (status === 5) return 'Résolu'
  return 'Inconnu'
}

export function getMoveDialogConfig({ fromStatus, toStatus }) {
  const from = Number(fromStatus)
  const to = Number(toStatus)
  if (Number.isNaN(from) || Number.isNaN(to) || from === to) return null

  if (to === KANBAN_TICKET_STATUSES.IN_PROGRESS) {
    return {
      title: 'Passer en cours',
      fields: [
        { key: 'assigneeId', label: 'ID technicien (optionnel)', type: 'number', required: false },
        { key: 'comment', label: 'Commentaire (optionnel)', type: 'textarea', required: false },
      ],
    }
  }

  if (to === KANBAN_TICKET_STATUSES.CLOSED) {
    return {
      title: 'Clôturer le ticket',
      fields: [
        { key: 'solution', label: 'Solution / note de clôture (optionnel)', type: 'textarea', required: false },
        { key: 'comment', label: 'Commentaire (optionnel)', type: 'textarea', required: false },
      ],
    }
  }

  return null
}

async function fetchAll(path) {
  try {
    const response = await api.get(path, { params: { limit: 999999 } })
    return extractItems(response?.data) || []
  } catch (err) {
    if (err?.response?.status === 404) {
      const legacyPath = path.replace(/^\/Assets/, '').replace(/^\/Assistance/, '')
      const response = await legacy.get(legacyPath, { params: { limit: 999999 } })
      return extractItems(response?.data) || []
    }
    throw err
  }
}

export async function fetchKanbanTickets() {
  const tickets = await fetchAll('/Assistance/Ticket')
  const allowed = new Set([KANBAN_TICKET_STATUSES.NEW, KANBAN_TICKET_STATUSES.IN_PROGRESS, KANBAN_TICKET_STATUSES.CLOSED])
  return (tickets || []).filter((t) => !isDeletedOrTemplate(t) && allowed.has(getTicketStatusId(t)))
}

export async function getTicketDetails(ticketId) {
  const response = await Legacy.get(`/Ticket/${ticketId}`, { expand_dropdowns: true })
  return response?.data
}

function normalizeUserRef(userValue) {
  if (!userValue) return null
  if (typeof userValue === 'object') {
    const id = userValue.id != null ? Number(userValue.id) : null
    const name = userValue.name || userValue.completename || userValue.realname || userValue.firstname
    return { id: id && !Number.isNaN(id) ? id : null, name: name ? String(name) : null }
  }
  const id = Number(userValue)
  if (!id || Number.isNaN(id)) return null
  return { id, name: null }
}

function normalizeLegacyListResponse(data) {
  const extracted = extractItems(data)
  if (extracted.length > 0) return extracted
  if (data && typeof data === 'object') {
    const values = Object.values(data)
    if (values.every((v) => v && typeof v === 'object')) return values
  }
  return []
}

async function fetchTicketUserRows(ticketId) {
  const id = Number(ticketId)
  if (!id || Number.isNaN(id)) return []

  const attempts = [
    () => Legacy.get(`/Ticket/${id}/Ticket_User`, { expand_dropdowns: true, range: '0-9999' }),
    () => Legacy.get(`/Ticket/${id}/Ticket_User/`, { expand_dropdowns: true, range: '0-9999' }),
    () => Legacy.get('/Ticket_User', { expand_dropdowns: true, range: '0-9999', tickets_id: id }),
    () => Legacy.get('/Ticket_User', { expand_dropdowns: true, range: '0-9999' }),
  ]

  for (let i = 0; i < attempts.length; i++) {
    try {
      const response = await attempts[i]()
      const rows = normalizeLegacyListResponse(response?.data)
      if (rows.length === 0) continue
      const filtered = rows.filter((r) => Number(r?.tickets_id) === id)
      if (filtered.length > 0) return filtered
      if (i < 3) continue
      return []
    } catch {
      continue
    }
  }

  return []
}

export async function getTicketActors(ticketId) {
  const items = await fetchTicketUserRows(ticketId)

  const requesters = []
  const assignees = []
  const observers = []

  items.forEach((row) => {
    const type = Number(row?.type)
    const user = normalizeUserRef(row?.users_id)
    if (!user) return

    if (type === 1) requesters.push(user)
    if (type === 2) assignees.push(user)
    if (type === 3) observers.push(user)
  })

  return { requesters, assignees, observers }
}

export async function updateTicketStatus(ticketId, toStatus, extra = {}) {
  const basePayload = compactObject({
    id: Number(ticketId),
    status: Number(toStatus),
  })

  const extendedPayload = compactObject({
    ...basePayload,
    solution: extra.solution,
    comment: extra.comment,
    users_id_assign: extra.assigneeId ? Number(extra.assigneeId) : undefined,
  })

  try {
    await Legacy.put(`/Ticket/${ticketId}`, extendedPayload)
  } catch (err) {
    try {
      await Legacy.put(`/Ticket/${ticketId}`, basePayload)
    } catch {
      throw err
    }
  }

  try {
    return await getTicketDetails(ticketId)
  } catch {
    return null
  }
}
