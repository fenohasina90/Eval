import api, { get } from "./api";

const allAPI = [
    { url: 'Computer', path: '/Assets/Computer', ids: null },
    { url: 'Monitor', path: '/Assets/Monitor', ids: null },
    { url: 'Peripheral', path: '/Assets/Peripheral', ids: null },
    { url: 'Printer', path: '/Assets/Printer', ids: null },
    { url: 'Phone', path: '/Assets/Phone', ids: null },
    { url: 'NetworkEquipment', path: '/Assets/NetworkEquipment', ids: null },

    // Consommables & Accessoires
    { url: 'ConsumableItem', path: null, ids: null },
    { url: 'CartridgeItem', path: null, ids: null },

    // Organisation & Logistique
    { url: 'Location', path: '/Dropdowns/Location', ids: null },
    { url: 'Manufacturer', path: '/Dropdowns/Manufacturer', ids: null },
    { url: 'Supplier', path: null, ids: null },

    // SAV & Assistance
    { url: 'Ticket', path: '/Assistance/Ticket', ids: null },
    { url: 'Software', path: null, ids: null },
    { url: 'SoftwareLicense', path: null, ids: null },

    { url: 'State', path: '/Dropdowns/State', ids: null },
    { url: 'ComputerModel', path: '/Dropdowns/ComputerModel', ids: null },
    { url: 'MonitorModel', path: '/Dropdowns/MonitorModel', ids: null },
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

async function fetchAllItems(path, params = {}) {
    const response = await get(path, { range: '0-999999', ...params });
    return extractItems(response?.data);
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

    try {
        await api.delete(url, { params: { force: true } });
        return;
    } catch (error) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
            throw error;
        }
    }

    await api.delete(url);
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
    // 1. On cherche la bonne ligne dans ton tableau
    const targetEntity = allAPI.find(api => api.url === entityName);

    // Sécurité : si l'entité n'est pas dans le tableau
    if (!targetEntity) {
        console.error("Entité non reconnue");
        return [];
    }

    try {
        if (!targetEntity.path) {
            targetEntity.ids = null;
            return [];
        }

        const activeItems = await fetchAllItems(targetEntity.path);
        const ids = activeItems
            .filter((item) => !shouldSkipDefault(targetEntity.url, item))
            .map((item) => item?.id)
            .filter(Boolean);

        const merged = new Set(ids);

        if (targetEntity.url === 'Computer' || targetEntity.url === 'Monitor') {
            try {
                const deletedItems = await fetchAllItems(targetEntity.path, { filter: 'is_deleted==true' });
                deletedItems
                    .filter((item) => !shouldSkipDefault(targetEntity.url, item))
                    .filter((item) => isDeleted(item))
                    .map((item) => item?.id)
                    .filter(Boolean)
                    .forEach((id) => merged.add(id));
            } catch (error) {
                void error;
            }
        }

        targetEntity.ids = Array.from(merged);
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
