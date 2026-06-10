import { Legacy } from './api';

function extractItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function normalizeUserId(value) {
    const n = Number(value);
    if (!n || Number.isNaN(n)) return null;
    return n;
}

async function createTicketUserActor({ tickets_id, users_id, type }) {
    return Legacy.post('/Ticket_User', { tickets_id, users_id, type });
}

export async function fetchUsersForActors({ range = '0-200' } = {}) {
    const response = await Legacy.get('/User', { range });
    const items = extractItems(response?.data);
    return (items || []).filter((u) => u && u.id != null);
}

/**
 * Crée un ticket et l'associe à plusieurs actifs
 * @param {Object} ticketData - Titre et description du ticket
 * @param {string} ticketData.name - Le titre du ticket
 * @param {string} ticketData.content - La description du problème
 * @param {Array} selectedItems - Liste des actifs sélectionnés (doivent contenir {itemtype, id})
 * @param {Object} actors - Acteurs (optionnel)
 * @param {string|number} actors.requesterId - Demandeur (User.id)
 * @param {string|number} actors.assigneeId - Assigné à (User.id)
 * @param {Array<string|number>} actors.observerIds - Observateurs (User.id[])
 * @returns {Promise<Object>} Le ticket créé
 */
export async function createTicketWithItems(ticketData, selectedItems = [], actors = null) {
    try {
        // 1. Création de l'entête du ticket
        const inputData = {
            name: ticketData.name,
            content: ticketData.content,
            type: parseInt(ticketData.type) || 1,
            status: parseInt(ticketData.status) || 1,
            urgency: parseInt(ticketData.urgency) || 3,
            impact: parseInt(ticketData.impact) || 3,
            priority: parseInt(ticketData.priority) || 3,
            locations_id: parseInt(ticketData.locations_id) || 0,
            actiontime: parseInt(ticketData.actiontime) || 0
        };

        if (ticketData.date) {
            // Remplacer le 'T' de datetime-local par un espace pour GLPI (YYYY-MM-DD HH:mm:ss)
            inputData.date = ticketData.date.replace('T', ' ');
            if (inputData.date.length === 16) {
                inputData.date += ':00'; // Ajouter les secondes si manquantes
            }
        }

        const ticketResponse = await Legacy.post('/Ticket', inputData);
        const ticketId = ticketResponse?.data?.id;

        if (!ticketId) {
            throw new Error("La création du ticket a échoué (pas d'ID retourné).");
        }

        // 2. Association des éléments (Item_Ticket)
        if (selectedItems && selectedItems.length > 0) {
            const associationPromises = selectedItems.map(item => {
                const itemTicketPayload = {
                    tickets_id: ticketId,
                    itemtype: item.itemtype,
                    items_id: item.id
                };
                return Legacy.post('/Item_Ticket', itemTicketPayload)
                    .catch(e => {
                        console.error(`Échec de l'association de l'actif ${item.itemtype} ID ${item.id}`, e);
                        // On ne bloque pas si une association échoue, on continue
                        return null;
                    });
            });

            await Promise.all(associationPromises);
        }

        const warnings = [];

        // 3. Association des acteurs (Ticket_User)
        if (actors) {
            const requesterId = normalizeUserId(actors.requesterId);
            const assigneeId = normalizeUserId(actors.assigneeId);
            const observerIdsRaw = Array.isArray(actors.observerIds) ? actors.observerIds : [];

            const observerIds = Array.from(new Set(observerIdsRaw.map(normalizeUserId).filter(Boolean)));

            const actorPromises = [];

            if (requesterId) {
                actorPromises.push(
                    createTicketUserActor({ tickets_id: ticketId, users_id: requesterId, type: 1 }).catch(() => {
                        warnings.push(`Impossible d'ajouter le demandeur (user_id=${requesterId}).`);
                        return null;
                    })
                );
            }

            observerIds.forEach((userId) => {
                actorPromises.push(
                    createTicketUserActor({ tickets_id: ticketId, users_id: userId, type: 3 }).catch(() => {
                        warnings.push(`Impossible d'ajouter l'observateur (user_id=${userId}).`);
                        return null;
                    })
                );
            });

            if (assigneeId) {
                actorPromises.push(
                    createTicketUserActor({ tickets_id: ticketId, users_id: assigneeId, type: 2 }).catch(() => {
                        warnings.push(`Impossible d'ajouter l'attribution (user_id=${assigneeId}).`);
                        return null;
                    })
                );
            }

            if (actorPromises.length > 0) await Promise.all(actorPromises);
        }

        return { success: true, ticketId, warnings };
    } catch (error) {
        console.error("Erreur lors de la création du ticket avec ses actifs", error);
        throw error;
    }
}
