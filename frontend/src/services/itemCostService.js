import { Legacy } from './api'
import { superCoutService } from './superCoutService'
import { coutOuvertureService } from './coutOuvertureService'
import { getTicketHistory } from './ticketHistoryService'
import { KANBAN_TICKET_STATUSES } from './frontOfficeKanbanTicketService'

function extractItems(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.results)) return data.results
  return []
}

function parseFloatOrZero(value) {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function parseSecondsOrZero(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function computeTicketCostTotal(cost) {
  const actiontime = parseSecondsOrZero(cost?.actiontime)
  const costTime = parseFloatOrZero(cost?.cost_time)
  const costFixed = parseFloatOrZero(cost?.cost_fixed)
  const costMaterial = parseFloatOrZero(cost?.cost_material)
  const hours = actiontime > 0 ? actiontime / 3600 : 0
  const total = (hours * costTime) + costFixed + costMaterial
  return Number.isFinite(total) ? total : 0
}

/**
 * Fetches all TicketCost entries from GLPI
 */
export async function fetchAllTicketCosts() {
  try {
    const response = await Legacy.get('/TicketCost', { range: '0-999999' })
    return extractItems(response?.data) || []
  } catch (err) {
    console.error('Error fetching ticket costs:', err)
    return []
  }
}

/**
 * Fetches all Item_Ticket links from GLPI to map tickets to items
 */
export async function fetchAllItemTickets() {
  try {
    const response = await Legacy.get('/Item_Ticket', { range: '0-999999' })
    return extractItems(response?.data) || []
  } catch (err) {
    console.error('Error fetching item tickets:', err)
    return []
  }
}

/**
 * Fetches all tickets from GLPI
 */
export async function fetchAllTickets() {
  try {
    const response = await Legacy.get('/Ticket', { range: '0-999999' })
    return extractItems(response?.data) || []
  } catch (err) {
    console.error('Error fetching tickets:', err)
    return []
  }
}

async function recupererTousLesActifs() {
  const endpoints = [
    '/Computer', '/Monitor', '/Printer',
    '/NetworkEquipment', '/Peripheral', '/Phone',
    '/Rack', '/Enclosure', '/Software',
    '/PassiveDCEquipment', '/PDU', '/Cable',
    '/Unmanaged', '/Appliance', '/SoftwareLicense', '/Certificate'
  ]
  const requetes = endpoints.map(endpoint =>
    Legacy.get(endpoint, { params: { range: '0-999999', expand_dropdowns: true } }).catch(() => ({ data: [] }))
  )
  const reponses = await Promise.all(requetes)
  let actifs = []
  reponses.forEach((reponse, index) => {
    const type = endpoints[index].substring(1)
    const items = extractItems(reponse?.data) || []
    items.forEach(item => actifs.push({ ...item, itemtype: type }))
  })
  return actifs
}

/**
 * Aggregates cost data by item_type
 */
export async function aggregateItemTypeCosts() {
  try {
    // Fetch all necessary data in parallel
    const [ticketCosts, itemTickets, superCouts, coutOuvertures] = await Promise.all([
      fetchAllTicketCosts(),
      fetchAllItemTickets(),
      superCoutService.getAll().catch(() => []),
      coutOuvertureService.getAll().catch(() => [])
    ])

    // Create a map of ticket ID to items linked
    const ticketItemsMap = new Map()
    itemTickets.forEach((link) => {
      const ticketId = Number(link?.tickets_id)
      if (!ticketId) return

      if (!ticketItemsMap.has(ticketId)) {
        ticketItemsMap.set(ticketId, [])
      }

      ticketItemsMap.get(ticketId).push({
        itemId: Number(link?.items_id),
        itemType: link?.itemtype
      })
    })

    const ticketTotalCosts = new Map()
    ticketCosts.forEach((cost) => {
      const ticketId = Number(cost?.tickets_id)
      if (!ticketId) return

      const currentTotal = ticketTotalCosts.get(ticketId) || 0
      ticketTotalCosts.set(ticketId, currentTotal + computeTicketCostTotal(cost))
    })

    const ticketTotalSuperCouts = new Map()
    ;(superCouts || []).forEach((row) => {
      const ticketId = Number(row?.ticketId)
      if (!ticketId) return
      const cout = parseFloatOrZero(row?.cout)
      const currentTotal = ticketTotalSuperCouts.get(ticketId) || 0
      ticketTotalSuperCouts.set(ticketId, currentTotal + cout)
    })

    const ticketTotalCoutOuvertures = new Map()
    ;(coutOuvertures || []).forEach((row) => {
      const ticketId = Number(row?.ticketId)
      if (!ticketId) return
      const cout = parseFloatOrZero(row?.coutOuverture)
      const currentTotal = ticketTotalCoutOuvertures.get(ticketId) || 0
      ticketTotalCoutOuvertures.set(ticketId, currentTotal + cout)
    })

    // Aggregate costs by item_type
    const itemTypeCosts = {}

    ticketItemsMap.forEach((items, ticketId) => {
      const totalTicketCost = ticketTotalCosts.get(ticketId) || 0
      const totalTicketSuperCout = ticketTotalSuperCouts.get(ticketId) || 0
      const totalTicketCoutOuverture = ticketTotalCoutOuvertures.get(ticketId) || 0

      if (items.length === 0) return

      const costPerItem = items.length > 0 ? totalTicketCost / items.length : 0
      const superCoutPerItem = items.length > 0 ? totalTicketSuperCout / items.length : 0
      const coutOuverturePerItem = items.length > 0 ? totalTicketCoutOuverture / items.length : 0

      items.forEach((item) => {
        const itemType = item?.itemType || 'Unknown'

        if (!itemTypeCosts[itemType]) {
          itemTypeCosts[itemType] = {
            itemType,
            sumCout: 0,
            sumSuperCout: 0,
            sumCoutOuverture: 0,
            sumTotal: 0,
          }
        }

        itemTypeCosts[itemType].sumCout += costPerItem
        itemTypeCosts[itemType].sumSuperCout += superCoutPerItem
        itemTypeCosts[itemType].sumCoutOuverture += coutOuverturePerItem
        itemTypeCosts[itemType].sumTotal += costPerItem + superCoutPerItem + coutOuverturePerItem
      })
    })

    const result = Object.values(itemTypeCosts).sort((a, b) => b.sumTotal - a.sumTotal)

    return result
  } catch (err) {
    console.error('Error aggregating item type costs:', err)
    return []
  }
}

export async function recupererDetailsParItemType(itemTypeRecherche) {
  try {
    const [ticketCosts, itemTickets, superCouts, coutOuvertures, actifs] = await Promise.all([
      fetchAllTicketCosts(),
      fetchAllItemTickets(),
      superCoutService.getAll().catch(() => []),
      coutOuvertureService.getAll().catch(() => []),
      recupererTousLesActifs()
    ])

    console.log('Recherche détails pour:', itemTypeRecherche)
    console.log('Actifs trouvés:', actifs.length)
    console.log('itemTickets:', itemTickets.slice(0, 5))

    // EXACTEMENT LA MEME LOGIQUE QUE aggregateItemTypeCosts, MAIS EN GARDANT TOUS LES ITEMS
    const ticketItemsMap = new Map()
    itemTickets.forEach((link) => {
      const ticketId = Number(link?.tickets_id)
      if (!ticketId) return

      if (!ticketItemsMap.has(ticketId)) {
        ticketItemsMap.set(ticketId, [])
      }

      ticketItemsMap.get(ticketId).push({
        itemId: Number(link?.items_id),
        itemType: link?.itemtype
      })
    })

    const ticketTotalCosts = new Map()
    ticketCosts.forEach((cost) => {
      const ticketId = Number(cost?.tickets_id)
      if (!ticketId) return
      const currentTotal = ticketTotalCosts.get(ticketId) || 0
      ticketTotalCosts.set(ticketId, currentTotal + computeTicketCostTotal(cost))
    })

    const ticketTotalSuperCouts = new Map()
    ;(superCouts || []).forEach((row) => {
      const ticketId = Number(row?.ticketId)
      if (!ticketId) return
      const cout = parseFloatOrZero(row?.cout)
      const currentTotal = ticketTotalSuperCouts.get(ticketId) || 0
      ticketTotalSuperCouts.set(ticketId, currentTotal + cout)
    })

    const ticketTotalCoutOuvertures = new Map()
    ;(coutOuvertures || []).forEach((row) => {
      const ticketId = Number(row?.ticketId)
      if (!ticketId) return
      const cout = parseFloatOrZero(row?.coutOuverture)
      const currentTotal = ticketTotalCoutOuvertures.get(ticketId) || 0
      ticketTotalCoutOuvertures.set(ticketId, currentTotal + cout)
    })

    // Maintenant, on agrège PAR PRODUIT et on filtre par itemTypeRecherche
    const produits = {}

    ticketItemsMap.forEach((items, ticketId) => {
      const totalTicketCost = ticketTotalCosts.get(ticketId) || 0
      const totalTicketSuperCout = ticketTotalSuperCouts.get(ticketId) || 0
      const totalTicketCoutOuverture = ticketTotalCoutOuvertures.get(ticketId) || 0

      if (items.length === 0) return

      const costPerItem = items.length > 0 ? totalTicketCost / items.length : 0
      const superCoutPerItem = items.length > 0 ? totalTicketSuperCout / items.length : 0
      const coutOuverturePerItem = items.length > 0 ? totalTicketCoutOuverture / items.length : 0

      items.forEach((item) => {
        const itemType = item?.itemType || 'Unknown'

        // Si ce n'est pas le type qu'on cherche, on skip
        if (itemType.toLowerCase() !== itemTypeRecherche.toLowerCase()) return

        const cleProduit = `${itemType}-${item.itemId}`
        if (!produits[cleProduit]) {
          const actif = actifs.find(a => 
            a.itemtype.toLowerCase() === itemType.toLowerCase() && 
            Number(a.id) === item.itemId
          )
          produits[cleProduit] = {
            itemId: item.itemId,
            itemType: itemType,
            nom: actif?.name || `Produit #${item.itemId}`,
            sumCout: 0,
            sumSuperCout: 0,
            sumCoutOuverture: 0,
            sumTotal: 0,
          }
        }

        produits[cleProduit].sumCout += costPerItem
        produits[cleProduit].sumSuperCout += superCoutPerItem
        produits[cleProduit].sumCoutOuverture += coutOuverturePerItem
        produits[cleProduit].sumTotal += costPerItem + superCoutPerItem + coutOuverturePerItem
      })
    })

    console.log('Produits trouvés:', Object.values(produits).length)
    return Object.values(produits).sort((a, b) => b.sumTotal - a.sumTotal)
  } catch (err) {
    console.error('Erreur détails par item:', err)
    return []
  }
}

export async function recupererHistoriqueProduit(itemType, itemId) {
  try {
    // Trouver tous les tickets liés à ce produit
    const itemTickets = await fetchAllItemTickets()
    const ticketIds = itemTickets
      .filter(link => 
        link?.itemtype?.toLowerCase() === itemType.toLowerCase() &&
        Number(link?.items_id) === itemId
      )
      .map(link => Number(link?.tickets_id))
      .filter(id => id)

    // Récupérer toutes les données en parallèle
    const [superCouts, coutOuvertures] = await Promise.all([
      superCoutService.getAll().catch(() => []),
      coutOuvertureService.getAll().catch(() => []),
    ])

    // Récupérer l'historique de chaque ticket
    const historiquePromises = ticketIds.map(async ticketId => {
      const history = await getTicketHistory(ticketId)
      return history.map(h => ({ ...h, ticketId }))
    })
    
    const allHistorique = (await Promise.all(historiquePromises)).flat()

    // Construire la liste des événements
    const evenements = []

    // Ajouter les fermetures avec super cout
    allHistorique.forEach(entry => {
      if (entry.newStatus === KANBAN_TICKET_STATUSES.CLOSED && entry.superCout != null) {
        evenements.push({
          id: `close-${entry.id}`,
          date: entry.changedAt,
          type: 'Terminer',
          valeur: null,
          montant: entry.superCout,
          ticketId: entry.ticketId
        })
      }
      
      // Ajouter les annulations
      if (entry.comment?.includes('Annulation')) {
        evenements.push({
          id: `cancel-${entry.id}`,
          date: entry.changedAt,
          type: 'Annulation',
          valeur: null,
          montant: null, // Pour l'annulation, on peut afficher le montant annulé plus tard si nécessaire
          ticketId: entry.ticketId
        })
      }
      
      // Ajouter les réouvertures
      if (entry.comment?.includes('Réouverture')) {
        const match = entry.comment.match(/Réouverture \((\d+(?:[.,]\d+)?)%\)/)
        const pourcentage = match ? match[1] : null
        evenements.push({
          id: `reopen-${entry.id}`,
          date: entry.changedAt,
          type: 'Réouverture',
          valeur: pourcentage,
          montant: null, // On ajoutera le montant depuis coutOuverture
          ticketId: entry.ticketId
        })
      }
    })

    // Ajouter les cout ouverture
    coutOuvertures.forEach(co => {
      if (ticketIds.includes(co.ticketId)) {
        evenements.push({
          id: `ouverture-${co.id}`,
          date: co.createdAt,
          type: 'Réouverture',
          valeur: `${co.pourcentage}%`,
          montant: co.coutOuverture,
          ticketId: co.ticketId
        })
      }
    })

    // Trier par date décroissante
    evenements.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    return evenements
  } catch (err) {
    console.error('Erreur historique produit:', err)
    return []
  }
}

function getStatusLabel(status) {
  switch (status) {
    case KANBAN_TICKET_STATUSES.NEW: return 'Nouveau'
    case KANBAN_TICKET_STATUSES.IN_PROGRESS: return 'En cours'
    case KANBAN_TICKET_STATUSES.CLOSED: return 'Terminé'
    default: return `Statut ${status}`
  }
}

export default {
  aggregateItemTypeCosts,
  recupererDetailsParItemType,
  recupererHistoriqueProduit,
  fetchAllTicketCosts,
  fetchAllItemTickets,
  fetchAllTickets
}
