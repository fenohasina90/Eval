import api, { legacy } from './api'

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
  // Le type peut être un nombre direct ou un objet { id: 1, name: '...' }
  let n;
  if (value && typeof value === 'object' && value.id !== undefined) {
    n = Number(value.id);
  } else {
    n = Number(value);
  }
  if (n === 1 || n === 2) return n;
  return null;
}

function normalizeTicketStatus(value) {
  // Le status peut être un nombre direct ou un objet { id: 1, name: '...' }
  let n;
  if (value && typeof value === 'object' && value.id !== undefined) {
    n = Number(value.id);
  } else {
    n = Number(value);
  }
  if ([1, 2, 3, 4, 5, 6].includes(n)) return n;
  return null;
}

async function fetchAll(path) {
  try {
    // Utiliser limit=999999 pour récupérer un maximum d'éléments
    const response = await api.get(path, {
      params: { limit: 999999 }
    });

    const items = extractItems(response?.data);
    console.log(`✅ ${path}: ${items?.length || 0} éléments récupérés`);
    return items || [];

  } catch (err) {
    // Fallback vers l'API legacy
    if (err.response && err.response.status === 404) {
      const legacyPath = path.replace(/^\/Assets/, '').replace(/^\/Assistance/, '');
      try {
        const response = await legacy.get(legacyPath, {
          params: { limit: 999999 }
        });
        const items = extractItems(response?.data);
        console.log(`✅ (Legacy) ${legacyPath}: ${items?.length || 0} éléments récupérés`);
        return items || [];
      } catch (legacyErr) {
        console.error(`Legacy fallback also failed for ${path}`, legacyErr);
        return [];
      }
    }
    console.error(`Error fetching ${path}:`, err?.response?.status, err?.response?.data);
    return [];
  }
}

export const ASSET_TYPES = [
  { key: 'Computer', label: 'Ordinateurs', path: '/Assets/Computer' },
  { key: 'Monitor', label: 'Ecrans', path: '/Assets/Monitor' },
  { key: 'Printer', label: 'Imprimantes', path: '/Assets/Printer' },
  // { key: 'NetworkEquipment', label: 'Materiel reseau', path: '/Assets/NetworkEquipment' },
  // { key: 'Peripheral', label: 'Peripheriques', path: '/Assets/Peripheral' },
  { key: 'Phone', label: 'Telephones', path: '/Assets/Phone' },
  // { key: 'Rack', label: 'Baies', path: '/Assets/Rack' },
  // { key: 'Enclosure', label: 'Chassis', path: '/Assets/Enclosure' },
  // { key: 'Software', label: 'Logiciels', path: '/Assets/Software' },
  // { key: 'PassiveDCEquipment', label: 'Equipements passifs', path: '/Assets/PassiveDCEquipment' },
  // { key: 'PDU', label: 'PDU', path: '/Assets/PDU' },
  // { key: 'Cable', label: 'Cables', path: '/Assets/Cable' },
  // { key: 'CartridgeItem', label: 'Cartouches', path: '/Assets/CartridgeItem' },
  // { key: 'ConsumableItem', label: 'Consommables', path: '/Assets/ConsumableItem' },
]

export const TICKET_TYPES = [
  { key: 1, label: 'Incident' },
  { key: 2, label: 'Demande' },
]

export const TICKET_STATUSES = [
  { key: 1, label: 'Nouveau', color: 'blue' },
  { key: 2, label: 'En cours (Assigne)', color: 'yellow' },
  // { key: 3, label: 'En cours (Planifie)', color: 'orange' },
  // { key: 4, label: 'En attente', color: 'purple' },
  // { key: 5, label: 'Resolu', color: 'green' },
  { key: 6, label: 'Clos', color: 'green' },
]

export async function getDashboardStats() {
  const [tickets, ...assetLists] = await Promise.all([
    fetchAll('/Assistance/Ticket'),
    ...ASSET_TYPES.map((t) => fetchAll(t.path)),
  ])

  console.log(`📊 Total tickets récupérés: ${tickets.length}`)

  // Actifs par type
  const assetsByType = ASSET_TYPES.map((t, idx) => {
    const items = Array.isArray(assetLists[idx]) ? assetLists[idx] : []
    const count = items.filter((it) => !isDeletedOrTemplate(it)).length
    console.log(`${t.label}: ${count} éléments actifs sur ${items.length} total`)
    return { key: t.key, label: t.label, count }
  })
  const assetsTotal = assetsByType.reduce((sum, t) => sum + t.count, 0)

  // Tickets actifs (non supprimés, non templates)
  const activeTickets = tickets.filter((t) => !isDeletedOrTemplate(t))
  console.log(`🎫 Tickets actifs: ${activeTickets.length} sur ${tickets.length} total`)

  // Par type
  const ticketByTypeMap = new Map(TICKET_TYPES.map((t) => [t.key, 0]))
  activeTickets.forEach((t) => {
    const type = normalizeTicketType(t?.type)
    if (!type) return
    ticketByTypeMap.set(type, (ticketByTypeMap.get(type) ?? 0) + 1)
  })

  const ticketsByType = TICKET_TYPES.map((t) => {
    const count = ticketByTypeMap.get(t.key) ?? 0
    console.log(`${t.label}: ${count} tickets`)
    return {
      key: t.key,
      label: t.label,
      count,
    }
  })


  const ticketByStatusMap = new Map(TICKET_STATUSES.map((s) => [s.key, 0]))
  activeTickets.forEach((t) => {
    const status = normalizeTicketStatus(t?.status)
    if (status === null) {
      console.warn(`Ticket ${t.id} a un statut invalide:`, t?.status)
      return
    }
    ticketByStatusMap.set(status, (ticketByStatusMap.get(status) ?? 0) + 1)
  })

  // Debug : afficher le premier ticket pour inspection
  if (activeTickets.length > 0) {
    console.log('🔍 Exemple de ticket (premier):', {
      id: activeTickets[0].id,
      status: activeTickets[0].status,
      type: activeTickets[0].type
    })
  }

  const ticketsByStatus = TICKET_STATUSES.map((s) => {
    const count = ticketByStatusMap.get(s.key) ?? 0
    console.log(`${s.label}: ${count} tickets`)
    return {
      key: s.key,
      label: s.label,
      color: s.color,
      count,
    }
  })

  return {
    assets: { total: assetsTotal, byType: assetsByType },
    tickets: { total: activeTickets.length, byType: ticketsByType, byStatus: ticketsByStatus },
  }
}