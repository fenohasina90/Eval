import { useCallback, useMemo, useState } from 'react'
import { Alert, Button, Card, Container, H1, Input, Select } from '../../components'
import {
  getKanbanCustomization,
  resetKanbanCustomization,
  setKanbanCustomization,
  KANBAN_TICKET_STATUSES,
} from '../../services/frontOfficeKanbanTicketService'

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Bleu', hex: '#3b82f6' },
  { value: 'amber', label: 'Ambre', hex: '#f59e0b' },
  { value: 'green', label: 'Vert', hex: '#10b981' },
  { value: 'red', label: 'Rouge', hex: '#ef4444' },
  { value: 'purple', label: 'Violet', hex: '#a855f7' },
  { value: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { value: 'pink', label: 'Rose', hex: '#ec4899' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'gray', label: 'Gris', hex: '#9ca3af' },
]

const PRESET_TO_HEX = Object.fromEntries(COLOR_OPTIONS.map((c) => [c.value, c.hex]))

function isHexColor(value) {
  const s = value != null ? String(value) : ''
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)
}

function normalizeHex(hex) {
  const raw = String(hex).trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
  }
  return raw
}

function toHexColor(value) {
  const raw = value != null ? String(value).trim() : ''
  if (isHexColor(raw)) return normalizeHex(raw)
  return PRESET_TO_HEX[raw] || PRESET_TO_HEX.gray
}

export default function Personalisation() {
  const [form, setForm] = useState(() => getKanbanCustomization())
  const [saved, setSaved] = useState(false)

  const rows = useMemo(() => ([
    { statusId: KANBAN_TICKET_STATUSES.NEW, label: 'Nouveau' },
    { statusId: KANBAN_TICKET_STATUSES.IN_PROGRESS, label: 'En cours' },
    { statusId: KANBAN_TICKET_STATUSES.CLOSED, label: 'Terminé' },
  ]), [])

  const setStatusColor = useCallback((statusId, color) => {
    setForm((prev) => ({
      ...prev,
      colorsByStatus: {
        ...(prev?.colorsByStatus || {}),
        [statusId]: color,
      },
    }))
    setSaved(false)
  }, [])

  const setStatusLabel = useCallback((statusId, label) => {
    setForm((prev) => ({
      ...prev,
      labelsByStatus: {
        ...(prev?.labelsByStatus || {}),
        [statusId]: label,
      },
    }))
    setSaved(false)
  }, [])

  const applyMalagasyExamples = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      labelsByStatus: {
        ...(prev?.labelsByStatus || {}),
        [KANBAN_TICKET_STATUSES.NEW]: 'Vaovao',
        [KANBAN_TICKET_STATUSES.IN_PROGRESS]: 'Efa manao',
        [KANBAN_TICKET_STATUSES.CLOSED]: 'Vita',
      },
    }))
    setSaved(false)
  }, [])

  const handleSave = useCallback(() => {
    setKanbanCustomization(form)
    setSaved(true)
  }, [form])

  const handleReset = useCallback(() => {
    resetKanbanCustomization()
    setForm(getKanbanCustomization())
    setSaved(true)
  }, [])

  return (
    <Container size="4xl">
      <div className="flex items-center justify-between gap-3 mb-5">
        <H1>Personnalisation</H1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Enregistrer
          </Button>
        </div>
      </div>

      {saved && (
        <Alert variant="success" className="mb-4">
          Paramètres enregistrés.
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="text-sm font-semibold text-gray-900">
            Tableau Kanban (FrontOffice)
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Personnalise la couleur de fond des colonnes et le libellé des statuts (ex: malgache).
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Button variant="secondary" size="sm" onClick={applyMalagasyExamples}>
                Exemples malgaches
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {rows.map((row) => {
                const statusId = row.statusId
                const color = form?.colorsByStatus?.[statusId] || 'gray'
                const label = form?.labelsByStatus?.[statusId] || ''
                const presetValue = COLOR_OPTIONS.some((o) => o.value === color) ? color : ''
                return (
                  <div
                    key={statusId}
                    className="rounded-xl border border-gray-100 bg-white p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: toHexColor(color) }} />
                      <div className="text-sm font-semibold text-gray-900">
                        Statut #{statusId} — {row.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500">Couleur</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            type="color"
                            value={toHexColor(color)}
                            onChange={(e) => setStatusColor(statusId, e.target.value)}
                            className="h-10 px-2 py-1"
                          />
                          <Select
                            value={presetValue}
                            onChange={(e) => setStatusColor(statusId, e.target.value)}
                          >
                            <option value="">Personnalisé</option>
                          {COLOR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500">Libellé</div>
                        <Input
                          value={label}
                          onChange={(e) => setStatusLabel(statusId, e.target.value)}
                          placeholder="Ex: Vaovao / Efa manao / Vita"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
