/**
 * Layout Sidebar
 * 
 * Layout principal avec une sidebar de navigation à gauche
 * et le contenu principal à droite.
 * Utilise react-router-dom <Outlet /> pour afficher les pages enfants.
 */
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { lockBackoffice } from '../services/backofficeAccess'

const navItems = [
  { path: '/', label: 'Accueil', icon: HomeIcon },
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/exemple', label: 'Exemple', icon: ComponentIcon },
  { path: '/tickets', label: 'Ticket', icon: TicketIcon },
  { path: '/reset', label: 'Reset', icon: ResetIcon },
  { path: '/import', label: 'Import de données', icon: ImportIcon },
]

export default function SidebarLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    lockBackoffice()
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
            <span className="text-lg font-semibold text-gray-900 truncate">
              Mon App
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
              end={item.path === '/'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-gray-900 text-white'
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
              text-red-600 hover:bg-red-50 transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogoutIcon className="w-5 h-5" style={{ flexShrink: 0 }} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center h-14 px-6 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="text-sm text-gray-500">
            Bienvenue
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

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
      />
    </svg>
  )
}

function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 3h18v18H3V3zm4 14v-6m5 6V7m5 10v-4"
      />
    </svg>
  )
}

function ComponentIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  )
}

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
      />
    </svg>
  )
}

function ResetIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7h6m-6 0 2-2m-2 2 2 2m10 8h-6m6 0-2 2m2-2-2-2M7 12a5 5 0 0 1 8.66-3.54L17 10m-10 2 1.34 1.54A5 5 0 0 0 17 14"
      />
    </svg>
  )
}

function ImportIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
      />
    </svg>
  )
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25"
      />
    </svg>
  )
}
