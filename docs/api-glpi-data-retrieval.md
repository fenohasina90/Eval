# Documentation : Récupération des données via l'API GLPI et Backend

Cette documentation explique comment récupérer des données depuis l'API GLPI (une seule ressource ou plusieurs), ainsi que l'interaction avec le backend Spring Boot.

---

## 1. Architecture globale

```
Frontend (React)          →          API GLPI          ↔          Backend (Spring Boot)
├── api.js (config)       →          OAuth2 / Legacy   ↔          Controllers
├── Services              →          (apirest.php)      ↔          Services
└── Components            →                             ↔          Repositories
```

---

## 2. Configuration et Authentification

### 2.1 Configuration (fichier .env)

**Fichier :** `frontend/.env`

```env
# API GLPI (OAuth2)
VITE_API_BASE_URL=/api
VITE_OAUTH_GRANT_TYPE=password
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_OAUTH_CLIENT_SECRET=your-client-secret
VITE_OAUTH_USERNAME=glpi
VITE_OAUTH_PASSWORD=glpi
VITE_OAUTH_SCOPE=

# API GLPI Legacy (apirest.php)
VITE_LEGACY_BASE_URL=/apirest
VITE_LEGACY_APP_TOKEN=your-app-token
VITE_LEGACY_USER_TOKEN=
VITE_LEGACY_LOGIN=glpi
VITE_LEGACY_PASSWORD=glpi
```

---

### 2.2 Authentification : OAuth2 vs Legacy

Le projet utilise deux modes d'authentification :

#### 2.2.1 OAuth2 (Moderne)

**Fichier :** `frontend/src/services/api.js`

```js
// ── Token storage ───────────────────────────────────────────────────
let accessToken = null;

/**
 * Demande un nouveau token OAuth2 à GLPI.
 */
async function fetchToken() {
  const params = new URLSearchParams(compactRecord(OAUTH_CREDENTIALS));

  try {
    const { data } = await axios.post(`${BASE_URL}/token`, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    // Gestion des erreurs
    throw new Error(`OAuth token request failed: ${details}`, { cause: error });
  }
}

// ── Instance Axios ──────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
});

// Intercepteur REQUEST : injecte le Bearer token automatiquement
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur RESPONSE : renouvelle le token sur 401 et re-tente la requête
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Logique de renouvellement de token
    // ...
  }
);
```

**Points clés :**
- Le token OAuth2 est stocké en mémoire
- Un intercepteur injecte automatiquement le token `Bearer` dans chaque requête
- Si une réponse renvoie un code 401 (Non autorisé), le token est automatiquement renouvelé et la requête est réessayée

---

#### 2.2.2 Legacy (apirest.php)

```js
// ── Session Legacy ─────────────────────────────────────────────────
let sessionToken = null;

/**
 * Initialise une session legacy via initSession.
 */
async function initSession() {
  try {
    // ... logique d'initialisation de session ...
    const { data } = await axios.get(`${LEGACY_BASE_URL}/initSession`, config);
    sessionToken = data.session_token;
    return sessionToken;
  } catch (error) {
    // Gestion des erreurs spécifiques à GLPI
    if (code === "ERROR_WRONG_APP_TOKEN_PARAMETER") {
      throw new Error("Legacy initSession failed: App-Token invalide");
    }
    throw error;
  }
}

// ── Instance Axios Legacy ───────────────────────────────────────────
const legacy = axios.create({
  baseURL: LEGACY_BASE_URL,
});

// Intercepteur REQUEST : injecte le Session-Token et App-Token automatiquement
legacy.interceptors.request.use(async (config) => {
  const token = await getSessionToken();
  config.headers["Session-Token"] = token;
  config.headers["App-Token"] = LEGACY_APP_TOKEN;
  return config;
});
```

---

## 3. Récupération des données

### 3.1 Récupérer une seule ressource (par ID)

**Syntaxe :**
```js
import { Legacy } from './api';

// Récupère un ticket par son ID
const response = await Legacy.get('/Ticket/123');
const ticket = response.data;
```

**Exemple complet (TicketKanban.jsx) :**
```js
export async function getTicketDetails(ticketId) {
  const response = await Legacy.get(`/Ticket/${ticketId}`);
  return response?.data;
}
```

---

### 3.2 Récupérer plusieurs ressources (collection)

#### 3.2.1 Récupérer une collection complète

**Syntaxe :**
```js
// Récupère tous les tickets
const response = await Legacy.get('/Ticket');
const tickets = response.data;
```

**Exemple (frontOfficeKanbanTicketService.js) :**
```js
export async function fetchKanbanTickets() {
  const tickets = await fetchAll('/Assistance/Ticket');
  const allowed = new Set([
    KANBAN_TICKET_STATUSES.NEW,
    KANBAN_TICKET_STATUSES.IN_PROGRESS,
    KANBAN_TICKET_STATUSES.CLOSED,
  ]);
  return (tickets || []).filter(
    (t) => !isDeletedOrTemplate(t) && allowed.has(getTicketStatusId(t))
  );
}
```

#### 3.2.2 Récupérer plusieurs collections en parallèle

Utilisez `Promise.all()` pour récupérer plusieurs ressources simultanément :

**Exemple (frontOfficeService.js) :**
```js
export async function getDropdowns() {
    try {
        const [
            locationsRes, manufacturersRes, 
            compModelsRes, monModelsRes, printModelsRes,
        ] = await Promise.all([
            Legacy.get('/Location').catch(() => ({ data: [] })),
            Legacy.get('/Manufacturer').catch(() => ({ data: [] })),
            Legacy.get('/ComputerModel').catch(() => ({ data: [] })),
            Legacy.get('/MonitorModel').catch(() => ({ data: [] })),
            Legacy.get('/PrinterModel').catch(() => ({ data: [] })),
        ]);

        return {
            locations: locationsRes.data || [],
            manufacturers: manufacturersRes.data || [],
            models: [
                ...(compModelsRes.data || []),
                ...(monModelsRes.data || []),
                ...(printModelsRes.data || []),
            ]
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des dropdowns", error);
        return { locations: [], manufacturers: [], models: [] };
    }
}
```

**Avantage de Promise.all() :**
- Toutes les requêtes sont envoyées en parallèle
- Temps de réponse = temps de la requête la plus longue
- Utilisez `.catch(() => ({ data: [] }))` pour que l'échec d'une requête ne fasse pas échouer toutes les autres

---

#### 3.2.3 Utiliser le paramètre `range` pour les grandes collections

Pour les collections importantes, utilisez le paramètre `range` pour paginer :

```js
// Récupère les 1000 premiers tickets
const response = await Legacy.get('/Ticket', {
  params: { range: '0-999' }
});
```

**Exemple (frontOfficeKanbanTicketService.js) :**
```js
async function fetchAll(path) {
  try {
    const response = await api.get(path, { params: { range: '0-999999' } });
    return extractItems(response?.data) || [];
  } catch (err) {
    if (err?.response?.status === 404) {
      const legacyPath = path.replace(/^\/Assets/, '').replace(/^\/Assistance/, '');
      const response = await legacy.get(legacyPath, { params: { range: '0-999999' } });
      return extractItems(response?.data) || [];
    }
    throw err;
  }
}
```

---

#### 3.2.4 Utiliser `expand_dropdowns` pour résoudre les IDs en noms

Par défaut, GLPI renvoie des IDs pour les relations (ex: `locations_id`, `manufacturers_id`). Utilisez `expand_dropdowns: true` pour obtenir les noms directement :

```js
const response = await Legacy.get('/Computer', {
  params: { expand_dropdowns: true }
});
```

**Exemple (frontOfficeService.js) :**
```js
const endpoints = [
    '/Computer', '/Monitor', '/Printer', 
];
const requests = endpoints.map(endpoint => 
    Legacy.get(endpoint, { params: { expand_dropdowns: true } })
          .catch(() => ({ data: [] }))
);

const responses = await Promise.all(requests);
```

**Résultat avec `expand_dropdowns: true` :**
```js
// Au lieu de :
{ "locations_id": 5 }

// Vous obtenez :
{ 
  "locations_id": 5,
  "locations": {
    "id": 5,
    "name": "Bureau A"
  }
}
```

---

## 4. Gestion des données récupérées

### 4.1 Normalisation des données

**Fonction utilitaire (frontOfficeKanbanTicketService.js) :**
```js
function extractItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeLegacyList(data) {
  // GLPI Legacy retourne parfois un objet indexé { "0": {...}, "1": {...} }
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const values = Object.values(data);
    if (values.length > 0 && typeof values[0] === 'object') return values;
  }
  return [];
}
```

---

### 4.2 Filtrage des données

**Exemple (frontOfficeService.js) :**
```js
export async function searchElements(criteria = {}, dropdownsMap = null) {
    try {
        const endpoints = ['/Computer', '/Monitor', '/Printer'];
        const requests = endpoints.map(endpoint => 
            Legacy.get(endpoint, { params: { expand_dropdowns: true } })
                  .catch(() => ({ data: [] }))
        );
        
        const responses = await Promise.all(requests);
        
        let elements = [];
        responses.forEach((res, index) => {
            const type = endpoints[index].substring(1);
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
                const searchFields = [el.name, el.serial, el.otherserial];
                return searchFields.some(field => 
                    field && normalizeText(field).includes(lowerText)
                );
            });
        }

        return elements;
    } catch (error) {
        console.error("Erreur lors de la récupération des éléments", error);
        throw error;
    }
}
```

---

## 5. Gestion des erreurs

### 5.1 Structure de gestion d'erreur basique

```js
try {
  const response = await Legacy.get('/Ticket/123');
  const ticket = response.data;
  // Traitement des données
} catch (error) {
  console.error("Erreur lors de la récupération du ticket", error);
  // Afficher un message à l'utilisateur
  setError("Impossible de charger le ticket");
  // Optionnel : renvoyer une valeur par défaut
  return null;
}
```

### 5.2 Erreurs courantes GLPI

| Code d'erreur | Description |
|----------------|-------------|
| `ERROR_WRONG_APP_TOKEN_PARAMETER` | App-Token invalide |
| `ERROR_GLPI_LOGIN_USER_TOKEN` | User-Token invalide |
| `ERROR_LOGIN_WITH_CREDENTIALS_DISABLED` | Authentification par login/mdp désactivée |
| `ERROR_ITEM_NOT_FOUND` | Ressource non trouvée |
| `ERROR_RIGHT_MISSING` | Droits insuffisants |

---

## 6. Interaction avec le Backend Spring Boot

### 6.1 Récupérer des données depuis le Backend

**Service frontend (superCoutService.js) :**
```js
import backendApi from './backend-api';

export const superCoutService = {
  getAll: async () => {
    const response = await backendApi.get('/api/super-cout');
    return response.data;
  },
  getByTicketId: async (ticketId) => {
    const response = await backendApi.get(`/api/super-cout/ticket/${ticketId}`);
    return response.data;
  },
};
```

**Backend Controller (SuperCoutController.java) :**
```java
@RestController
@RequestMapping("/api/super-cout")
@CrossOrigin(origins = "*")
public class SuperCoutController {

    @Autowired
    private SuperCoutService service;

    @GetMapping
    public List<SuperCoutDTO> getAllSuperCouts() {
        return service.getAllSuperCouts();
    }

    @GetMapping("/ticket/{ticketId}")
    public List<SuperCoutDTO> getSuperCoutsByTicketId(@PathVariable Long ticketId) {
        return service.getSuperCoutsByTicketId(ticketId);
    }
}
```

---

### 6.2 Agréger des données depuis GLPI et le Backend

**Exemple (itemCostService.js) :**
```js
export async function aggregateItemTypeCosts() {
  try {
    // Récupère des données depuis GLPI et depuis le Backend en parallèle
    const [ticketCosts, itemTickets, superCouts, coutOuvertures] = await Promise.all([
      fetchAllTicketCosts(),     // GLPI
      fetchAllItemTickets(),     // GLPI
      superCoutService.getAll().catch(() => []), // Backend
      coutOuvertureService.getAll().catch(() => []) // Backend
    ]);

    // Traite et agrège les données
    // ...

    return result;
  } catch (err) {
    console.error('Erreur lors de l\'agrégation des coûts', err);
    return [];
  }
}
```

---

## 7. Points clés à retenir

1. **Utilisez Legacy pour GLPI** : L'API Legacy (`/apirest.php`) est plus stable et mieux supportée pour les interactions courantes
2. **Intercepteurs** : Les intercepteurs Axios gèrent automatiquement l'authentification et le renouvellement des tokens
3. **Promise.all()** : Pour les requêtes multiples, toujours utiliser `Promise.all()` pour optimiser les performances
4. **expand_dropdowns** : Évitez des requêtes supplémentaires en utilisant `expand_dropdowns: true` pour résoudre les relations
5. **Gestion des erreurs** : Toujours utiliser `try/catch` et fournir des valeurs de fallback (ex: `.catch(() => ({ data: [] }))`)
6. **Normalisation** : Les réponses GLPI peuvent avoir des formats variés (tableau, objet imbriqué), utilisez des fonctions de normalisation
7. **CORS** : Utilisez `@CrossOrigin(origins = "*")` sur les controllers backend pour autoriser les requêtes depuis le frontend
