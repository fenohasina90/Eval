import { Legacy } from './api';

/**
 * Crée un ticket et l'associe à plusieurs actifs
 * @param {Object} ticketData - Titre et description du ticket
 * @param {string} ticketData.name - Le titre du ticket
 * @param {string} ticketData.content - La description du problème
 * @param {Array} selectedItems - Liste des actifs sélectionnés (doivent contenir {itemtype, id})
 * @returns {Promise<Object>} Le ticket créé
 */
export async function createTicketWithItems(ticketData, selectedItems = []) {
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

        return { success: true, ticketId };
    } catch (error) {
        console.error("Erreur lors de la création du ticket avec ses actifs", error);
        throw error;
    }
}
