import { get, post, Legacy } from './api'

export const REQUIRED_TICKET_COST_COLUMNS = ['Num_Ticket', 'Duration_second', 'Time_Cost', 'Fixed_Cost']

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function compactObject(obj) {
  const out = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (typeof value === 'string' && value.trim().length === 0) return
    out[key] = value
  })
  return out
}

function extractItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

function extractIdFromResponse(data) {
  if (!data) return null
  if (Array.isArray(data)) return data[0]?.id ?? null
  if (typeof data === 'object') return data.id ?? null
  return null
}


async function buildTicketIdByExternalId() {
  // Utiliser la Legacy API (v1) pour être cohérent avec importTicketCsvService
  // qui insère via Legacy avec le champ "externalid"
  // La v1 retourne bien "externalid" (sans underscore)
  const response = await Legacy.get('/Ticket', { range: '0-999999' })
  const tickets = extractItems(response?.data)
  const map = new Map()
  tickets.forEach((t) => {
    // v1 (Legacy) retourne "externalid" sans underscore
    // v2 (api.php) retourne "external_id" avec underscore
    // On supporte les deux pour robustesse
    const extRaw = t?.externalid ?? t?.external_id ?? null
    const ext = normalizeKey(extRaw)
    const id = t?.id
    if (!ext || !id) return
    if (map.has(ext)) return
    map.set(ext, id)
  })
  return map
}

function parseIntOrZero(value) {
  const n = Number.parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(n) ? n : 0
}

function parseFloatOrZero(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return 0
  const normalized = raw.replace(/\s+/g, '').replace(',', '.')
  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

function extractErrorMessage(err) {
  if (err?.response?.data) {
    if (typeof err.response.data === 'string') return err.response.data
    return JSON.stringify(err.response.data)
  }
  return err?.message || 'Erreur lors de la création.'
}

async function createTicketCost(ticketId, payload) {
  // Utiliser Legacy API (v1) — POST /TicketCost
  // La v2 /Assistance/Ticket/{id}/Cost n'est pas encore stable pour l'écriture
  const response = await Legacy.post('/TicketCost', payload)
  return extractIdFromResponse(response?.data)
}

export async function importTicketCostsFromRows(rows, { onProgress, onResults } = {}) {
  const total = Array.isArray(rows) ? rows.length : 0
  const results = []

  const report = (done) => {
    onProgress?.({ done, total })
    onResults?.([...results])
  }

  const ticketIdByExternalId = await buildTicketIdByExternalId()

  for (let idx = 0; idx < total; idx++) {
    const row = rows[idx]
    const externalId = String(row?.Num_Ticket ?? '').trim()
    const externalKey = normalizeKey(externalId)
    const ticketId = externalKey ? ticketIdByExternalId.get(externalKey) ?? null : null

    if (!externalId) {
      results.push({ index: idx + 1, itemType: 'TicketCost', name: '', status: 'error', message: 'Num_Ticket vide.' })
      report(idx + 1)
      continue
    }

    if (!ticketId) {
      results.push({
        index: idx + 1,
        itemType: 'TicketCost',
        name: externalId,
        status: 'error',
        message: `Ticket introuvable (externalid=${externalId}). Le ticket a-t-il été importé depuis fichier2 ?`,
      })
      report(idx + 1)
      continue
    }

    const duration = parseIntOrZero(row?.Duration_second)
    const costTime = parseFloatOrZero(row?.Time_Cost)
    const costFixed = parseFloatOrZero(row?.Fixed_Cost)

    try {
      const payload = compactObject({
        name: `Cout Ticket ${ticketId}`,
        tickets_id: ticketId,     // ← clé étrangère obligatoire en Legacy
        actiontime: duration,     // ← vrai champ glpi_ticketcosts (pas "duration")
        cost_time: costTime,
        cost_fixed: costFixed,
      })

      const createdId = await createTicketCost(ticketId, payload)

      results.push({
        index: idx + 1,
        itemType: 'TicketCost',
        name: externalId,
        status: 'created',
        message: createdId ? `Créé (id=${createdId}, ticket_id=${ticketId}).` : `Créé (ticket_id=${ticketId}).`,
      })
    } catch (err) {
      results.push({
        index: idx + 1,
        itemType: 'TicketCost',
        name: externalId,
        status: 'error',
        message: extractErrorMessage(err),
      })
    }

    report(idx + 1)
  }

  return results
}
