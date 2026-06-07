import { useEffect, useState } from "react";
import { deletePurgeTicket, getAllTickets } from "../../services/ticketService";
import {
    Button,
    H1,
    Table, Thead, Tbody, Tr, Th, Td,
    Loading,
    Error,
    Container,
} from '../../components'

export default function Ticket() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false)
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

    const handleDeleteTicket = async (id) =>{
        try {
            const response = await deletePurgeTicket(id)
            console.log(response.status)
            if (parseInt(response.status)  === 200) {
                setTickets((currentTickets) =>
                    currentTickets.filter((ticket) => ticket.id !== id)
                )
            }
        } catch (error) {
            console.log('Erreur:' + error)
        }
    }
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
                            <Td>{ticket.date_mod}</Td>
                            <Td>{ticket.date_creation}</Td>
                            <Td>{ticket.priority}</Td>
                            <Td>{ticket.status.name}</Td>
                            <Td><Button variant="danger" onClick={() => handleDeleteTicket(ticket.id)}>supprimer</Button></Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Container>
    )
}
