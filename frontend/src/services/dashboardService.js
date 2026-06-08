import { get, Legacy } from './api'

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

function normalizeTicketType(value) {
  const n = Number(value)
  if (n === 1 || n === 2) return n
  return null
}

async function fetchAll(path) {
  try {
    const response = await get(path, { range: '0-999999' })
    return extractItems(response?.data)
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const legacyPath = path.replace(/^\/Assets/, '').replace(/^\/Assistance/, '');
      const response = await Legacy.get(legacyPath, { range: '0-999999' })
      return extractItems(response?.data)
    }
    console.error(`Error fetching ${path}`, err);
    return []; // Retourne un tableau vide au lieu de planter tout le dashboard
  }
}

export const ASSET_TYPES = [
  { key: 'Computer', label: 'Ordinateurs', path: '/Assets/Computer' },
  { key: 'Monitor', label: 'Écrans', path: '/Assets/Monitor' },
  { key: 'Printer', label: 'Imprimantes', path: '/Assets/Printer' },
  { key: 'NetworkEquipment', label: 'Matériel réseau', path: '/Assets/NetworkEquipment' },
  { key: 'Peripheral', label: 'Périphériques', path: '/Assets/Peripheral' },
  { key: 'Phone', label: 'Téléphones', path: '/Assets/Phone' },
  { key: 'Rack', label: 'Baies', path: '/Assets/Rack' },
  { key: 'Enclosure', label: 'Châssis', path: '/Assets/Enclosure' },
  { key: 'Software', label: 'Logiciels', path: '/Assets/Software' },
  { key: 'PassiveDCEquipment', label: 'Équipements passifs', path: '/Assets/PassiveDCEquipment' },
  { key: 'PDU', label: 'PDU', path: '/Assets/PDU' },
  { key: 'Cable', label: 'Câbles', path: '/Assets/Cable' },
  { key: 'Unmanaged', label: 'Actif non géré', path: '/Assets/Unmanaged' },
  { key: 'Appliance', label: 'Applicatif', path: '/Assets/Appliance' },
  { key: 'SoftwareLicense', label: 'Licence', path: '/Assets/SoftwareLicense' },
  { key: 'Certificate', label: 'Certificat', path: '/Assets/Certificate' }
]

export const TICKET_TYPES = [
  { key: 1, label: 'Incident' },
  { key: 2, label: 'Demande' },
]

export async function getDashboardStats() {
  const [tickets, ...assetLists] = await Promise.all([fetchAll('/Assistance/Ticket'), ...ASSET_TYPES.map((t) => fetchAll(t.path))])

  const assetsByType = ASSET_TYPES.map((t, idx) => {
    const items = Array.isArray(assetLists[idx]) ? assetLists[idx] : []
    const count = items.filter((it) => !isDeletedOrTemplate(it)).length
    return { key: t.key, label: t.label, count }
  })

  const assetsTotal = assetsByType.reduce((sum, t) => sum + t.count, 0)

  const ticketByTypeMap = new Map(TICKET_TYPES.map((t) => [t.key, 0]))
  tickets
    .filter((t) => !isDeletedOrTemplate(t))
    .forEach((t) => {
      const type = normalizeTicketType(t?.type)
      if (!type) return
      ticketByTypeMap.set(type, (ticketByTypeMap.get(type) ?? 0) + 1)
    })

  const ticketsByType = TICKET_TYPES.map((t) => ({ key: t.key, label: t.label, count: ticketByTypeMap.get(t.key) ?? 0 }))
  const ticketsTotal = ticketsByType.reduce((sum, t) => sum + t.count, 0)

  return {
    assets: { total: assetsTotal, byType: assetsByType },
    tickets: { total: ticketsTotal, byType: ticketsByType },
  }
}

