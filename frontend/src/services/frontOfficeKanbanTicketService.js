import api, { legacy, Legacy } from './api'
import backendApi from './backend-api'

function extractItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

function normalizeLegacyList(data) {
  // GLPI Legacy retourne parfois un objet indexé { "0": {...}, "1": {...} }
  // au lieu d'un tableau
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const values = Object.values(data)
    if (values.length > 0 && typeof values[0] === 'object') return values
  }
  return []
}

function isDeletedOrTemplate(item) {
  const isDeleted  = item?.is_deleted  === true || item?.is_deleted  === 1 || item?.is_deleted  === '1'
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

// ── Résolution ID → nom d'un User ─────────────────────────────────
// Cache en mémoire pour éviter de refetch le même user plusieurs fois
const userNameCache = new Map()

async function resolveUserName(userId) {
  const id = Number(userId)
  if (!id || Number.isNaN(id)) return null

  if (userNameCache.has(id)) return userNameCache.get(id)

  try {
    const response = await Legacy.get(`/User/${id}`)
    const data = response?.data
    // GLPI retourne : { id, name, realname, firstname, ... }
    const name = data?.realname && data?.firstname
      ? `${data.firstname} ${data.realname}`
      : data?.realname || data?.firstname || data?.name || null
    const result = { id, name: name ? String(name) : `Utilisateur #${id}` }
    userNameCache.set(id, result)
    return result
  } catch {
    const fallback = { id, name: `Utilisateur #${id}` }
    userNameCache.set(id, fallback)
    return fallback
  }
}

// ── Résolution ID → nom d'un Group ────────────────────────────────
const groupNameCache = new Map()

async function resolveGroupName(groupId) {
  const id = Number(groupId)
  if (!id || Number.isNaN(id)) return null

  if (groupNameCache.has(id)) return groupNameCache.get(id)

  try {
    const response = await Legacy.get(`/Group/${id}`)
    const data = response?.data
    const name = data?.completename || data?.name || null
    const result = { id, name: name ? String(name) : `Groupe #${id}`, kind: 'group' }
    groupNameCache.set(id, result)
    return result
  } catch {
    const fallback = { id, name: `Groupe #${id}`, kind: 'group' }
    groupNameCache.set(id, fallback)
    return fallback
  }
}

// ── Extraction de l'ID depuis une valeur GLPI (entier ou objet) ───
function extractId(value) {
  if (!value && value !== 0) return null
  if (typeof value === 'object' && value !== null) {
    const id = Number(value?.id)
    return id && !Number.isNaN(id) ? id : null
  }
  const id = Number(value)
  return id && !Number.isNaN(id) ? id : null
}

export const KANBAN_TICKET_STATUSES = {
  NEW:         1,
  IN_PROGRESS: 2,
  CLOSED:      6,
}

const KANBAN_CUSTOMIZATION_STORAGE_KEY = 'glpi.frontoffice.kanban.customization.v1'

const DEFAULT_KANBAN_CUSTOMIZATION = {
  colorsByStatus: {
    [KANBAN_TICKET_STATUSES.NEW]: 'blue',
    [KANBAN_TICKET_STATUSES.IN_PROGRESS]: 'amber',
    [KANBAN_TICKET_STATUSES.CLOSED]: 'green',
  },
  labelsByStatus: {
    [KANBAN_TICKET_STATUSES.NEW]: 'Nouveau',
    [KANBAN_TICKET_STATUSES.IN_PROGRESS]: 'En cours (Attribué)',
    [KANBAN_TICKET_STATUSES.CLOSED]: 'Terminé (Clos)',
  },
}

const ALLOWED_KANBAN_COLORS = new Set([
  'blue',
  'green',
  'amber',
  'red',
  'purple',
  'gray',
  'indigo',
  'pink',
  'orange',
])

function isHexColor(value) {
  const s = value != null ? String(value) : ''
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)
}

function safeParseJson(value) {
  try {
    if (value == null) return null
    return JSON.parse(String(value))
  } catch {
    return null
  }
}

function normalizeKanbanCustomization(input) {
  const src = input && typeof input === 'object' ? input : {}
  const rawColors = src.colorsByStatus && typeof src.colorsByStatus === 'object' ? src.colorsByStatus : {}
  const rawLabels = src.labelsByStatus && typeof src.labelsByStatus === 'object' ? src.labelsByStatus : {}

  const colorsByStatus = { ...DEFAULT_KANBAN_CUSTOMIZATION.colorsByStatus }
  Object.entries(rawColors).forEach(([k, v]) => {
    const statusId = Number(k)
    const colorValue = v != null ? String(v).trim() : ''
    if (!statusId || Number.isNaN(statusId)) return
    if (ALLOWED_KANBAN_COLORS.has(colorValue) || isHexColor(colorValue)) {
      colorsByStatus[statusId] = colorValue
    }
  })

  const labelsByStatus = { ...DEFAULT_KANBAN_CUSTOMIZATION.labelsByStatus }
  Object.entries(rawLabels).forEach(([k, v]) => {
    const statusId = Number(k)
    if (!statusId || Number.isNaN(statusId)) return
    const label = v != null ? String(v).trim() : ''
    if (!label) return
    labelsByStatus[statusId] = label
  })

  return { colorsByStatus, labelsByStatus }
}

export async function getKanbanCustomization() {
  try {
    const response = await backendApi.get('/api/kanban-customization')
    return normalizeKanbanCustomization(response.data)
  } catch {
    return { ...DEFAULT_KANBAN_CUSTOMIZATION }
  }
}

export async function setKanbanCustomization(nextCustomization) {
  const normalized = normalizeKanbanCustomization(nextCustomization)
  try {
    await backendApi.put('/api/kanban-customization', normalized)
    window.dispatchEvent(new Event('kanban-customization-changed'))
  } catch (error) {
    console.error('Failed to save customization:', error)
  }
}

export async function resetKanbanCustomization() {
  try {
    await backendApi.delete('/api/kanban-customization')
    window.dispatchEvent(new Event('kanban-customization-changed'))
  } catch (error) {
    console.error('Failed to reset customization:', error)
  }
}

export const KANBAN_COLUMNS = [
  { id: KANBAN_TICKET_STATUSES.NEW,         title: 'Nouveau',              color: 'blue',  icon: '🆕' },
  { id: KANBAN_TICKET_STATUSES.IN_PROGRESS, title: 'En cours (Attribué)', color: 'amber', icon: '⚡' },
  { id: KANBAN_TICKET_STATUSES.CLOSED,      title: 'Terminé (Clos)',      color: 'green', icon: '✅' },
]

export async function getKanbanColumns() {
  const customization = await getKanbanCustomization()
  return KANBAN_COLUMNS.map((col) => {
    const statusId = Number(col?.id)
    const customColor = customization?.colorsByStatus?.[statusId]
    const customLabel = customization?.labelsByStatus?.[statusId]
    return {
      ...col,
      color: customColor || col.color,
      title: customLabel || col.title,
    }
  })
}

export function getKanbanColumnsSync(customization) {
  const cust = customization || { ...DEFAULT_KANBAN_CUSTOMIZATION }
  return KANBAN_COLUMNS.map((col) => {
    const statusId = Number(col?.id)
    const customColor = cust?.colorsByStatus?.[statusId]
    const customLabel = cust?.labelsByStatus?.[statusId]
    return {
      ...col,
      color: customColor || col.color,
      title: customLabel || col.title,
    }
  })
}

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

export function formatStatusLabel(statusValue, customization = null) {
  const status = normalizeTicketStatus(statusValue)
  const custom = customization?.labelsByStatus?.[status]
  if (custom) return custom
  if (status === 1) return 'Nouveau'
  if (status === 2) return 'En cours (Attribué)'
  if (status === 3) return 'Planifié'
  if (status === 4) return 'En attente'
  if (status === 5) return 'Résolu'
  if (status === 6) return 'Clos'
  return 'Inconnu'
}

export function getMoveDialogConfig({ fromStatus, toStatus }) {
  const from = Number(fromStatus)
  const to   = Number(toStatus)
  if (Number.isNaN(from) || Number.isNaN(to) || from === to) return null

  if (to === KANBAN_TICKET_STATUSES.IN_PROGRESS) {
    return {
      title: 'Passer en cours',
      fields: [
        { key: 'assigneeId', label: 'ID technicien (optionnel)', type: 'number',   required: false },
        { key: 'comment',    label: 'Commentaire (optionnel)',   type: 'textarea', required: false },
      ],
    }
  }

  if (to === KANBAN_TICKET_STATUSES.CLOSED) {
    return {
      title: 'Clôturer le ticket',
      fields: [
        { key: 'solution', label: 'Solution / note de clôture (optionnel)', type: 'textarea', required: false },
        { key: 'comment',  label: 'Commentaire (optionnel)',                type: 'textarea', required: false },
      ],
    }
  }

  return null
}

async function fetchAll(path) {
  try {
    const response = await api.get(path, { params: { range: '0-999999' } })
    return extractItems(response?.data) || []
  } catch (err) {
    if (err?.response?.status === 404) {
      const legacyPath = path.replace(/^\/Assets/, '').replace(/^\/Assistance/, '')
      const response = await legacy.get(legacyPath, { params: { range: '0-999999' } })
      return extractItems(response?.data) || []
    }
    throw err
  }
}

export async function fetchKanbanTickets() {
  const tickets = await fetchAll('/Assistance/Ticket')
  const allowed = new Set([
    KANBAN_TICKET_STATUSES.NEW,
    KANBAN_TICKET_STATUSES.IN_PROGRESS,
    KANBAN_TICKET_STATUSES.CLOSED,
  ])
  return (tickets || []).filter(
    (t) => !isDeletedOrTemplate(t) && allowed.has(getTicketStatusId(t))
  )
}

export async function getTicketDetails(ticketId) {
  const response = await Legacy.get(`/Ticket/${ticketId}`)
  return response?.data
}

/**
 * Récupère les acteurs d'un ticket (demandeurs, assignés, observateurs).
 *
 * STRATÉGIE :
 * 1. GET /Ticket/{id}/Ticket_User  → liste des lignes glpi_tickets_users
 *    Chaque ligne contient { users_id: <entier ou objet>, type: 1|2|3 }
 * 2. GET /Ticket/{id}/Group_Ticket → liste des lignes glpi_groups_tickets
 *    Chaque ligne contient { groups_id: <entier ou objet>, type: 1|2|3 }
 * 3. Pour chaque ID trouvé, résoudre le nom via GET /User/{id} ou GET /Group/{id}
 *    (avec cache mémoire pour éviter les doublons)
 *
 * On n'utilise PAS expand_dropdowns car le format retourné varie selon
 * la version de GLPI et peut retourner un objet incomplet ou un entier.
 * La résolution individuelle par ID est plus fiable.
 */
export async function getTicketActors(ticketId) {
  const id = Number(ticketId)
  if (!id || Number.isNaN(id)) return { requesters: [], assignees: [], observers: [] }

  // ── 1. Récupérer les lignes Ticket_User et Group_Ticket ──────────
  const [userResponse, groupResponse] = await Promise.allSettled([
    Legacy.get(`/Ticket/${id}/Ticket_User`, { range: '0-9999' }),
    Legacy.get(`/Ticket/${id}/Group_Ticket`, { range: '0-9999' }),
  ])

  const userRows  = userResponse.status  === 'fulfilled'
    ? normalizeLegacyList(userResponse.value?.data)
    : []
  const groupRows = groupResponse.status === 'fulfilled'
    ? normalizeLegacyList(groupResponse.value?.data)
    : []

  // ── 2. Extraire les IDs et types ─────────────────────────────────
  // { type: 1|2|3, userId: number }[]
  const userEntries = userRows
    .map((row) => ({ type: Number(row?.type), userId: extractId(row?.users_id) }))
    .filter((e) => e.userId && [1, 2, 3].includes(e.type))

  // { type: 1|2|3, groupId: number }[]
  const groupEntries = groupRows
    .map((row) => ({ type: Number(row?.type), groupId: extractId(row?.groups_id) }))
    .filter((e) => e.groupId && [1, 2, 3].includes(e.type))

  // ── 3. Résoudre les noms en parallèle ────────────────────────────
  const [resolvedUsers, resolvedGroups] = await Promise.all([
    Promise.all(
      userEntries.map(async (e) => {
        const user = await resolveUserName(e.userId)
        return user ? { ...user, kind: 'user', type: e.type } : null
      })
    ),
    Promise.all(
      groupEntries.map(async (e) => {
        const group = await resolveGroupName(e.groupId)
        return group ? { ...group, kind: 'group', type: e.type } : null
      })
    ),
  ])

  // ── 4. Classer par type ──────────────────────────────────────────
  const requesters = []
  const assignees  = []
  const observers  = []

  ;[...resolvedUsers, ...resolvedGroups]
    .filter(Boolean)
    .forEach((actor) => {
      if (actor.type === 1) requesters.push(actor)
      if (actor.type === 2) assignees.push(actor)
      if (actor.type === 3) observers.push(actor)
    })

  return { requesters, assignees, observers }
}

export async function updateTicketStatus(ticketId, toStatus, extra = {}) {
  const basePayload = compactObject({
    id:     Number(ticketId),
    status: Number(toStatus),
  })

  const extendedPayload = compactObject({
    ...basePayload,
    solution:        extra.solution,
    comment:         extra.comment,
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
