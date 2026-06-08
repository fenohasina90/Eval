import JSZip from 'jszip';
import { Legacy, LEGACY_BASE_URL, LEGACY_APP_TOKEN, getSessionToken } from './api';

const PREFIX_MAP = {
    // Préfixes de base demandés
    'PC': 'Computer',
    'MN': 'Monitor',
    'PR': 'Printer',
    'PH': 'Phone',
    'NE': 'NetworkEquipment',
    'PER': 'Peripheral',
    
    // Préfixes issus du fichier asset.csv
    'COM': 'Computer',
    'MON': 'Monitor',
    'PRI': 'Printer',
    'PHO': 'Phone',
    'NET': 'NetworkEquipment',
    'RAC': 'Rack',
    'ENC': 'Enclosure',
    'PDU': 'PDU',
    'PAS': 'PassiveDCEquipment',
    'CAB': 'Cable',
    'SOF': 'Software'
};

const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

export async function importZipImages(zipFile, { onProgress = () => {}, onResults = () => {} } = {}) {
    const results = [];
    
    // 1. Charger le ZIP
    const zip = new JSZip();
    let loadedZip;
    try {
        loadedZip = await zip.loadAsync(zipFile);
    } catch (e) {
        throw new Error("Impossible de lire le fichier ZIP: " + e.message);
    }

    // 2. Extraire et filtrer les images (ignorer les fichiers cachés Mac)
    const imageFiles = [];
    loadedZip.forEach((relativePath, file) => {
        if (file.dir) return;
        
        const filename = relativePath.split('/').pop();
        if (filename.startsWith('._') || relativePath.includes('__MACOSX')) return;

        const lowerName = relativePath.toLowerCase();
        if (VALID_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
            imageFiles.push({ relativePath, file });
        }
    });

    const total = imageFiles.length;
    let done = 0;

    for (const { relativePath, file } of imageFiles) {
        const filename = relativePath.split('/').pop();
        const baseNameMatch = filename.match(/^(.+)\.[^.]+$/);
        
        if (!baseNameMatch) {
            results.push({ filename, status: 'skipped', message: "Impossible d'extraire le nom de l'actif depuis le fichier" });
            done++;
            onProgress({ done, total });
            continue;
        }

        const baseName = baseNameMatch[1];
        const prefix = baseName.split('-')[0];
        const itemtype = PREFIX_MAP[prefix];

        if (!itemtype) {
            results.push({ filename, status: 'skipped', message: `Préfixe inconnu (${prefix})` });
            done++;
            onProgress({ done, total });
            continue;
        }

        try {
            // ÉTAPE 2 — Recherche de l'actif dans GLPI
            const searchResponse = await Legacy.get(`/search/${itemtype}`, {
                'criteria[0][field]': 1,
                'criteria[0][searchtype]': 'contains',
                'criteria[0][value]': baseName.trim(),
                'forcedisplay[0]': 2,
                range: '0-50'
            });

            const body = searchResponse?.data;
            const foundItems = Array.isArray(body) ? body : (body?.data || []);

            // Match case-insensitively and ignore trailing spaces
            const matchedItem = foundItems.find(item => {
                const itemName = String(item['1'] || '').trim().toLowerCase();
                return itemName === baseName.trim().toLowerCase();
            });

            if (!matchedItem || !matchedItem['2']) {
                results.push({ filename, status: 'error', message: `Actif introuvable dans GLPI (${baseName})` });
                done++;
                onProgress({ done, total });
                continue;
            }

            const items_id = matchedItem['2'];

            // ÉTAPE 3 — Upload de l'image comme Document GLPI
            const blob = await file.async("blob");
            
            // On s'assure d'avoir un token de session valide
            const sessionToken = await getSessionToken();
            
            const formData = new FormData();
            formData.append('uploadManifest', JSON.stringify({ input: { name: baseName, entities_id: 0 } }));
            // On utilise File plutôt que Blob si possible, sinon le blob avec le filename
            formData.append('file', blob, filename);

            const uploadResponse = await fetch(`${LEGACY_BASE_URL}/Document`, {
                method: 'POST',
                headers: {
                    'Session-Token': sessionToken,
                    'App-Token': LEGACY_APP_TOKEN
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errText = await uploadResponse.text();
                throw new Error(`Erreur lors de l'upload: ${uploadResponse.status} ${errText}`);
            }

            const uploadData = await uploadResponse.json();
            const documents_id = uploadData.id;
            
            if (!documents_id) {
                throw new Error("L'API GLPI n'a pas retourné d'ID pour le document");
            }

            // ÉTAPE 4 — Liaison Document → Actif
            await Legacy.post('/Document_Item', {
                documents_id: documents_id,
                itemtype: itemtype,
                items_id: items_id,
                entities_id: 0
            });

            results.push({ filename, status: 'created', message: "Image uploadée et liée avec succès" });

        } catch (e) {
            results.push({ filename, status: 'error', message: e.message });
        }

        done++;
        onProgress({ done, total });
        onResults([...results]);
    }

    return results;
}
