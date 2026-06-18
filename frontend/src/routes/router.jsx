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
import Personalisation from '../pages/Personalisation/Personalisation'
import FrontOfficeLayout from '../layouts/FrontOfficeLayout'
import ElementList from '../pages/FrontOffice/ElementList'
import CreateTicket from '../pages/FrontOffice/CreateTicket'
import TicketKanban from '../pages/FrontOffice/TicketKanban'
import TicketHistory from '../pages/FrontOffice/TicketHistory'
import ItemTypeCosts from '../pages/FrontOffice/ItemTypeCosts'
import ImportStateTicket from '../pages/FrontOffice/ImportStateTicket'

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
      { path: 'personalisation', element: <Personalisation /> },
    ],
  },
  {
    path: '/front',
    element: <FrontOfficeLayout />,
    children: [
      { index: true, element: <ElementList /> },
      { path: 'create-ticket', element: <CreateTicket /> },
      { path: 'tickets-kanban', element: <TicketKanban /> },
      { path: 'ticket-history/:ticketId', element: <TicketHistory /> },
      { path: 'item-type-costs', element: <ItemTypeCosts /> },
      { path: 'import-state', element: <ImportStateTicket /> },
    ]
  }
])

export default router
