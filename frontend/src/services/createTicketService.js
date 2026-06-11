import { Legacy } from './api';
import backendApi from './backend-api';

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

function normalizeGroupId(value) {
    const n = Number(value);
    if (!n || Number.isNaN(n)) return null;
    return n;
}

// ── Acteurs utilisateurs → glpi_tickets_users ──────────────────────
async function createTicketUserActor({ tickets_id, users_id, type }) {
    return Legacy.post('/Ticket_User', { tickets_id, users_id, type, use_notification: 1 });
}

// ── Acteurs groupes → glpi_groups_tickets ──────────────────────────
// ✅ BUG 1 CORRIGÉ : cette fonction était absente, les groupes
// n'étaient jamais insérés dans glpi_groups_tickets
async function createTicketGroupActor({ tickets_id, groups_id, type }) {
    return Legacy.post('/Group_Ticket', { tickets_id, groups_id, type });
}

export async function fetchUsersForActors({ range = '0-200' } = {}) {
    const response = await Legacy.get('/User', { range });
    const items = extractItems(response?.data);
    return (items || []).filter((u) => u && u.id != null);
}

// ✅ AJOUT : fetch des groupes pour les sélecteurs d'acteurs
export async function fetchGroupsForActors({ range = '0-200' } = {}) {
    const response = await Legacy.get('/Group', { range });
    const items = extractItems(response?.data);
    return (items || []).filter((g) => g && g.id != null);
}

/**
 * Crée un ticket et l'associe à plusieurs actifs et acteurs.
 *
 * @param {Object} ticketData
 * @param {Array}  selectedItems      - [{itemtype, id}, ...]
 * @param {Object} actors
 *   @param {string|number}   actors.requesterId      - Demandeur user
 *   @param {string|number}   actors.assigneeId       - Attribué user
 *   @param {Array}           actors.observerIds      - Observateurs users []
 *   @param {string|number}   actors.requesterGroupId - Demandeur groupe
 *   @param {string|number}   actors.assigneeGroupId  - Attribué groupe
 *   @param {Array}           actors.observerGroupIds - Observateurs groupes []
 */
export async function createTicketWithItems(ticketData, selectedItems = [], actors = null) {
    try {
        // ── 1. Création du ticket ─────────────────────────────────────
        const inputData = {
            name:         ticketData.name,
            content:      ticketData.content,
            type:         parseInt(ticketData.type)      || 1,
            status:       parseInt(ticketData.status)    || 1,
            urgency:      parseInt(ticketData.urgency)   || 3,
            impact:       parseInt(ticketData.impact)    || 3,
            priority:     parseInt(ticketData.priority)  || 3,
            locations_id: parseInt(ticketData.locations_id) || 0,
            actiontime:   parseInt(ticketData.actiontime)   || 0,
        };

        if (ticketData.date) {
            inputData.date = ticketData.date.replace('T', ' ');
            if (inputData.date.length === 16) inputData.date += ':00';
        }

        const ticketResponse = await Legacy.post('/Ticket', inputData);
        const ticketId = ticketResponse?.data?.id;

        if (!ticketId) {
            throw new Error("La création du ticket a échoué (pas d'ID retourné).");
        }

        // Save initial status to history
        try {
            await backendApi.post('/api/ticket-history', {
                ticketId: ticketId,
                oldStatus: null,
                newStatus: parseInt(ticketData.status) || 1,
                comment: "Création du ticket"
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de l'historique initial", error);
        }

        // ── 2. Liaison actifs (Item_Ticket) ───────────────────────────
        if (selectedItems?.length > 0) {
            await Promise.all(
                selectedItems.map((item) =>
                    Legacy.post('/Item_Ticket', {
                        tickets_id: ticketId,
                        itemtype:   item.itemtype,
                        items_id:   item.id,
                    }).catch((e) => {
                        console.error(`Échec association actif ${item.itemtype} #${item.id}`, e);
                        return null;
                    })
                )
            );
        }

        const warnings = [];

        // ── 3. Acteurs utilisateurs (Ticket_User → glpi_tickets_users) ─
        if (actors) {
            const requesterId     = normalizeUserId(actors.requesterId);
            const assigneeId      = normalizeUserId(actors.assigneeId);
            const observerIds     = Array.from(
                new Set(
                    (Array.isArray(actors.observerIds) ? actors.observerIds : [])
                        .map(normalizeUserId)
                        .filter(Boolean)
                )
            );

            const userActorPromises = [];

            if (requesterId) {
                userActorPromises.push(
                    createTicketUserActor({ tickets_id: ticketId, users_id: requesterId, type: 1 })
                        .catch(() => { warnings.push(`Impossible d'ajouter le demandeur user #${requesterId}.`); return null; })
                );
            }

            observerIds.forEach((userId) => {
                userActorPromises.push(
                    createTicketUserActor({ tickets_id: ticketId, users_id: userId, type: 3 })
                        .catch(() => { warnings.push(`Impossible d'ajouter l'observateur user #${userId}.`); return null; })
                );
            });

            if (assigneeId) {
                userActorPromises.push(
                    createTicketUserActor({ tickets_id: ticketId, users_id: assigneeId, type: 2 })
                        .catch(() => { warnings.push(`Impossible d'ajouter l'assigné user #${assigneeId}.`); return null; })
                );
            }

            if (userActorPromises.length > 0) await Promise.all(userActorPromises);

            // ── 4. Acteurs groupes (Group_Ticket → glpi_groups_tickets) ──
            // ✅ BUG 1 CORRIGÉ : insertion dans glpi_groups_tickets via /Group_Ticket
            const requesterGroupId  = normalizeGroupId(actors.requesterGroupId);
            const assigneeGroupId   = normalizeGroupId(actors.assigneeGroupId);
            const observerGroupIds  = Array.from(
                new Set(
                    (Array.isArray(actors.observerGroupIds) ? actors.observerGroupIds : [])
                        .map(normalizeGroupId)
                        .filter(Boolean)
                )
            );

            const groupActorPromises = [];

            if (requesterGroupId) {
                groupActorPromises.push(
                    createTicketGroupActor({ tickets_id: ticketId, groups_id: requesterGroupId, type: 1 })
                        .catch(() => { warnings.push(`Impossible d'ajouter le groupe demandeur #${requesterGroupId}.`); return null; })
                );
            }

            observerGroupIds.forEach((groupId) => {
                groupActorPromises.push(
                    createTicketGroupActor({ tickets_id: ticketId, groups_id: groupId, type: 3 })
                        .catch(() => { warnings.push(`Impossible d'ajouter le groupe observateur #${groupId}.`); return null; })
                );
            });

            if (assigneeGroupId) {
                groupActorPromises.push(
                    createTicketGroupActor({ tickets_id: ticketId, groups_id: assigneeGroupId, type: 2 })
                        .catch(() => { warnings.push(`Impossible d'ajouter le groupe assigné #${assigneeGroupId}.`); return null; })
                );
            }

            if (groupActorPromises.length > 0) await Promise.all(groupActorPromises);
        }

        return { success: true, ticketId, warnings };
    } catch (error) {
        console.error("Erreur lors de la création du ticket avec ses actifs", error);
        throw error;
    }
}