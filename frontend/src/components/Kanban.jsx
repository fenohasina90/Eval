/**
 * Composant Kanban réutilisable
 *
 * Un tableau Kanban avec colonnes configurables, drag & drop natif,
 * et animations fluides.
 *
 * Props principales :
 *   - columns : tableau de { id, title, color?, icon? }
 *   - items : tableau d'éléments à afficher
 *   - getColumnId : fonction (item) => columnId pour placer chaque item
 *   - onItemMove : callback (itemId, fromColumnId, toColumnId) appelé lors du drag & drop
 *   - renderCard : fonction (item) => JSX pour personnaliser le rendu des cartes
 *   - getItemId : fonction (item) => id unique (défaut: item.id)
 *
 * Exemple :
 *   const columns = [
 *     { id: 'todo', title: 'À faire', color: 'blue' },
 *     { id: 'in-progress', title: 'En cours', color: 'amber' },
 *     { id: 'done', title: 'Terminé', color: 'green' },
 *   ]
 *
 *   <Kanban
 *     columns={columns}
 *     items={tickets}
 *     getColumnId={(t) => t.status}
 *     onItemMove={handleMove}
 *     renderCard={(t) => <div>{t.name}</div>}
 *   />
 */
import { useState, useCallback, useMemo, useRef } from 'react'

/* ─── Palette de couleurs par nom ─── */
const COLOR_MAP = {
  blue:   { bg: 'bg-blue-100',   border: 'border-blue-200',  accent: 'bg-blue-500',  text: 'text-blue-700',  badge: 'bg-blue-100 text-blue-700',  dropBg: 'bg-blue-100/60'  },
  green:  { bg: 'bg-emerald-100', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', dropBg: 'bg-emerald-100/60' },
  amber:  { bg: 'bg-amber-100',  border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dropBg: 'bg-amber-100/60' },
  red:    { bg: 'bg-red-100',    border: 'border-red-200',   accent: 'bg-red-500',   text: 'text-red-700',   badge: 'bg-red-100 text-red-700',   dropBg: 'bg-red-100/60'   },
  purple: { bg: 'bg-purple-100', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700', dropBg: 'bg-purple-100/60' },
  gray:   { bg: 'bg-gray-100',   border: 'border-gray-200',  accent: 'bg-gray-400',  text: 'text-gray-600',  badge: 'bg-gray-100 text-gray-600',  dropBg: 'bg-gray-100/60'  },
  indigo: { bg: 'bg-indigo-100', border: 'border-indigo-200', accent: 'bg-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', dropBg: 'bg-indigo-100/60' },
  pink:   { bg: 'bg-pink-100',   border: 'border-pink-200',  accent: 'bg-pink-500',  text: 'text-pink-700',  badge: 'bg-pink-100 text-pink-700',  dropBg: 'bg-pink-100/60'  },
  orange: { bg: 'bg-orange-100', border: 'border-orange-200', accent: 'bg-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dropBg: 'bg-orange-100/60' },
}

const DEFAULT_COLORS = COLOR_MAP.gray

const PRESET_HEX = {
  blue: '#3b82f6',
  amber: '#f59e0b',
  green: '#10b981',
  red: '#ef4444',
  purple: '#a855f7',
  gray: '#9ca3af',
  indigo: '#6366f1',
  pink: '#ec4899',
  orange: '#f97316',
}

const HEX_TO_PRESET = new Map(Object.entries(PRESET_HEX).map(([k, v]) => [v.toLowerCase(), k]))

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

function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { r, g, b }
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getColors(colorValue) {
  const raw = colorValue != null ? String(colorValue).trim() : ''
  if (isHexColor(raw)) {
    const hex = normalizeHex(raw)
    const preset = HEX_TO_PRESET.get(hex)
    if (preset) return { ...COLOR_MAP[preset], isCustom: false }
    return {
      ...DEFAULT_COLORS,
      isCustom: true,
      style: {
        borderColor: rgba(hex, 0.35),
        bgColor: rgba(hex, 0.10),
        dropBgColor: rgba(hex, 0.18),
        accentColor: hex,
        ringColor: rgba(hex, 0.35),
      },
    }
  }

  return { ...(COLOR_MAP[raw] || DEFAULT_COLORS), isCustom: false }
}

/* ─── Composant Kanban principal ─── */
export default function Kanban({
  columns = [],
  items = [],
  getColumnId,
  onItemMove,
  renderCard,
  getItemId = (item) => item.id,
  renderColumnActions,
  className = '',
  emptyMessage = 'Aucun élément',
}) {
  const [draggedItemId, setDraggedItemId] = useState(null)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)
  const dragSourceColumnRef = useRef(null)

  // Grouper les items par colonne
  const groupedItems = useMemo(() => {
    const groups = {}
    columns.forEach((col) => { groups[col.id] = [] })
    items.forEach((item) => {
      const colId = getColumnId(item)
      if (groups[colId]) {
        groups[colId].push(item)
      }
    })
    return groups
  }, [columns, items, getColumnId])

  /* ── Drag handlers ── */
  const handleDragStart = useCallback((e, item, columnId) => {
    const itemId = getItemId(item)
    setDraggedItemId(itemId)
    dragSourceColumnRef.current = columnId
    e.dataTransfer.effectAllowed = 'move'
    // Stocker l'ID pour le transfer
    e.dataTransfer.setData('text/plain', String(itemId))
  }, [getItemId])

  const handleDragOver = useCallback((e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumnId(columnId)
  }, [])

  const handleDragLeave = useCallback((e, columnId) => {
    // Vérifier qu'on quitte bien la colonne (pas un enfant)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumnId((prev) => (prev === columnId ? null : prev))
    }
  }, [])

  const handleDrop = useCallback((e, targetColumnId) => {
    e.preventDefault()
    setDragOverColumnId(null)
    const sourceColumnId = dragSourceColumnRef.current
    if (draggedItemId != null && sourceColumnId !== targetColumnId && onItemMove) {
      onItemMove(draggedItemId, sourceColumnId, targetColumnId)
    }
    setDraggedItemId(null)
    dragSourceColumnRef.current = null
  }, [draggedItemId, onItemMove])

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null)
    setDragOverColumnId(null)
    dragSourceColumnRef.current = null
  }, [])

  return (
    <div
      className={`
        flex gap-4 overflow-x-auto pb-4
        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        ${className}
      `}
      id="kanban-board"
    >
      {columns.map((column) => {
        const colors = getColors(column.color)
        const colItems = groupedItems[column.id] || []
        const isDropTarget = dragOverColumnId === column.id
        const isDragSource = dragSourceColumnRef.current === column.id

        return (
          <KanbanColumn
            key={column.id}
            column={column}
            items={colItems}
            colors={colors}
            isDropTarget={isDropTarget}
            isDragSource={isDragSource}
            draggedItemId={draggedItemId}
            getItemId={getItemId}
            renderCard={renderCard}
            renderColumnActions={renderColumnActions}
            emptyMessage={emptyMessage}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        )
      })}
    </div>
  )
}

/* ─── Colonne ─── */
function KanbanColumn({
  column,
  items,
  colors,
  isDropTarget,
  isDragSource,
  draggedItemId,
  getItemId,
  renderCard,
  renderColumnActions,
  emptyMessage,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  return (
    <div
      className={`
        flex flex-col min-w-[280px] w-[320px] shrink-0
        rounded-2xl border transition-all duration-200 ease-out
        ${colors.border}
        ${isDropTarget
          ? `${colors.dropBg} ring-2 ring-offset-1 ring-gray-300 scale-[1.01]`
          : `${colors.bg}`
        }
      `}
      style={colors.isCustom ? {
        borderColor: colors.style?.borderColor,
        backgroundColor: isDropTarget ? colors.style?.dropBgColor : colors.style?.bgColor,
        ['--tw-ring-color']: colors.style?.ringColor,
      } : undefined}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={(e) => onDragLeave(e, column.id)}
      onDrop={(e) => onDrop(e, column.id)}
      id={`kanban-column-${column.id}`}
    >
      {/* En-tête de colonne */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Indicateur couleur */}
        <div
          className={`w-2.5 h-2.5 rounded-full ${colors.isCustom ? '' : colors.accent} ring-2 ring-white shadow-sm`}
          style={colors.isCustom ? { backgroundColor: colors.style?.accentColor } : undefined}
        />

        {/* Icône optionnelle */}
        {column.icon && (
          <span className={`text-base ${colors.text}`}>{column.icon}</span>
        )}

        {/* Titre */}
        <h3 className={`text-sm font-semibold ${colors.text} truncate`}>
          {column.title}
        </h3>

        <div className="ml-auto flex items-center gap-2">
          {renderColumnActions ? renderColumnActions(column) : null}
          <span className={`
            inline-flex items-center justify-center
            min-w-[24px] h-6 px-2
            text-xs font-bold rounded-full
            ${colors.badge}
            transition-transform duration-200
            ${isDropTarget ? 'scale-110' : ''}
          `}>
            {items.length}
          </span>
        </div>
      </div>

      {/* Séparateur */}
      <div
        className={`mx-3 border-t ${colors.border} opacity-60`}
        style={colors.isCustom ? { borderColor: colors.style?.borderColor } : undefined}
      />

      {/* Zone des cartes */}
      <div className="flex flex-col gap-2.5 p-3 min-h-[120px] flex-1">
        {items.length === 0 ? (
          <div
            className={`
            flex items-center justify-center h-full min-h-[80px]
            text-sm text-gray-400 italic
            border-2 border-dashed rounded-xl
            ${isDropTarget ? `${colors.border}` : 'border-gray-200'}
            transition-colors duration-200
          `}
            style={colors.isCustom && isDropTarget ? { borderColor: colors.style?.borderColor } : undefined}
          >
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => {
            const itemId = getItemId(item)
            const isDragging = draggedItemId === itemId

            return (
              <div
                key={itemId}
                draggable
                onDragStart={(e) => onDragStart(e, item, column.id)}
                onDragEnd={onDragEnd}
                className={`
                  group relative
                  bg-white rounded-xl border border-gray-100
                  shadow-sm hover:shadow-md
                  transition-all duration-200 ease-out
                  cursor-grab active:cursor-grabbing
                  hover:-translate-y-0.5
                  ${isDragging
                    ? 'opacity-40 scale-95 rotate-1 shadow-lg'
                    : 'opacity-100 scale-100 rotate-0'
                  }
                `}
                id={`kanban-card-${itemId}`}
              >
                {/* Barre latérale accent */}
                <div
                  className={`
                  absolute left-0 top-3 bottom-3 w-1 rounded-full
                  ${colors.isCustom ? '' : colors.accent}
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                `}
                  style={colors.isCustom ? { backgroundColor: colors.style?.accentColor } : undefined}
                />

                {/* Contenu de la carte */}
                <div className="p-3.5">
                  {renderCard ? renderCard(item) : (
                    <div className="text-sm text-gray-700">
                      {item.name || item.title || String(itemId)}
                    </div>
                  )}
                </div>

                {/* Indicateur de drag (handle) */}
                <div className={`
                  absolute top-2 right-2
                  opacity-0 group-hover:opacity-50
                  transition-opacity duration-150
                `}>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="5" cy="3" r="1.2" />
                    <circle cx="11" cy="3" r="1.2" />
                    <circle cx="5" cy="8" r="1.2" />
                    <circle cx="11" cy="8" r="1.2" />
                    <circle cx="5" cy="13" r="1.2" />
                    <circle cx="11" cy="13" r="1.2" />
                  </svg>
                </div>
              </div>
            )
          })
        )}

        {/* Zone de drop supplémentaire en bas de colonne */}
        {isDropTarget && items.length > 0 && (
          <div
            className={`
            h-14 rounded-xl border-2 border-dashed
            ${colors.border}
            flex items-center justify-center
            text-xs ${colors.text} font-medium
            animate-pulse
          `}
            style={colors.isCustom ? { borderColor: colors.style?.borderColor } : undefined}
          >
            Déposer ici
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Sous-composant pour carte de ticket (prêt à l'emploi GLPI) ─── */
const PRIORITY_CONFIG = {
  1: { label: 'Très basse', classes: 'bg-gray-100 text-gray-600' },
  2: { label: 'Basse', classes: 'bg-blue-100 text-blue-700' },
  3: { label: 'Moyenne', classes: 'bg-amber-100 text-amber-700' },
  4: { label: 'Haute', classes: 'bg-orange-100 text-orange-700' },
  5: { label: 'Très haute', classes: 'bg-red-100 text-red-700' },
  6: { label: 'Majeure', classes: 'bg-red-200 text-red-800' },
}

Kanban.TicketCard = function TicketCard({
  ticket,
  onClick,
  className = '',
}) {
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG[3]
  const dateStr = ticket.date_creation
    ? new Date(ticket.date_creation).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
      })
    : null

  return (
    <div
      className={`space-y-2.5 ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick() } : undefined}
    >
      {/* ID + priorité */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
        <span className={`
          inline-flex items-center px-2 py-0.5
          text-[10px] font-semibold uppercase tracking-wide rounded-full
          ${priority.classes}
        `}>
          {priority.label}
        </span>
      </div>

      {/* Titre */}
      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
        {ticket.name}
      </p>

      {/* Métadonnées */}
      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        {dateStr && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {dateStr}
          </span>
        )}
        {ticket.type && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {typeof ticket.type === 'object' ? ticket.type.name : (ticket.type === 1 ? 'Incident' : 'Demande')}
          </span>
        )}
      </div>
    </div>
  )
}
