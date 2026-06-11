import { get, post, put, Legacy } from './api'
import backendApi from './backend-api'

export const REQUIRED_TICKET_COLUMNS = [
  'Ref_Ticket',
  'Date',
  'Heure',
  'Type',
  'Titre',
  'Description',
  'Status',
  'Priority',
  'Items',
]

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

function extractIdFromResponse(data) {
  if (!data) return null
  if (Array.isArray(data)) return data[0]?.id ?? null
  if (typeof data === 'object') return data.id ?? null
  return null
}

function extractItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

async function fetchAll(path, { range = '0-9999', ...params } = {}) {
  try {
    const response = await get(path, { range, ...params })
    return extractItems(response?.data)
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Fallback to legacy API if modern API route doesn't exist
      const legacyPath = '/' + path.split('/').pop()
      const response = await Legacy.get(legacyPath, { range, ...params }).catch(() => null)
      return extractItems(response?.data)
    }
    throw err
  }
}

function coerceId(value) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

function mapType(value) {
  const raw = String(value ?? '').trim()
  const numeric = coerceId(raw)
  if (numeric === 1 || numeric === 2) return numeric

  const key = normalizeKey(raw)
  if (!key) return null
  if (key === 'incident' || key === 'incident_type') return 1
  if (key === 'request' || key === 'request_type' || key.includes('demande')) return 2
  return null
}

function mapStatus(value) {
  const raw = String(value ?? '').trim()
  const numeric = coerceId(raw)
  if (numeric) return numeric

  const key = normalizeKey(raw)
  if (!key) return null
  if (key === 'new' || key === 'nouveau') return 1
  if (key === 'assigned' || key === 'in progress' || key.includes('assigne')) return 2
  if (key === 'planned' || key.includes('planifie')) return 3
  if (key === 'pending' || key.includes('attente')) return 4
  if (key === 'solved' || key.includes('resolu')) return 5
  if (key === 'closed' || key === 'clos') return 6
  if (key === 'approval' || key.includes('approbation')) return 10
  return null
}

function mapPriority(value) {
  const raw = String(value ?? '').trim()
  const numeric = coerceId(raw)
  if (numeric && numeric >= 1 && numeric <= 6) return numeric

  const key = normalizeKey(raw)
  if (!key) return null
  if (key === 'very low' || key === 'tres basse' || key === 'tresbas') return 1
  if (key === 'low' || key === 'basse') return 2
  if (key === 'medium' || key === 'moyenne') return 3
  if (key === 'high' || key === 'haute') return 4
  if (key === 'very high' || key === 'tres haute' || key === 'treshaute') return 5
  if (key === 'major' || key === 'majeure') return 6
  return null
}

function parseFrenchDate(dateValue) {
  const raw = String(dateValue ?? '').trim()
  if (!raw) return null
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  return { yyyy, mm, dd }
}

function parseTime(timeValue) {
  const raw = String(timeValue ?? '').trim()
  if (!raw) return null
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!match) return null
  const hh = match[1].padStart(2, '0')
  const min = match[2]
  const sec = (match[3] ?? '00').padStart(2, '0')
  return { hh, min, sec }
}

function buildDateTime(dateValue, timeValue) {
  const d = parseFrenchDate(dateValue)
  const t = parseTime(timeValue)
  if (!d || !t) return null
  return `${d.yyyy}-${d.mm}-${d.dd} ${t.hh}:${t.min}:${t.sec}`
}

function parseItemsField(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map((v) => String(v ?? '').trim()).filter(Boolean)
  } catch (err) {
    void err
  }
  return raw
    .split(/[;,]/g)
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
}

function addIndex(map, key, value) {
  if (!key) return
  if (map.has(key)) return
  map.set(key, value)
}

function buildAssetKeyIndex({ itemType, items }) {
  const index = new Map()
  items.forEach((item) => {
    const id = item?.id
    if (!id) return
    const nameKey = normalizeKey(item?.name)
    const serialKey = normalizeKey(item?.otherserial)
    addIndex(index, nameKey, { itemType, id })
    addIndex(index, serialKey, { itemType, id })
  })
  return index
}

async function buildAssetsIndex() {
  const paths = [
    { itemType: 'Computer', path: '/Assets/Computer' },
    { itemType: 'Monitor', path: '/Assets/Monitor' },
    { itemType: 'Printer', path: '/Assets/Printer' },
    { itemType: 'Peripheral', path: '/Assets/Peripheral' },
    { itemType: 'Phone', path: '/Assets/Phone' },
    { itemType: 'NetworkEquipment', path: '/Assets/NetworkEquipment' },
  ]

  const lists = await Promise.all(paths.map((p) => fetchAll(p.path, { range: '0-999999' })))
  const merged = new Map()

  paths.forEach((p, idx) => {
    const index = buildAssetKeyIndex({ itemType: p.itemType, items: lists[idx] ?? [] })
    index.forEach((value, key) => addIndex(merged, key, value))
  })

  return merged
}

async function fetchExistingTicketExternalIds() {
  const tickets = await fetchAll('/Assistance/Ticket', { range: '0-999999' })
  const existing = new Set()
  tickets.forEach((t) => {
    const key = normalizeKey(t?.externalid)
    if (key) existing.add(key)
  })
  return existing
}

function extractErrorMessage(err) {
  if (err?.response?.data) {
    if (typeof err.response.data === 'string') return err.response.data
    return JSON.stringify(err.response.data)
  }
  return err?.message || 'Erreur lors de la création.'
}

async function createTicket(payload) {
  // Use Legacy API for creation to ensure compatibility with standard GLPI REST paths
  const response = await Legacy.post('/Ticket', payload)
  return extractIdFromResponse(response?.data)
}

async function updateTicket(id, payload) {
  // Use Legacy API for updates to ensure compatibility with standard GLPI REST paths
  await Legacy.put(`/Ticket/${id}`, { id, ...payload })
}

async function linkTicketToItem({ tickets_id, itemtype, items_id }) {
  await Legacy.post('/Item_Ticket', { tickets_id, itemtype, items_id })
}

function normalizeAssetItemType(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const key = normalizeKey(raw)
  if (key === 'computer' || key === 'pc' || key === 'ordinateur') return 'Computer'
  if (key === 'monitor' || key === 'ecran' || key === 'moniteur') return 'Monitor'
  if (key === 'printer' || key === 'imprimante') return 'Printer'
  if (key === 'peripheral' || key === 'peripherique') return 'Peripheral'
  if (key === 'phone' || key === 'telephone') return 'Phone'
  if (key === 'networkequipment' || key.includes('reseau')) return 'NetworkEquipment'
  return raw
}

function buildAssetRowsIndex(assetRows) {
  const byKey = new Map()
  if (!Array.isArray(assetRows)) return byKey

  assetRows.forEach((row) => {
    const name = String(row?.Name ?? '').trim()
    const inventoryNumber = String(row?.Inventory_Number ?? '').trim()
    const itemType = normalizeAssetItemType(row?.Item_Type)
    if (!itemType) return

    const nameKey = normalizeKey(name)
    const invKey = normalizeKey(inventoryNumber)

    if (nameKey) byKey.set(nameKey, itemType)
    if (invKey) byKey.set(invKey, itemType)
  })

  return byKey
}

function buildTypeAssetIdIndex(items) {
  const index = new Map()
  items.forEach((item) => {
    const id = item?.id
    if (!id) return
    const nameKey = normalizeKey(item?.name)
    const serialKey = normalizeKey(item?.otherserial)
    if (nameKey && !index.has(nameKey)) index.set(nameKey, id)
    if (serialKey && !index.has(serialKey)) index.set(serialKey, id)
  })
  return index
}

async function resolveAsset({ itemKey, assetsIndex, assetRowsIndex, typeCache }) {
  const preferredType = assetRowsIndex?.get(itemKey) ?? null
  if (preferredType) {
    let cached = typeCache.get(preferredType) ?? null
    if (!cached) {
      let endpoint = `/Assets/${preferredType}`
      if (preferredType === 'ConsumableItem' || preferredType === 'CartridgeItem') {
        endpoint = `/Management/${preferredType}`
      } else if (preferredType === 'PassiveDCEquipmentModel' || preferredType === 'PDUModel' || preferredType === 'RackModel') {
        endpoint = `/Dropdowns/${preferredType}`
      }
      const list = await fetchAll(endpoint, { range: '0-999999' }).catch(() => [])
      cached = { idIndex: buildTypeAssetIdIndex(list) }
      typeCache.set(preferredType, cached)
    }
    const id = cached.idIndex.get(itemKey) ?? null
    if (id) return { itemType: preferredType, id }
  }

  return assetsIndex.get(itemKey) ?? null
}

export async function importTicketsFromRows(rows, { onProgress, onResults, assetRows } = {}) {
  const total = Array.isArray(rows) ? rows.length : 0
  const results = []

  const report = (done) => {
    onProgress?.({ done, total })
    onResults?.([...results])
  }

  const [assetsIndex, existingExternalIds] = await Promise.all([buildAssetsIndex(), fetchExistingTicketExternalIds()])
  const assetRowsIndex = buildAssetRowsIndex(assetRows)
  const typeCache = new Map()

  for (let idx = 0; idx < total; idx++) {
    const row = rows[idx]
    const refTicket = String(row?.Ref_Ticket ?? '').trim()
    const title = String(row?.Titre ?? '').trim()
    const description = String(row?.Description ?? '').trim()
    const type = mapType(row?.Type)
    const status = mapStatus(row?.Status)
    const priority = mapPriority(row?.Priority)
    const dateTime = buildDateTime(row?.Date, row?.Heure)
    const items = parseItemsField(row?.Items)

    if (!title) {
      results.push({ index: idx + 1, itemType: 'Ticket', name: '', status: 'error', message: 'Titre vide.' })
      report(idx + 1)
      continue
    }

    const refKey = normalizeKey(refTicket)
    if (refKey && existingExternalIds.has(refKey)) {
      results.push({ index: idx + 1, itemType: 'Ticket', name: title, status: 'skipped', message: `Déjà existant (Ref_Ticket=${refTicket}).` })
      report(idx + 1)
      continue
    }

    if (!dateTime) {
      results.push({ index: idx + 1, itemType: 'Ticket', name: title, status: 'error', message: 'Date/Heure invalide.' })
      report(idx + 1)
      continue
    }

    if (!type) {
      results.push({ index: idx + 1, itemType: 'Ticket', name: title, status: 'error', message: `Type invalide (${String(row?.Type ?? '').trim()}).` })
      report(idx + 1)
      continue
    }
    if (!status) {
      results.push({ index: idx + 1, itemType: 'Ticket', name: title, status: 'error', message: `Status invalide (${String(row?.Status ?? '').trim()}).` })
      report(idx + 1)
      continue
    }

    if (!priority) {
      results.push({ index: idx + 1, itemType: 'Ticket', name: title, status: 'error', message: `Priority invalide (${String(row?.Priority ?? '').trim()}).` })
      report(idx + 1)
      continue
    }

    try {
      const isClosed = status === 6
      const payload = compactObject({
        entities_id: 0,
        name: title,
        content: description,
        type,
        status: isClosed ? 1 : status,
        priority,
        date: dateTime,
        externalid: refTicket || undefined,
      })

      const ticketId = await createTicket(payload)
      if (refKey) existingExternalIds.add(refKey)

      // Save initial status to history
      try {
        await backendApi.post('/api/ticket-history', {
          ticketId: ticketId,
          oldStatus: null,
          newStatus: payload.status,
          comment: "Importation du ticket"
        });
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'historique initial", error);
      }

      const missingItems = []
      const linkedItems = []
      const linkErrors = []

      if (ticketId && items.length > 0) {
        for (const rawItem of items) {
          const itemKey = normalizeKey(rawItem)
          const resolved = await resolveAsset({ itemKey, assetsIndex, assetRowsIndex, typeCache })
          if (!resolved) {
            missingItems.push(rawItem)
            continue
          }
          try {
            await linkTicketToItem({
              tickets_id: ticketId,
              itemtype: resolved.itemType,
              items_id: resolved.id,
            })
            linkedItems.push(rawItem)
          } catch (err) {
            linkErrors.push(`${rawItem}: ${extractErrorMessage(err)}`)
          }
        }
      }

      const parts = []
      if (ticketId) {
        if (isClosed) {
          try {
            await updateTicket(ticketId, { status: 6 })
            // Save the status change to history
            try {
              await backendApi.post('/api/ticket-history', {
                ticketId: ticketId,
                oldStatus: payload.status,
                newStatus: 6,
                comment: "Clôture du ticket (import)"
              });
            } catch (err) {
              console.error("Erreur lors de l'enregistrement de l'historique de clôture", err);
            }
            parts.push(`Créé et clôturé (id=${ticketId}).`)
          } catch (err) {
            parts.push(`Créé (id=${ticketId}) mais erreur clôture: ${extractErrorMessage(err)}.`)
          }
        } else {
          parts.push(`Créé (id=${ticketId}).`)
        }
      } else {
        parts.push('Créé.')
      }

      if (items.length > 0) parts.push(`Liens: ${linkedItems.length}/${items.length}.`)
      if (missingItems.length > 0) parts.push(`Introuvables: ${missingItems.join(', ')}.`)
      if (linkErrors.length > 0) parts.push(`Erreurs liaison: ${linkErrors.join(' | ')}.`)

      results.push({
        index: idx + 1,
        itemType: 'Ticket',
        name: title,
        status: 'created',
        message: parts.join(' '),
      })
    } catch (err) {
      results.push({
        index: idx + 1,
        itemType: 'Ticket',
        name: title,
        status: 'error',
        message: extractErrorMessage(err),
      })
    }

    report(idx + 1)
  }

  return results
}