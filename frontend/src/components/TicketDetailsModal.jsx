import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatStatusLabel } from '../services/frontOfficeKanbanTicketService'
import Modal from './Modal'
import { Button } from '../components'

function FieldRow({ label, value, isDark }) {
  if (value === undefined || value === null || String(value).trim().length === 0) return null
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 py-2 border-b last:border-b-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
      <div className={`sm:col-span-2 text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{value}</div>
    </div>
  )
}

function formatTicketTypeLabel(typeValue) {
  if (typeValue && typeof typeValue === 'object' && typeValue.name) return typeValue.name
  const n = Number(typeValue)
  if (n === 1) return 'Incident'
  if (n === 2) return 'Demande'
  return '—'
}

function formatPriorityLabel(priorityValue) {
  const n = Number(priorityValue)
  if (n === 1) return 'Très basse'
  if (n === 2) return 'Basse'
  if (n === 3) return 'Moyenne'
  if (n === 4) return 'Haute'
  if (n === 5) return 'Très haute'
  if (n === 6) return 'Majeure'
  return '—'
}

function formatActorsList(list) {
  const items = Array.isArray(list) ? list : []
  if (items.length === 0) return '—'
  return items
    .map((u) => {
      // kind='group' → préfixe 👥, kind='user' ou absent → préfixe 👤
      const prefix = u?.kind === 'group' ? '👥 ' : '👤 '
      if (u?.name) return `${prefix}${u.name} (#${u.id || '?'})`
      if (u?.id) return `${prefix}#${u.id}`
      return '—'
    })
    .join(', ')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'

  // Handle date strings in different formats (ISO, GLPI format, etc.)
  let date
  if (typeof dateStr === 'string') {
    // Try parsing as ISO string first
    date = new Date(dateStr)
    // If that fails, try GLPI's format (YYYY-MM-DD HH:mm:ss)
    if (isNaN(date.getTime())) {
      const [datePart, timePart] = dateStr.split(' ')
      if (datePart) {
        const [year, month, day] = datePart.split('-')
        let hours = 0, minutes = 0, seconds = 0
        if (timePart) {
          const [h, m, s] = timePart.split(':')
          hours = parseInt(h) || 0
          minutes = parseInt(m) || 0
          seconds = parseInt(s) || 0
        }
        if (year && month && day) {
          date = new Date(year, month - 1, day, hours, minutes, seconds)
        }
      }
    }
  } else if (dateStr instanceof Date) {
    date = dateStr
  }

  if (!date || isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export default function TicketDetailsModal({
  isOpen,
  onClose,
  ticket,
  detailsLoading,
  detailsError,
  detailsActors,
  detailsActorsLoading,
  detailsActorsError,
  customization = null,
}) {
  const [isDark, setIsDark] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const updateDarkMode = () => {
      setIsDark(document.body.classList.contains('dark'))
    }
    updateDarkMode()
    
    const observer = new MutationObserver(() => {
      updateDarkMode()
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  const detailsTicketId = ticket?.id
  const detailsStatus = ticket ? formatStatusLabel(ticket.status, customization) : ''

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detailsTicketId ? `Ticket #${detailsTicketId}` : 'Détails du ticket'}
      className="max-w-3xl"
    >
      {detailsLoading && (
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chargement des détails…</div>
      )}
      {detailsError && (
        <div className="text-sm text-red-500">{detailsError}</div>
      )}
      {detailsActorsLoading && (
        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Chargement des acteurs…</div>
      )}
      {detailsActorsError && (
        <div className="text-sm text-red-500">{detailsActorsError}</div>
      )}
      {ticket && (
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onClose()
                navigate(`/front/ticket-history/${detailsTicketId}`)
              }}
            >
              Voir l'historique
            </Button>
          </div>
          <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50'}`}>
            <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {ticket.name || 'Sans titre'}
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Statut: {detailsStatus}
            </div>
          </div>

          <div className={`rounded-xl border px-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
            <FieldRow label="ID" value={ticket.id} isDark={isDark} />
            {ticket.type !== undefined && (
              <FieldRow label="Type" value={formatTicketTypeLabel(ticket.type)} isDark={isDark} />
            )}
            <FieldRow label="Priorité" value={formatPriorityLabel(ticket.priority)} isDark={isDark} />
            <FieldRow label="Date d'ouverture" value={formatDate(ticket.date)} isDark={isDark} />
            <FieldRow label="Date de création" value={formatDate(ticket.date_creation)} isDark={isDark} />
            <FieldRow label="Dernière modification" value={formatDate(ticket.date_mod)} isDark={isDark} />
            {detailsActors?.requesters !== undefined && (
              <FieldRow label="Demandeur" value={formatActorsList(detailsActors?.requesters)} isDark={isDark} />
            )}
            {detailsActors?.assignees !== undefined && (
              <FieldRow label="Attribué à" value={formatActorsList(detailsActors?.assignees)} isDark={isDark} />
            )}
            {detailsActors?.observers !== undefined && (
              <FieldRow label="Observateurs" value={formatActorsList(detailsActors?.observers)} isDark={isDark} />
            )}
          </div>

          <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
            <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</div>
            <div className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`} dangerouslySetInnerHTML={{ __html: ticket.content || '—' }} />
          </div>
        </div>
      )}
    </Modal>
  )
}
