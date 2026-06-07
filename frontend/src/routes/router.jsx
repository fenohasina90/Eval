/**
 * Configuration des routes de l'application
 */
import { createBrowserRouter } from 'react-router-dom'
import SidebarLayout from '../layouts/SidebarLayout'
import BackofficeGate from './BackofficeGate'
import Accueil from '../pages/Accueil'
import Dashboard from '../pages/Dashboard/Dashboard'
import Exemple from '../pages/Exemple'
import Ticket from '../pages/Ticket/Ticket'
import Reset from '../pages/Reset/reset'
import ImportData from '../pages/Import/ImportData'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <BackofficeGate>
        <SidebarLayout />
      </BackofficeGate>
    ),
    children: [
      { index: true, element: <Accueil /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'exemple', element: <Exemple /> },
      { path: 'tickets', element: <Ticket /> },
      { path: 'reset', element: <Reset /> },
      { path: 'import', element: <ImportData /> },
    ],
  },
])

export default router
