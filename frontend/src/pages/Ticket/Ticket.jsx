import { useEffect, useState } from "react";
import { deletePurgeTicket, getAllTickets } from "../../services/ticketService";
import {
    Button,
    H1,
    Table, Thead, Tbody, Tr, Th, Td,
    Loading,
    Error,
    Container,
    Modal,
} from '../../components'

export default function Ticket() {
    const getPriorityLabel = (level) => {
        const priorities = {
            1: "Très basse",
            2: "Basse",
            3: "Moyenne",
            4: "Haute",
            5: "Très haute",
            6: "Majeure"
        };
        return priorities[level] || level;
    };

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
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
                            <Td>{getPriorityLabel(ticket.priority)}</Td>
                            <Td>{ticket.status.name}</Td>
                            <Td>
                                <div className="flex gap-2">
                                    <Button variant="primary" onClick={() => setSelectedTicket(ticket)}>Voir</Button>
                                    <Button variant="danger" onClick={() => handleDeleteTicket(ticket.id)}>Supprimer</Button>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>

            <Modal
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                title="Fiche du ticket"
            >
                {selectedTicket && (
                    <div className="flex flex-col gap-3 text-sm">
                        <p><strong>ID :</strong> {selectedTicket.id}</p>
                        <p><strong>Titre :</strong> {selectedTicket.name}</p>
                        <p><strong>Date d'ouverture :</strong> {selectedTicket.date_creation}</p>
                        <p><strong>Dernière modification :</strong> {selectedTicket.date_mod}</p>
                        <p><strong>Priorité :</strong> {getPriorityLabel(selectedTicket.priority)}</p>
                        <p><strong>Statut :</strong> {selectedTicket.status?.name}</p>
                        {selectedTicket.content && (
                            <div>
                                <strong>Description :</strong>
                                <div className="mt-1 p-2 bg-gray-50 rounded" dangerouslySetInnerHTML={{ __html: selectedTicket.content }} />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </Container>
    )
}
