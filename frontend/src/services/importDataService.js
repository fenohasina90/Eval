import { get, patch, post, Legacy } from './api'

export const REQUIRED_COLUMNS = ['Name', 'Status', 'Location', 'Manufacturer', 'Item_Type', 'Model', 'Inventory_Number', 'User']

const DEFAULT_STATE_VISIBILITIES = {
  computer: true,
  monitor: true,
  networkequipment: true,
  peripheral: true,
  phone: true,
  printer: true,
  softwarelicense: true,
  certificate: true,
  enclosure: true,
  pdu: true,
  line: true,
  rack: true,
  softwareversion: true,
  cluster: true,
  contract: true,
  appliance: true,
  databaseinstance: true,
  cable: true,
  unmanaged: true,
  passivedcequipment: true,
}

const HAS_LEGACY_USER_TOKEN = Boolean(import.meta.env.VITE_LEGACY_USER_TOKEN)

function extractLegacyItem(data) {
  if (!data) return null
  if (Array.isArray(data)) return data[0] ?? null
  if (typeof data === 'object') {
    if (data.data && typeof data.data === 'object') return data.data
    return data
  }
  return null
}

async function ensureLegacyStateVisibilities(stateId) {
  if (!stateId) return

  const { data } = await Legacy.get(`/State/${stateId}`)
  const item = extractLegacyItem(data)
  if (!item || typeof item !== 'object') return

  const visibilityKeys = Object.keys(item).filter((key) => key.startsWith('is_visible_'))
  const payload = Object.fromEntries(visibilityKeys.map((key) => [key, 1]))

  if ('is_helpdesk_visible' in item) payload.is_helpdesk_visible = 1
  if ('is_helpdeskvisible' in item) payload.is_helpdeskvisible = 1

  if (Object.keys(payload).length === 0) return
  await Legacy.put(`/State/${stateId}`, payload)
}

function normalizeKey(value) {
  return String(value ?? '').trim().toLowerCase()
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

function slug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
}

function buildUserFromDisplay(display) {
  const raw = String(display ?? '').trim()
  if (!raw) return null

  const parts = raw.split(/\s+/).filter(Boolean)
  const realname = parts[0] ? parts[0] : raw
  const firstname = parts.length > 1 ? parts.slice(1).join(' ') : ''
  const username = slug(firstname ? `${realname}.${firstname}` : realname) || slug(raw)

  return {
    username,
    realname,
    firstname,
    entities_id: 0,
    is_active: 1,
  }
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }
    current += char
  }
  values.push(current)
  return values.map((v) => v.trim())
}

export function parseCsvText(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length === 0) return []

  const headers = parseCsvLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    rows.push(row)
  }
  return rows
}

async function fetchAll(itemType) {
  const response = await get(itemType, { range: '0-9999' })
  const data = response?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

async function buildNameIdMap({ path, nameKey = 'name' }) {
  const items = await fetchAll(path)
  const map = new Map()
  items.forEach((item) => {
    const name = item?.[nameKey]
    const id = item?.id
    if (!id || !name) return
    map.set(normalizeKey(name), id)
  })
  return map
}

async function buildNameIdMapWithItems({ path, nameKey = 'name' }) {
  const items = await fetchAll(path)
  const map = new Map()
  items.forEach((item) => {
    const name = item?.[nameKey]
    const id = item?.id
    if (!id || !name) return
    map.set(normalizeKey(name), id)
  })
  return { map, items }
}

async function getOrCreateByName({ path, name, cache, createPayload }) {
  const key = normalizeKey(name)
  if (!key) return null

  const cached = cache.get(key)
  if (cached) return cached

  try {
    const payload = createPayload(name)
    const response = await post(path, payload)
    const id = extractIdFromResponse(response?.data)
    if (id) {
      cache.set(key, id)
      return id
    }
  } catch (err) {
    void err
  }

  try {
    const refreshed = await buildNameIdMap({ path })
    const id = refreshed.get(key) ?? null
    if (id) {
      cache.set(key, id)
      return id
    }
  } catch (err) {
    void err
  }

  return null
}

function computeExistingKeys(items) {
  const byName = new Set()
  const bySerial = new Set()
  items.forEach((item) => {
    const isDeleted = item?.is_deleted === true || item?.is_deleted === 1 || item?.is_deleted === '1'
    const isTemplate = item?.is_template === true || item?.is_template === 1 || item?.is_template === '1'
    if (isDeleted || isTemplate) return
    const nameKey = normalizeKey(item?.name)
    const serialKey = normalizeKey(item?.otherserial)
    if (nameKey) byName.add(nameKey)
    if (serialKey) bySerial.add(serialKey)
  })
  return { byName, bySerial }
}

function extractErrorMessage(err) {
  if (err?.response?.data) {
    if (typeof err.response.data === 'string') return err.response.data
    return JSON.stringify(err.response.data)
  }
  return err?.message || 'Erreur lors de la création.'
}

export async function importAssetsFromRows(
  rows,
  { onProgress, onResults } = {}
) {
  const total = Array.isArray(rows) ? rows.length : 0
  const results = []

  const report = (done) => {
    onProgress?.({ done, total })
    onResults?.([...results])
  }

  const [stateInfo, locations, manufacturers, computerModels, monitorModels, users, computers, monitors] = await Promise.all([
    (async () => {
      const { map, items } = await buildNameIdMapWithItems({ path: '/Dropdowns/State' })
      const first = Array.isArray(items) ? items[0] : null
      const visibilityKeys = first?.visibilities && typeof first.visibilities === 'object' ? Object.keys(first.visibilities) : []
      return { map, visibilityKeys }
    })(),
    buildNameIdMap({ path: '/Dropdowns/Location' }),
    buildNameIdMap({ path: '/Dropdowns/Manufacturer' }),
    buildNameIdMap({ path: '/Dropdowns/ComputerModel' }),
    buildNameIdMap({ path: '/Dropdowns/MonitorModel' }),
    buildNameIdMap({ path: '/Administration/User', nameKey: 'username' }),
    fetchAll('/Assets/Computer'),
    fetchAll('/Assets/Monitor'),
  ])

  const states = stateInfo.map
  const stateVisibilityKeys = stateInfo.visibilityKeys

  const existingComputer = computeExistingKeys(computers)
  const existingMonitor = computeExistingKeys(monitors)
  const ensuredStateVisibilities = new Set()
  const ensuredLegacyStateVisibilities = new Set()
  const desiredStateVisibilities = stateVisibilityKeys.length
    ? Object.fromEntries(stateVisibilityKeys.map((key) => [key, true]))
    : DEFAULT_STATE_VISIBILITIES

  for (let idx = 0; idx < total; idx++) {
    const row = rows[idx]
    const name = String(row?.Name ?? '').trim()
    const itemTypeRaw = String(row?.Item_Type ?? '').trim()
    const itemType = itemTypeRaw.toLowerCase() === 'monitor' ? 'Monitor' : 'Computer'
    const statusName = String(row?.Status ?? '').trim()
    const locationName = String(row?.Location ?? '').trim()
    const manufacturerName = String(row?.Manufacturer ?? '').trim()
    const modelName = String(row?.Model ?? '').trim()
    const inventoryNumber = String(row?.Inventory_Number ?? '').trim()
    const userDisplay = String(row?.User ?? '').trim()

    if (!name) {
      results.push({ index: idx + 1, name: '', itemType, status: 'error', message: 'Name vide.' })
      report(idx + 1)
      continue
    }

    const nameKey = normalizeKey(name)
    const serialKey = normalizeKey(inventoryNumber)
    const existing = itemType === 'Monitor' ? existingMonitor : existingComputer

    if (existing.byName.has(nameKey) || (serialKey && existing.bySerial.has(serialKey))) {
      results.push({ index: idx + 1, name, itemType, status: 'skipped', message: 'Déjà existant.' })
      report(idx + 1)
      continue
    }

    const statusId = await getOrCreateByName({
      path: '/Dropdowns/State',
      name: statusName,
      cache: states,
      createPayload: (n) => ({
        name: n,
        entities_id: 0,
        visibilities: desiredStateVisibilities,
      }),
    })

    if (statusId && !ensuredStateVisibilities.has(statusId)) {
      ensuredStateVisibilities.add(statusId)
      try {
        await patch(`/Dropdowns/State/${statusId}`, { visibilities: desiredStateVisibilities })
      } catch (err) {
        void err
      }
    }

    if (HAS_LEGACY_USER_TOKEN && statusId && !ensuredLegacyStateVisibilities.has(statusId)) {
      ensuredLegacyStateVisibilities.add(statusId)
      try {
        await ensureLegacyStateVisibilities(statusId)
      } catch (err) {
        void err
      }
    }

    const locationId = await getOrCreateByName({
      path: '/Dropdowns/Location',
      name: locationName,
      cache: locations,
      createPayload: (n) => ({ name: n, entities_id: 0, locations_id: 0 }),
    })

    const manufacturerId = await getOrCreateByName({
      path: '/Dropdowns/Manufacturer',
      name: manufacturerName,
      cache: manufacturers,
      createPayload: (n) => ({ name: n }),
    })

    const modelId =
      itemType === 'Monitor'
        ? await getOrCreateByName({
          path: '/Dropdowns/MonitorModel',
          name: modelName,
          cache: monitorModels,
          createPayload: (n) => ({ name: n }),
        })
        : await getOrCreateByName({
          path: '/Dropdowns/ComputerModel',
          name: modelName,
          cache: computerModels,
          createPayload: (n) => ({ name: n }),
        })

    let users_id = null
    const userPayload = buildUserFromDisplay(userDisplay)
    if (userPayload) {
      users_id = await getOrCreateByName({
        path: '/Administration/User',
        name: userPayload.username,
        cache: users,
        createPayload: () => userPayload,
      })
    }

    try {
      const payload = compactObject({
        name,
        status: statusId ? { id: statusId } : undefined,
        location: locationId ? { id: locationId } : undefined,
        manufacturer: manufacturerId ? { id: manufacturerId } : undefined,
        otherserial: inventoryNumber,
        user: users_id ? { id: users_id } : undefined,
        model: modelId ? { id: modelId } : undefined,
      })

      const response = await post(`/Assets/${itemType}`, payload)
      const createdId = extractIdFromResponse(response?.data)

      existing.byName.add(nameKey)
      if (serialKey) existing.bySerial.add(serialKey)

      results.push({
        index: idx + 1,
        name,
        itemType,
        status: 'created',
        message: createdId ? `Créé (id=${createdId}).` : 'Créé.',
      })
    } catch (err) {
      results.push({
        index: idx + 1,
        name,
        itemType,
        status: 'error',
        message: extractErrorMessage(err),
      })
    }

    report(idx + 1)
  }

  return results
}
