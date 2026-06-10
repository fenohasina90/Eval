/**
 * Layout Sidebar
 * 
 * Layout principal avec une sidebar de navigation à gauche
 * et le contenu principal à droite.
 * Utilise react-router-dom <Outlet /> pour afficher les pages enfants.
 */
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { lockBackoffice } from '../services/backofficeAccess'

const navItems = [
  { path: '/exemple', label: 'Exemple', icon: ComponentIcon },
  { path: '/', label: 'Accueil', icon: HomeIcon },
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/tickets', label: 'Ticket', icon: TicketIcon },
  { path: '/personalisation', label: 'Personnalisation', icon: PaletteIcon },
  { path: '/import', label: 'Import de données', icon: ImportIcon },
]

export default function SidebarLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })
  const navigate = useNavigate()
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark)
  }
  
  // Apply dark mode to body
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDark))
    if (isDark) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [isDark])

  function handleLogout() {
    lockBackoffice()
    navigate('/', { replace: true })
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}
          ${isDark ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}
        `}
      >
        {/* Logo / Header */}
        <div className={`flex items-center h-14 px-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          {!collapsed && (
            <span className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Mon App
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`
              p-1.5 rounded-lg transition-colors cursor-pointer
              ${collapsed ? 'mx-auto' : 'ml-auto'}
              ${isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }
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
                  ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white')
                  : (isDark 
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className="w-5 h-5" style={{ flexShrink: 0 }} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`p-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150
              border border-red-200 hover:border-red-300
              ${isDark 
                ? 'text-red-400 hover:bg-red-900/30' 
                : 'text-red-600 hover:bg-red-50'
              }
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
        <header className={`sticky top-0 z-10 flex items-center justify-between h-14 px-6 backdrop-blur border-b ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
          <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            Bienvenue
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 border ${isDark 
                ? 'text-gray-300 hover:text-white border-gray-600 hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {/* Reset button */}
            <button
              onClick={() => navigate('/reset')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 border ${isDark 
                ? 'text-red-400 hover:bg-red-900/30 border-red-800 hover:border-red-700' 
                : 'text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300'
              }`}
            >
              <ResetIcon className="w-4 h-4" />
              <span>Reset</span>
            </button>
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

function PaletteIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3c-5.523 0-10 3.94-10 8.8 0 3.208 2.23 6.02 5.49 7.486 1.056.475 2.01-.37 1.905-1.49l-.165-1.75a1.8 1.8 0 0 1 1.79-1.97h2.512a4.8 4.8 0 0 0 0-9.6H12z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 10.2h.01M10.5 7.8h.01M13.5 7.8h.01M16.5 10.2h.01" />
    </svg>
  )
}
