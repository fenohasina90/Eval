import { Legacy, legacy } from './api'
import { superCoutService } from './superCoutService'
import { coutOuvertureService } from './coutOuvertureService'
import { KANBAN_TICKET_STATUSES, updateTicketStatus } from './frontOfficeKanbanTicketService'




async function chargerToutLesTickets() {
  try {
    const response = await Legacy.get('/Ticket', {
      params: {range : '0-99999'}
    })

    const tickets = Array.isArray(response.data)
      ? response.data 
      : response.data?.data || []

      const cache = new Map()
      tickets.forEach(t => {
        if (t.externalid) {
          cache.set(String(t.externalid), t)
        }
      });

      return cache
  } catch (error) {
    console.error("Ty ilay erreur : " + error)
    return new Map()
  }
}

async function trouverTicketParExternalId(externalId, ticketCache) {
  return ticketCache.get(String(externalId)) || null
}

async function refreshTicketInCache(ticketId, ticketCache) {
  try {
    const response = await Legacy.get(`/Ticket/${ticketId}`);
    const updatedTicket = response.data;
    if (updatedTicket && updatedTicket.externalid) {
      ticketCache.set(String(updatedTicket.externalid), updatedTicket);
    }
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du ticket:", error);
  }
}

function parseLigneCsv(ligne) {
  const colonne = ligne.split(',').map(c => c.trim())
  if (colonne.length < 2) {
    return null
  }

  return {
    refTicket: colonne[0],
    mvt: colonne[1].toLowerCase(),
    valeur: colonne[2] && colonne[2].trim() !== '' ? colonne[2] : null,
    mode: colonne[3] && colonne[3].trim() !== '' ? colonne[3] : null
  }
}

async function annulerTicket(ticket) {
  const ticketId = Number(ticket.id)
  const ancienStatut = ticket.status

  await updateTicketStatus(ticketId, KANBAN_TICKET_STATUSES.IN_PROGRESS, {
    action: 'annulation'
  }, ancienStatut)

  return {success: true, refTicket: ticket.externalId}
}

async function reouvertureTicket(ticket, pourcentage, mode) {
  const ticketId = Number(ticket.id)
  const ancienStatut = ticket.status

  const pourcentageVal = Number(String(pourcentage).replace(',' , '.'))
  console.log("ITY ILAY POURCENTAGE : " + pourcentage);
  

  if (!Number.isFinite(pourcentageVal)) return { success: false, error: 'Pourcentage invalide' }

  await updateTicketStatus(ticketId, KANBAN_TICKET_STATUSES.IN_PROGRESS, {
    action: 'reouverture',
    pourcentage: pourcentageVal,
    mode: mode || '1'
  }, ancienStatut)

  return {success: true, refTicket: ticket.externalId}
}

async function fermerTicket(ticket, valeur) {
  const ticketId = Number(ticket.id)
  const ancienStatut = ticket.status

  let superCout = null
  if (valeur !== null && valeur !== undefined && String(valeur).trim() !== '') {
    const parsed = Number(String(valeur).replace(',', '.'));
    if (Number.isFinite(parsed)) {
      superCout = parsed;
    }
  }
  const extra = superCout !== null ? { superCout } : {}

  await updateTicketStatus(ticketId, KANBAN_TICKET_STATUSES.CLOSED, extra, ancienStatut)

  return {success: true, refTicket: ticket.externalId}
}

export async function importerMouvementsCsv(contenuCsv) {
  let lignes = contenuCsv.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  // Skip header line if present
  if (lignes.length > 0) {
    const firstLine = lignes[0].toLowerCase()
    if (firstLine.includes('refticket') || firstLine.includes('mvt')) {
      lignes = lignes.slice(1)
    }
  }
  
  const resultats = []
  const ticketCache = await chargerToutLesTickets()

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i]
    console.log(`Traitement de la ligne ${i + 1}/${lignes.length}: ${ligne}`)
    
    const data = parseLigneCsv(ligne)
    if (!data) {
      resultats.push({ ligne, success: false, error: 'Ligne invalide' })
      continue
    }

    try {
      const ticket = await trouverTicketParExternalId(data.refTicket, ticketCache)
      if (!ticket) {
        resultats.push({ ligne, success: false, error: `Ticket avec external_id "${data.refTicket}" non trouvé` })
        continue
      }

      let resultat

      if (data.mvt === 'cancel') {
        resultat = await annulerTicket(ticket)
        console.log(`✅ Ligne ${i + 1}: Annulation réussie pour ticket ${data.refTicket}`)
        
      } else if (data.mvt === 'open') {
        resultat = await reouvertureTicket(ticket, data.valeur, data.mode)
        console.log(`✅ Ligne ${i + 1}: Réouverture réussie pour ticket ${data.refTicket}`)
      } else {
        resultat = await fermerTicket(ticket, data.valeur)
        console.log(`✅ Ligne ${i + 1}: Fermeture réussie pour ticket ${data.refTicket}`)
      }

      resultats.push({ligne, ...resultat})

      // Refresh the ticket in cache for next lines
      await refreshTicketInCache(ticket.id, ticketCache)

    } catch (error) {
      console.error(`❌ Erreur ligne ${i + 1}:`, ligne, error)
      resultats.push({ ligne, success: false, error: error.message || 'Erreur inconnue' })
    }
  }

  console.log('✅ Import terminé!')
  return resultats
}

export default {importerMouvementsCsv}