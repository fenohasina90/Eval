import api, { get, Legacy } from "./api";

const allAPI = [
    { url: 'Computer', path: '/Assets/Computer', ids: null },
    { url: 'Monitor', path: '/Assets/Monitor', ids: null },
    // { url: 'Peripheral', path: '/Assets/Peripheral', ids: null },
    { url: 'Printer', path: '/Assets/Printer', ids: null },
    { url: 'Phone', path: '/Assets/Phone', ids: null },
    // { url: 'NetworkEquipment', path: '/Assets/NetworkEquipment', ids: null },

    // { url: 'Rack', path: '/Assets/Rack', ids: null },
    // { url: 'PDU', path: '/Assets/PDU', ids: null },
    // { url: 'Enclosure', path: '/Assets/Enclosure', ids: null },
    // { url: 'PassiveDCEquipment', path: '/Assets/PassiveDCEquipment', ids: null },
    // { url: 'Cable', path: '/Assets/Cable', ids: null },
    // { url: 'Unmanaged', path: '/Assets/Unmanaged', ids: null },
    // { url: 'Appliance', path: '/Assets/Appliance', ids: null },

    // Consommables & Accessoires
    // { url: 'ConsumableItem', path: '/Assets/ConsumableItem', ids: null },
    // { url: 'CartridgeItem', path: '/Assets/CartridgeItem', ids: null },

    // Organisation & Logistique
    { url: 'Location', path: '/Dropdowns/Location', ids: null },
    { url: 'Manufacturer', path: '/Dropdowns/Manufacturer', ids: null },
    { url: 'Supplier', path: '/Dropdowns/Supplier', ids: null },

    // SAV & Assistance
    { url: 'Ticket', path: '/Assistance/Ticket', ids: null },
    { url: 'Item_Ticket', path: '/Assistance/Item_Ticket', ids: null },
    { url: 'Ticket_User', path: '/Ticket_User', ids: null },

    // Documents & Fichiers
    { url: 'Document', path: '/Document', ids: null },
    { url: 'Document_Item', path: '/Document_Item', ids: null },

    // { url: 'Software', path: '/Assets/Software', ids: null },
    // { url: 'SoftwareLicense', path: '/Assets/SoftwareLicense', ids: null },
    // { url: 'Certificate', path: '/Assets/Certificate', ids: null },

    { url: 'State', path: '/Dropdowns/State', ids: null },
    { url: 'ComputerModel', path: '/Dropdowns/ComputerModel', ids: null },
    { url: 'MonitorModel', path: '/Dropdowns/MonitorModel', ids: null },
    { url: 'PrinterModel', path: '/Dropdowns/PrinterModel', ids: null },
    // { url: 'PeripheralModel', path: '/Dropdowns/PeripheralModel', ids: null },
    { url: 'PhoneModel', path: '/Dropdowns/PhoneModel', ids: null },
    // { url: 'NetworkEquipmentModel', path: '/Dropdowns/NetworkEquipmentModel', ids: null },
    // { url: 'RackModel', path: '/Dropdowns/RackModel', ids: null },
    // { url: 'PDUModel', path: '/Dropdowns/PDUModel', ids: null },
    // { url: 'EnclosureModel', path: '/Dropdowns/EnclosureModel', ids: null },
    // { url: 'PassiveDCEquipmentModel', path: '/Dropdowns/PassiveDCEquipmentModel', ids: null },

    { url: 'User', path: '/Administration/User', ids: null },
];

function extractItems(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function isDeleted(item) {
    return item?.is_deleted === true || item?.is_deleted === 1 || item?.is_deleted === '1';
}

function normalizeName(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getLegacyPath(path) {
    if (!path) return '';
    return path.replace(/^\/Assets/, '').replace(/^\/Dropdowns/, '').replace(/^\/Administration/, '').replace(/^\/Assistance/, '');
}

function shouldUseLegacyDirectly(path) {
    // Liste très stricte des endpoints supportés par l'API custom
    // Si ce n'est pas dedans, on tape directement l'API GLPI native pour éviter les 404 en console
    const knownCustomPaths = ['/Assets/Computer', '/Assets/Monitor'];
    return !knownCustomPaths.includes(path);
}

async function fetchAllItems(path, params = {}) {
    if (shouldUseLegacyDirectly(path)) {
        try {
            const legacyPath = getLegacyPath(path);
            const response = await Legacy.get(legacyPath, { range: '0-999999', ...params });
            return extractItems(response?.data);
        } catch (e) {
            return [];
        }
    }

    try {
        const response = await get(path, { range: '0-999999', ...params });
        return extractItems(response?.data);
    } catch (err) {
        if (err.response && err.response.status === 404) {
            const legacyPath = getLegacyPath(path);
            const response = await Legacy.get(legacyPath, { range: '0-999999', ...params });
            return extractItems(response?.data);
        }
        throw err;
    }
}

function shouldSkipDefault(entityUrl, item) {
    if (!item || !item.id) return false;

    const id = Number(item.id);
    const name = normalizeName(item.name);

    const hasDefaultFlag =
        item.is_default === 1 ||
        item.is_default === true ||
        item.is_default === '1' ||
        item.is_system === 1 ||
        item.is_system === true ||
        item.is_system === '1';

    const looksLikeRootName =
        name === '' ||
        name === '-' ||
        name === '--' ||
        name.includes('root') ||
        name.includes('racine') ||
        name.includes('default') ||
        name.includes('par defaut') ||
        name.includes('unknown') ||
        name.includes('inconnu') ||
        name === 'n/a' ||
        name === 'na' ||
        name === 'none' ||
        name.includes('aucun') ||
        name.includes('sans');

    if (entityUrl === 'User') {
        const username = String(item.username ?? '').toLowerCase();
        if (id <= 6) return true;
        if (username === 'glpi') return true;
        return false;
    }

    // if (
    //     entityUrl === 'Location' ||
    //     entityUrl === 'Manufacturer' ||
    //     entityUrl === 'State' ||
    //     entityUrl === 'ComputerModel' ||
    //     entityUrl === 'MonitorModel'
    // ) {
    //     if (id <= 1) return true;
    //     if (hasDefaultFlag) return true;
    //     if (looksLikeRootName) return true;
    //     return false;
    // }

    return false;
}

async function deleteOne(entityUrl, path, id) {
    const url = `${path}/${id}`;
    const legacyPath = getLegacyPath(path);
    const legacyUrl = `${legacyPath}/${id}`;

    if (shouldUseLegacyDirectly(path)) {
        try {
            await Legacy.delPurge(legacyUrl);
            return;
        } catch (legacyError) {
            if (legacyError?.response?.status !== 401 && legacyError?.response?.status !== 403) {
                throw legacyError;
            }
            await Legacy.del(legacyUrl);
            return;
        }
    }

    // Tentative de suppression avec l'API custom
    try {
        await api.delete(url, { params: { force: true } });
        return;
    } catch (error) {
        if (error?.response?.status === 404) {
            // Fallback vers l'API Legacy si l'endpoint n'existe pas
            try {
                await Legacy.delPurge(legacyUrl);
                return;
            } catch (legacyError) {
                if (legacyError?.response?.status !== 401 && legacyError?.response?.status !== 403) {
                    throw legacyError;
                }
                // Si force_purge échoue (permissions), on tente un simple delete
                await Legacy.del(legacyUrl);
                return;
            }
        }
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
            throw error;
        }
    }

    // Fallback normal delete (si API custom a refusé force delete)
    try {
        await api.delete(url);
    } catch (error) {
        if (error?.response?.status === 404) {
            await Legacy.del(legacyUrl);
        } else {
            throw error;
        }
    }
}

async function deleteUserFallback(id) {
    const url = `/Administration/User/${id}`;
    try {
        await api.patch(url, { is_active: 0 });
    } catch (error) {
        void error;
    }
}

async function getIdsPour(entityName) {
    const targetEntity = allAPI.find(api => api.url === entityName);

    if (!targetEntity) {
        console.error("Entité non reconnue");
        return [];
    }

    try {
        if (!targetEntity.path) {
            targetEntity.ids = null;
            return [];
        }

        // Paramètres de base
        const paramsList = [{}];
        
        // Pour les tickets, on veut aussi ceux qui sont clos ou résolus
        if (entityName === 'Ticket') {
            paramsList[0] = { status: 'all' };
        }

        // On fait une 2ème passe pour la corbeille
        paramsList.push({ ...paramsList[0], is_deleted: 1 });

        const allIds = new Set();

        for (const params of paramsList) {
            try {
                const items = await fetchAllItems(targetEntity.path, params);
                items.forEach(item => {
                    if (!shouldSkipDefault(targetEntity.url, item)) {
                        allIds.add(item.id);
                    }
                });
            } catch (e) {
                // Ignore silencieusement si le backend refuse is_deleted=1 (ex: pour les dropdowns)
            }
        }

        targetEntity.ids = Array.from(allIds);
        return targetEntity.ids;
    } catch (error) {
        console.error("Erreur de fetch", error);
        targetEntity.ids = null;
        return [];
    }
}

async function purgeAll(selectedEntities = allAPI.map((entity) => entity.url), onProgress = () => {}) {
    const purgeResults = [];
    const entitiesToPurge = allAPI.filter((entity) => selectedEntities.includes(entity.url));

    for (const entity of entitiesToPurge) {
        onProgress({ entity: entity.url, status: 'running' });

        try {
            if (!entity.path) {
                onProgress({
                    entity: entity.url,
                    status: 'error',
                    total: 0,
                    successCount: 0,
                    failureCount: 0,
                });
                continue;
            }

            const ids = await getIdsPour(entity.url);
            let successCount = 0;
            let failureCount = 0;

            for (const id of ids) {
                try {
                    try {
                        await deleteOne(entity.url, entity.path, id);
                    } catch (error) {
                        if (entity.url === 'User' && (error?.response?.status === 401 || error?.response?.status === 403)) {
                            await deleteUserFallback(id);
                        } else {
                            throw error;
                        }
                    }
                    purgeResults.push({ entity: entity.url, id, success: true });
                    successCount += 1;
                } catch (error) {
                    console.error(`Erreur de purge pour ${entity.url} #${id}`, error);
                    purgeResults.push({ entity: entity.url, id, success: false, error });
                    failureCount += 1;
                }
            }

            onProgress({
                entity: entity.url,
                status: failureCount > 0 ? 'warning' : 'success',
                total: ids.length,
                successCount,
                failureCount,
            });

        } catch (error) {
            console.error(`Erreur inattendue pendant la purge de ${entity.url}`, error);
            onProgress({
                entity: entity.url,
                status: 'error',
                total: 0,
                successCount: 0,
                failureCount: 0,
                error,
            });
        } finally {
            entity.ids = null;
        }
    }

    return purgeResults;
}

export { allAPI, getIdsPour, purgeAll };
