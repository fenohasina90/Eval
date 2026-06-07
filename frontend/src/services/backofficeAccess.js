const STORAGE_KEYS = {
  unlockedAt: 'backoffice_unlocked_at',
  lastCode: 'backoffice_last_code',
}

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000

function now() {
  return Date.now()
}

function readNumber(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function readString(key) {
  const value = localStorage.getItem(key)
  return typeof value === 'string' ? value : null
}

function getConfiguredAccessCode() {
  const code = import.meta.env.VITE_BACKOFFICE_ACCESS_CODE
  if (typeof code === 'string' && code.length > 0) return code
  return '0000'
}

export function getPrefilledAccessCode() {
  const saved = readString(STORAGE_KEYS.lastCode)
  if (saved) return saved
  const configuredDefault = import.meta.env.VITE_BACKOFFICE_CODE_DEFAULT
  return typeof configuredDefault === 'string' ? configuredDefault : ''
}

export function isBackofficeUnlocked({ ttlMs = DEFAULT_TTL_MS } = {}) {
  const unlockedAt = readNumber(STORAGE_KEYS.unlockedAt)
  if (!unlockedAt) return false
  return now() - unlockedAt < ttlMs
}

export function unlockBackoffice(code, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const expected = getConfiguredAccessCode()
  const normalized = typeof code === 'string' ? code.trim() : ''

  localStorage.setItem(STORAGE_KEYS.lastCode, normalized)

  if (normalized.length === 0) {
    return { ok: false, message: 'Veuillez saisir le code.' }
  }

  if (normalized !== expected) {
    localStorage.removeItem(STORAGE_KEYS.unlockedAt)
    return { ok: false, message: 'Code invalide.' }
  }

  localStorage.setItem(STORAGE_KEYS.unlockedAt, String(now()))
  return { ok: true, ttlMs }
}

export function lockBackoffice() {
  localStorage.removeItem(STORAGE_KEYS.unlockedAt)
}

