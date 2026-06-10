import { useCallback, useEffect, useState } from "react";
import { deletePurgeTicket, getAllTickets } from "../../services/ticketService";
import { getTicketActors, getTicketDetails } from "../../services/frontOfficeKanbanTicketService";
import {
    Button,
    H1,
    Table, Thead, Tbody, Tr, Th, Td,
    Loading,
    Error,
    Container,
} from '../../components'
import TicketDetailsModal from '../../components/TicketDetailsModal'

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

export default function Ticket() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [detailsActors, setDetailsActors] = useState(null);
    const [detailsActorsLoading, setDetailsActorsLoading] = useState(false);
    const [detailsActorsError, setDetailsActorsError] = useState("");
    
    useEffect(() => {
        const fetchAllTickets = async () => {
            try {
                setLoading(true)
                setError(false)
                const data = await getAllTickets();
                setTickets(data)
            } catch (error) {
                console.log("Erreur : " + error);
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        fetchAllTickets()
    }, [])

    const handleDeleteTicket = async (id) => {
        try {
            const response = await deletePurgeTicket(id)
            console.log(response.status)
            if (parseInt(response.status) === 200) {
                setTickets((currentTickets) =>
                    currentTickets.filter((ticket) => ticket.id !== id)
                )
            }
        } catch (error) {
            console.log('Erreur:' + error)
        }
    }

    const openDetails = useCallback(async (ticket) => {
        const ticketId = ticket?.id
        if (!ticketId) return

        setSelectedTicket(ticket)
        setDetailsLoading(true)
        setDetailsError("")
        setDetailsActors(null)
        setDetailsActorsLoading(true)
        setDetailsActorsError("")
        
        try {
            const [detailsResult, actorsResult] = await Promise.allSettled([
                getTicketDetails(ticketId),
                getTicketActors(ticketId),
            ])

            if (detailsResult.status === 'fulfilled' && detailsResult.value) {
                setSelectedTicket(detailsResult.value)
            }
            if (actorsResult.status === 'fulfilled' && actorsResult.value) {
                setDetailsActors(actorsResult.value)
            }
            if (detailsResult.status === 'rejected') {
                setDetailsError(detailsResult.reason?.message || 'Erreur lors du chargement des détails.')
            }
            if (actorsResult.status === 'rejected') {
                setDetailsActorsError(actorsResult.reason?.message || 'Erreur lors du chargement des acteurs.')
            }
        } catch (err) {
            setDetailsError(err?.message || 'Erreur lors du chargement des détails.')
        } finally {
            setDetailsLoading(false)
            setDetailsActorsLoading(false)
        }
    }, [])

    const closeDetails = useCallback(() => {
        setSelectedTicket(null)
        setDetailsError("")
        setDetailsLoading(false)
        setDetailsActors(null)
        setDetailsActorsError("")
        setDetailsActorsLoading(false)
    }, [])

    if (loading) {
        return (<Loading message="Récupération des données" />)
    }

    if (error) {
        return (
            <Error message={'Erreur lors de la recuperation de donnees'} />
        )
    }

    return (
        <Container size='7xl'>
            <H1>Voici la liste des Tickets</H1>
            <Table>
                <Thead>
                    <Tr>
                        <Th>ID</Th>
                        <Th>Titre</Th>
                        <Th>Derniere Modification</Th>
                        <Th>Date d'ouverture</Th>
                        <Th>Priorite</Th>
                        <Th>Status</Th>
                        <Th>Action</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {tickets.map(ticket => (
                        <Tr key={ticket.id}>
                            <Td >{ticket.id}</Td>
                            <Td>{ticket.name}</Td>
                            <Td>{formatDate(ticket.date_mod)}</Td>
                            <Td>{formatDate(ticket.date_creation)}</Td>
                            <Td>{formatPriorityLabel(ticket.priority)}</Td>
                            <Td>{ticket.status?.name || ticket.status}</Td>
                            <Td>
                                <div className="flex gap-2">
                                    <Button variant="primary" onClick={() => openDetails(ticket)}>Voir</Button>
                                    <Button variant="danger" onClick={() => handleDeleteTicket(ticket.id)}>Supprimer</Button>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <TicketDetailsModal
                isOpen={!!selectedTicket}
                onClose={closeDetails}
                ticket={selectedTicket}
                detailsLoading={detailsLoading}
                detailsError={detailsError}
                detailsActors={detailsActors}
                detailsActorsLoading={detailsActorsLoading}
                detailsActorsError={detailsActorsError}
            />
        </Container>
    )
}
