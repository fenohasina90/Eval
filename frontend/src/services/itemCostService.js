import { Legacy } from './api'
import { superCoutService } from './superCoutService'
import { coutOuvertureService } from './coutOuvertureService'

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

export default {
  aggregateItemTypeCosts,
  fetchAllTicketCosts,
  fetchAllItemTickets,
  fetchAllTickets
}
