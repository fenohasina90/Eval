/**
 * Layout Front Office
 * 
 * Layout principal avec une sidebar de navigation à gauche
 * pour les utilisateurs finaux (Front Office).
 */
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/front', label: 'Mes éléments', icon: TicketIcon },
  { path: '/front/create-ticket', label: 'Créer un ticket', icon: PlusIcon },
  { path: '/front/tickets-kanban', label: 'Tickets (Kanban)', icon: KanbanIcon },
  { path: '/front/item-type-costs', label: 'Cout', icon: KanbanIcon },
  { path: '/front/import-state', label: 'Import', icon: KanbanIcon },
]

export default function FrontOfficeLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    // Redirection vers le login ou accueil public
    navigate('/', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center h-14 px-4 border-b border-gray-100">
          {!collapsed && (
            <span className="text-lg font-semibold text-indigo-600 truncate">
              Front Office
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
              transition-colors cursor-pointer
              ${collapsed ? 'mx-auto' : 'ml-auto'}
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/front'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5" style={{ flexShrink: 0 }} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
              text-gray-600 hover:bg-gray-100 transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <BackIcon className="w-5 h-5" style={{ flexShrink: 0 }} />
            {!collapsed && <span>Retour au portail</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center h-14 px-6 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">
            Espace Utilisateur
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

/* ─── Icônes SVG inline ─── */

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
      />
    </svg>
  )
}

function BackIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  )
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function KanbanIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5.25 6.75h6a.75.75 0 01.75.75v12a.75.75 0 01-.75.75h-6a.75.75 0 01-.75-.75v-12a.75.75 0 01.75-.75Zm7.5 0h6a.75.75 0 01.75.75v6a.75.75 0 01-.75.75h-6a.75.75 0 01-.75-.75v-6a.75.75 0 01.75-.75Z"
      />
    </svg>
  )
}

function CostIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 6c1.657 0 3 1.567 3 3.5S13.657 13 12 13s-3-1.567-3-3.5S10.343 6 12 6Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M5.25 19.5a4.5 4.5 0 016.75-3.897 4.5 4.5 0 016.75 3.897M12 3.75h-.008v.008H12v-.008Z"
      />
    </svg>
  )
}
