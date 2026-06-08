import api, { Legacy } from "./api";

/**
 * Normalise un texte pour la recherche (minuscules, sans accents)
 */
function normalizeText(text) {
    if (!text) return '';
    return String(text).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Récupère et filtre la liste des actifs (Computers, Monitors, Printers) pour le Front Office.
 * @param {Object} criteria - Les critères de recherche
 * @param {string} criteria.text - Texte de recherche (nom ou série)
 * @param {string} criteria.itemtype - Type d'actif (Computer, Monitor, Printer)
 * @param {string} criteria.status - Statut de l'actif
 * @param {Object} dropdownsMap - Dictionnaire des listes déroulantes pour résoudre les noms
 * @returns {Promise<Array>} Liste des actifs filtrés
 */
export async function searchElements(criteria = {}, dropdownsMap = null) {
    try {
        const endpoints = [
            '/Computer', '/Monitor', '/Printer', 
            '/NetworkEquipment', '/Peripheral', '/Phone',
            '/Rack', '/Enclosure', '/Software', 
            '/PassiveDCEquipment', '/PDU', '/Cable',
            '/Unmanaged', '/Appliance', '/SoftwareLicense', '/Certificate'
        ];
        // expand_dropdowns: true permet d'obtenir les noms (lieux, modèles, fabricants) au lieu des IDs
        const requests = endpoints.map(endpoint => 
            Legacy.get(endpoint, { params: { expand_dropdowns: true } })
                  .catch(() => ({ data: [] }))
        );
        
        const responses = await Promise.all(requests);
        
        let elements = [];
        responses.forEach((res, index) => {
            const type = endpoints[index].substring(1); // "Computer", "Monitor", "Printer"
            const items = res.data || [];
            items.forEach(item => {
                elements.push({ ...item, itemtype: type });
            });
        });

        // Filtrage multi-critères
        if (criteria.itemtype) {
            elements = elements.filter(el => el.itemtype === criteria.itemtype);
        }
        if (criteria.text) {
            const lowerText = normalizeText(criteria.text);
            elements = elements.filter(el => {
                const loc = dropdownsMap ? dropdownsMap.locations[el.locations_id] : el.locations_id;
                const man = dropdownsMap ? dropdownsMap.manufacturers[el.manufacturers_id] : el.manufacturers_id;
                const modId = el.computermodels_id || el.monitormodels_id || el.printermodels_id ||
                              el.networkequipmentmodels_id || el.peripheralmodels_id || el.phonemodels_id ||
                              el.rackmodels_id || el.enclosuremodels_id || el.passivedcequipmentmodels_id ||
                              el.pdumodels_id || el.cablemodels_id || el.unmanagedmodels_id || el.appliancemodels_id;
                const mod = dropdownsMap ? dropdownsMap.models[modId] : modId;

                const searchFields = [
                    el.name,
                    el.serial,
                    el.otherserial,
                    loc,
                    man,
                    mod
                ];
                return searchFields.some(field => 
                    field && normalizeText(field).includes(lowerText)
                );
            });
        }

        if (criteria.status) {
            const statusLabel = dropdownsMap && dropdownsMap.states ? dropdownsMap.states[criteria.status] : null;
            elements = elements.filter(el => {
                const elStateIdStr = el.states_id ? String(el.states_id) : '';
                const criteriaStatusStr = String(criteria.status);
                return (elStateIdStr === criteriaStatusStr) || 
                       (statusLabel && elStateIdStr === String(statusLabel)) ||
                       String(el.status) === criteriaStatusStr;
            });
        }

        return elements;
    } catch (error) {
        console.error("Erreur lors de la récupération des éléments Front Office", error);
        throw error;
    }
}

/**
 * Récupère la liste des statuts (states) depuis GLPI
 * @returns {Promise<Array>} Liste des statuts {id, name}
 */
export async function getStates() {
    try {
        const response = await Legacy.get('/State');
        return response.data || [];
    } catch (error) {
        console.error("Erreur lors de la récupération des statuts", error);
        return [];
    }
}

/**
 * Récupère les listes déroulantes (Lieux, Fabricants, Modèles) depuis GLPI
 * @returns {Promise<Object>} Dictionnaire contenant locations, manufacturers, models
 */
export async function getDropdowns() {
    try {
        const [
            locationsRes, manufacturersRes, 
            compModelsRes, monModelsRes, printModelsRes,
            netModelsRes, periphModelsRes, phoneModelsRes, 
            rackModelsRes, encModelsRes,
            passiveModelsRes, pduModelsRes, cableModelsRes, 
            unmanagedModelsRes, applianceModelsRes
        ] = await Promise.all([
            Legacy.get('/Location').catch(() => ({ data: [] })),
            Legacy.get('/Manufacturer').catch(() => ({ data: [] })),
            Legacy.get('/ComputerModel').catch(() => ({ data: [] })),
            Legacy.get('/MonitorModel').catch(() => ({ data: [] })),
            Legacy.get('/PrinterModel').catch(() => ({ data: [] })),
            Legacy.get('/NetworkEquipmentModel').catch(() => ({ data: [] })),
            Legacy.get('/PeripheralModel').catch(() => ({ data: [] })),
            Legacy.get('/PhoneModel').catch(() => ({ data: [] })),
            Legacy.get('/RackModel').catch(() => ({ data: [] })),
            Legacy.get('/EnclosureModel').catch(() => ({ data: [] })),
            Legacy.get('/PassiveDCEquipmentModel').catch(() => ({ data: [] })),
            Legacy.get('/PDUModel').catch(() => ({ data: [] })),
            Legacy.get('/CableModel').catch(() => ({ data: [] })),
            Legacy.get('/UnmanagedModel').catch(() => ({ data: [] })),
            Legacy.get('/ApplianceModel').catch(() => ({ data: [] }))
        ]);

        return {
            locations: locationsRes.data || [],
            manufacturers: manufacturersRes.data || [],
            models: [
                ...(compModelsRes.data || []),
                ...(monModelsRes.data || []),
                ...(printModelsRes.data || []),
                ...(netModelsRes.data || []),
                ...(periphModelsRes.data || []),
                ...(phoneModelsRes.data || []),
                ...(rackModelsRes.data || []),
                ...(encModelsRes.data || []),
                ...(passiveModelsRes.data || []),
                ...(pduModelsRes.data || []),
                ...(cableModelsRes.data || []),
                ...(unmanagedModelsRes.data || []),
                ...(applianceModelsRes.data || [])
            ]
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des dropdowns", error);
        return { locations: [], manufacturers: [], models: [] };
    }
}
