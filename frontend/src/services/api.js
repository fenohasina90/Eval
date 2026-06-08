import axios from "axios";

// ── Configuration GLPI ──────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function compactRecord(record) {
  const out = {};
  Object.entries(record || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const asString = String(value);
    if (asString.trim().length === 0) return;
    out[key] = asString;
  });
  return out;
}

const OAUTH_CREDENTIALS = {
  grant_type: import.meta.env.VITE_OAUTH_GRANT_TYPE || "password",
  client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
  client_secret: import.meta.env.VITE_OAUTH_CLIENT_SECRET,
  username: import.meta.env.VITE_OAUTH_USERNAME,
  password: import.meta.env.VITE_OAUTH_PASSWORD,
  scope: import.meta.env.VITE_OAUTH_SCOPE,
};

// ── Token storage ───────────────────────────────────────────────────
let accessToken = null;

/**
 * Demande un nouveau token OAuth2 à GLPI.
 * Le token est stocké en mémoire et retourné.
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
    const status = error?.response?.status;
    const data = error?.response?.data;
    const details =
      typeof data === "string"
        ? data
        : data
          ? JSON.stringify(data)
          : error?.message;

    throw new Error(
      `OAuth token request failed${status ? ` (${status})` : ""}: ${details}`,
      { cause: error }
    );
  }
}

/**
 * Retourne le token courant ou en demande un nouveau s'il n'existe pas.
 */
async function getToken() {
  if (!accessToken) {
    await fetchToken();
  }
  return accessToken;
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
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas intercepter les erreurs sur le endpoint /token lui-même
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/token")
    ) {
      return Promise.reject(error);
    }

    // Si un refresh est déjà en cours, mettre la requête en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Reset du token pour forcer un nouveau fetch
      accessToken = null;
      const newToken = await fetchToken();

      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      accessToken = null;
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Méthodes utilitaires ────────────────────────────────────────────

/**
 * GET request
 * @param {string} url  - endpoint relatif (ex: "/GraphQL/Schema")
 * @param {object} params - query params optionnels
 */
export function get(url, params = {}) {
  return api.get(url, { params });
}

/**
 * POST request
 * @param {string} url  - endpoint relatif
 * @param {object} data - body de la requête
 */
export function post(url, data = {}) {
  return api.post(url, data);
}

/**
 * PUT request
 */
export function put(url, data = {}) {
  return api.put(url, data);
}

/**
 * PATCH request
 */
export function patch(url, data = {}) {
  return api.patch(url, data);
}

/**
 * DELETE request
 */
export function del(url, data = {}) {
  return api.delete(url, { data });
}

/**
 * Force le renouvellement du token (utile pour login/logout)
 */
export async function refreshSession() {
  accessToken = null;
  return fetchToken();
}

/**
 * Supprime le token en mémoire (logout)
 */
export function clearSession() {
  accessToken = null;
}

// ═════════════════════════════════════════════════════════════════════
// ── API Legacy (apirest.php) ────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════

export const LEGACY_BASE_URL = import.meta.env.VITE_LEGACY_BASE_URL || "/apirest";
export const LEGACY_APP_TOKEN = import.meta.env.VITE_LEGACY_APP_TOKEN || import.meta.env.VITE_GLPI_APP_TOKEN || "";
const LEGACY_USER_TOKEN = import.meta.env.VITE_LEGACY_USER_TOKEN || "";
const LEGACY_CREDENTIALS = {
  login: import.meta.env.VITE_LEGACY_LOGIN || "glpi",
  password: import.meta.env.VITE_LEGACY_PASSWORD || "glpi",
};

let sessionToken = null;

/**
 * Initialise une session legacy via initSession.
 * Retourne le session_token.
 */
async function initSession() {
  try {
    if (!LEGACY_APP_TOKEN) {
      throw new Error(
        "Legacy initSession failed: App-Token manquant. Renseigne VITE_LEGACY_APP_TOKEN (ou VITE_GLPI_APP_TOKEN) avec un App-Token valide configuré dans GLPI (Configuration > Générale > API)."
      );
    }

    const baseHeaders = {
      "Content-Type": "application/json",
      "App-Token": LEGACY_APP_TOKEN,
    };

    const withUserToken = () => ({
      headers: {
        ...baseHeaders,
        Authorization: `user_token ${LEGACY_USER_TOKEN}`,
      },
    });

    const withCredentials = () => ({
      headers: baseHeaders,
      auth: {
        username: LEGACY_CREDENTIALS.login,
        password: LEGACY_CREDENTIALS.password,
      },
    });

    const tryInit = async (config) => {
      const { data } = await axios.get(`${LEGACY_BASE_URL}/initSession`, config);
      sessionToken = data.session_token;
      return sessionToken;
    };

    if (LEGACY_USER_TOKEN) {
      return await tryInit(withUserToken());
    }

    return await tryInit(withCredentials());
  } catch (error) {
    const data = error?.response?.data;
    const code = Array.isArray(data) ? data[0] : null;

    if (code === "ERROR_GLPI_LOGIN_USER_TOKEN" && LEGACY_USER_TOKEN) {
      try {
        return await (async () => {
          const { data } = await axios.get(`${LEGACY_BASE_URL}/initSession`, {
            headers: {
              "Content-Type": "application/json",
              "App-Token": LEGACY_APP_TOKEN,
            },
            auth: {
              username: LEGACY_CREDENTIALS.login,
              password: LEGACY_CREDENTIALS.password,
            },
          });
          sessionToken = data.session_token;
          return sessionToken;
        })();
      } catch (fallbackError) {
        throw new Error(
          "Legacy initSession failed: user_token invalide. Vérifie VITE_LEGACY_USER_TOKEN ou utilise l'auth login/password (si autorisée côté GLPI).",
          { cause: fallbackError }
        );
      }
    }

    if (code === "ERROR_LOGIN_WITH_CREDENTIALS_DISABLED" && !LEGACY_USER_TOKEN) {
      throw new Error(
        "Legacy initSession failed: initSession avec identifiants est désactivé. Renseigne VITE_LEGACY_USER_TOKEN (token API utilisateur) ou réactive l'option côté GLPI.",
        { cause: error }
      );
    }

    if (code === "ERROR_WRONG_APP_TOKEN_PARAMETER") {
      throw new Error(
        "Legacy initSession failed: App-Token invalide. Vérifie VITE_LEGACY_APP_TOKEN (ou VITE_GLPI_APP_TOKEN) et l'API client configuré dans GLPI.",
        { cause: error }
      );
    }

    throw error;
  }
}

/**
 * Retourne le session token courant ou en initialise un nouveau.
 */
export async function getSessionToken() {
  if (!sessionToken) {
    await initSession();
  }
  return sessionToken;
}

// ── Instance Axios Legacy ───────────────────────────────────────────
const legacy = axios.create({
  baseURL: LEGACY_BASE_URL,
});

// Intercepteur REQUEST : injecte le Session-Token automatiquement
legacy.interceptors.request.use(async (config) => {
  const token = await getSessionToken();
  config.headers["Session-Token"] = token;
  config.headers["App-Token"] = LEGACY_APP_TOKEN;
  return config;
});

// Intercepteur RESPONSE : renouvelle la session sur 401
let isRefreshingLegacy = false;
let failedQueueLegacy = [];

function processQueueLegacy(error, token = null) {
  failedQueueLegacy.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueueLegacy = [];
}

legacy.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/initSession")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshingLegacy) {
      return new Promise((resolve, reject) => {
        failedQueueLegacy.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers["Session-Token"] = token;
        return legacy(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshingLegacy = true;

    try {
      sessionToken = null;
      const newToken = await initSession();

      processQueueLegacy(null, newToken);

      originalRequest.headers["Session-Token"] = newToken;
      return legacy(originalRequest);
    } catch (refreshError) {
      processQueueLegacy(refreshError, null);
      sessionToken = null;
      return Promise.reject(refreshError);
    } finally {
      isRefreshingLegacy = false;
    }
  }
);

// ── Méthodes Legacy ─────────────────────────────────────────────────

export const Legacy = {
  /**
   * GET legacy
   * @param {string} url  - endpoint relatif (ex: "/Ticket")
   * @param {object} params - query params optionnels
   */
  get(url, params = {}) {
    return legacy.get(url, { params });
  },

  /**
   * POST legacy
   * @param {string} url  - endpoint relatif
   * @param {object} data - body (sera wrappé dans { input: data })
   */
  post(url, data = {}) {
    return legacy.post(url, { input: data });
  },

  /**
   * PUT legacy
   * @param {string} url  - endpoint relatif
   * @param {object} data - body (sera wrappé dans { input: data })
   */
  put(url, data = {}) {
    return legacy.put(url, { input: data });
  },

  /**
   * DELETE legacy (mise à la corbeille)
   * @param {string} url  - endpoint relatif (ex: "/Ticket/5")
   */
  del(url) {
    return legacy.delete(url);
  },

  /**
   * DELETE legacy avec force_purge (suppression définitive)
   * @param {string} url  - endpoint relatif (ex: "/Ticket/5")
   */
  delPurge(url) {
    return legacy.delete(url, { params: { force_purge: 1 } });
  },

  /**
   * Force le renouvellement de la session legacy
   */
  async refreshSession() {
    sessionToken = null;
    return initSession();
  },

  /**
   * Tue la session legacy (killSession)
   */
  async killSession() {
    try {
      await legacy.get("/killSession");
    } finally {
      sessionToken = null;
    }
  },
};

export { legacy };
export default api;
