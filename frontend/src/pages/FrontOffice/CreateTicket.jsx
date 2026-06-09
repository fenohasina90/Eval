import { useState, useEffect } from 'react';
import { searchElements, getDropdowns } from '../../services/frontOfficeService';
import { createTicketWithItems } from '../../services/createTicketService';
import {
    Container,
    H1,
    Card,
    Input,
    Button,
    Select,
    Alert
} from '../../components';

const TYPE_OPTIONS = [
    { value: '', label: 'Tous les types' },
    { value: 'Computer', label: 'Ordinateurs' },
    { value: 'Monitor', label: 'Écrans' },
    { value: 'Printer', label: 'Imprimantes' },
    { value: 'NetworkEquipment', label: 'Matériel réseau' },
    { value: 'Peripheral', label: 'Périphériques' },
    { value: 'Phone', label: 'Téléphones' },
    { value: 'Rack', label: 'Baies' },
    { value: 'Enclosure', label: 'Châssis' },
    { value: 'Software', label: 'Logiciels' },
    { value: 'PassiveDCEquipment', label: 'Équipements passifs' },
    { value: 'PDU', label: 'PDU' },
    { value: 'Cable', label: 'Câbles' },
    { value: 'Unmanaged', label: 'Actif non géré' },
    { value: 'Appliance', label: 'Applicatif' },
    { value: 'SoftwareLicense', label: 'Licence' },
    { value: 'Certificate', label: 'Certificat' }
];

const TICKET_TYPES = [
    { value: '1', label: 'Incident' },
    { value: '2', label: 'Demande' }
];

const TICKET_STATUSES = [
    { value: '1', label: 'Nouveau' },
    { value: '2', label: 'En cours (Attribué)' },
    { value: '3', label: 'Planifié' },
    { value: '4', label: 'En attente' },
    { value: '5', label: 'Résolu' },
    { value: '6', label: 'Clos' }
];

const LEVELS = [
    { value: '1', label: 'Très basse' },
    { value: '2', label: 'Basse' },
    { value: '3', label: 'Moyenne' },
    { value: '4', label: 'Haute' },
    { value: '5', label: 'Très haute' }
];

const PRIORITIES = [
    ...LEVELS,
    { value: '6', label: 'Majeure' }
];

const ACTION_TIMES = [
    { value: '0', label: 'Aucune' },
    { value: '300', label: '5 minutes' },
    { value: '900', label: '15 minutes' },
    { value: '1800', label: '30 minutes' },
    { value: '2700', label: '45 minutes' },
    { value: '3600', label: '1 heure' },
    { value: '7200', label: '2 heures' },
    { value: '14400', label: '4 heures' },
    { value: '28800', label: '8 heures' }
];

export function CreateTicketForm({
    forcedStatus = null,
    lockStatus = false,
    onCreated = null
}) {
    const [ticketData, setTicketData] = useState({
        name: '',
        content: '',
        date: '',
        type: '1',
        status: forcedStatus ?? '1',
        urgency: '3',
        impact: '3',
        priority: '3',
        locations_id: '0',
        actiontime: '0'
    });

    const [locations, setLocations] = useState([]);
    
    // Éléments associés
    const [selectedItems, setSelectedItems] = useState([]);
    
    // Formulaire dynamique pour ajout
    const [selectedType, setSelectedType] = useState('');
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [isLoadingItems, setIsLoadingItems] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    useEffect(() => {
        // Charger les lieux au démarrage
        const loadInitData = async () => {
            const dropdowns = await getDropdowns();
            setLocations(dropdowns.locations || []);
        };
        loadInitData();
    }, []);

    useEffect(() => {
        if (forcedStatus == null) return;
        setTicketData((prev) => ({ ...prev, status: String(forcedStatus) }));
    }, [forcedStatus]);

    // Chargement dynamique des éléments quand le type change
    useEffect(() => {
        const fetchItemsByType = async () => {
            if (!selectedType) {
                setAvailableItems([]);
                setSelectedItemId('');
                return;
            }
            setIsLoadingItems(true);
            try {
                const data = await searchElements({ itemtype: selectedType }, null);
                setAvailableItems(data);
                setSelectedItemId(data.length > 0 ? String(data[0].id) : '');
            } catch (err) {
                console.error("Erreur lors du chargement des éléments", err);
                setAvailableItems([]);
            } finally {
                setIsLoadingItems(false);
            }
        };

        fetchItemsByType();
    }, [selectedType]);

    const getTypeLabel = (type) => {
        const t = TYPE_OPTIONS.find(opt => opt.value === type);
        return t ? t.label : type;
    };

    const handleAddItem = () => {
        if (!selectedType || !selectedItemId) return;
        
        const itemObj = availableItems.find(el => String(el.id) === selectedItemId);
        if (!itemObj) return;

        // Eviter les doublons
        if (!selectedItems.find(el => String(el.id) === selectedItemId && el.itemtype === selectedType)) {
            setSelectedItems([...selectedItems, itemObj]);
        }
    };

    const handleRemoveItem = (itemToRemove) => {
        setSelectedItems(selectedItems.filter(item => !(item.id === itemToRemove.id && item.itemtype === itemToRemove.itemtype)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ticketData.name || !ticketData.content) {
            setSubmitError("Le titre et la description sont obligatoires.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');

        try {
            const result = await createTicketWithItems(ticketData, selectedItems);
            setSubmitSuccess(`Le ticket a été créé avec succès (ID: ${result.ticketId}).`);
            if (onCreated) onCreated(result);
            
            // Réinitialiser le formulaire
            setTicketData({
                name: '', content: '', date: '', type: '1', status: forcedStatus ?? '1', 
                urgency: '3', impact: '3', priority: '3', locations_id: '0', actiontime: '0'
            });
            setSelectedItems([]);
            setSelectedType('');
        } catch (err) {
            setSubmitError(err.message || "Une erreur est survenue lors de la création du ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {submitSuccess && <Alert variant="success" className="mb-6">{submitSuccess}</Alert>}
            {submitError && <Alert variant="danger" className="mb-6">{submitError}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                <Card>
                    <Card.Body className="space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 border-b pb-2">1. Informations générales</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Titre du ticket *</label>
                                <Input
                                    placeholder="Ex: Panne d'écran, Problème réseau..."
                                    value={ticketData.name}
                                    onChange={(e) => setTicketData({ ...ticketData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-gray-700">Description du problème *</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                    rows={5}
                                    placeholder="Décrivez en détail le problème rencontré..."
                                    value={ticketData.content}
                                    onChange={(e) => setTicketData({ ...ticketData, content: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Date d'ouverture</label>
                                <Input
                                    type="datetime-local"
                                    value={ticketData.date}
                                    onChange={(e) => setTicketData({ ...ticketData, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Lieu</label>
                                <Select
                                    value={ticketData.locations_id}
                                    onChange={(e) => setTicketData({ ...ticketData, locations_id: e.target.value })}
                                >
                                    <option value="0">Aucun lieu</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.completename || loc.name}</option>
                                    ))}
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Type</label>
                                <Select
                                    value={ticketData.type}
                                    onChange={(e) => setTicketData({ ...ticketData, type: e.target.value })}
                                >
                                    {TICKET_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Statut</label>
                                {lockStatus ? (
                                    <div className="text-sm text-gray-700 px-3 py-2 rounded-md border border-gray-200 bg-gray-50">
                                        {TICKET_STATUSES.find((s) => s.value === String(ticketData.status))?.label || 'Nouveau'}
                                    </div>
                                ) : (
                                    <Select
                                        value={ticketData.status}
                                        onChange={(e) => setTicketData({ ...ticketData, status: e.target.value })}
                                    >
                                        {TICKET_STATUSES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Urgence</label>
                                <Select
                                    value={ticketData.urgency}
                                    onChange={(e) => setTicketData({ ...ticketData, urgency: e.target.value })}
                                >
                                    {LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Impact</label>
                                <Select
                                    value={ticketData.impact}
                                    onChange={(e) => setTicketData({ ...ticketData, impact: e.target.value })}
                                >
                                    {LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Priorité</label>
                                <Select
                                    value={ticketData.priority}
                                    onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                                >
                                    {PRIORITIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Durée totale</label>
                                <Select
                                    value={ticketData.actiontime}
                                    onChange={(e) => setTicketData({ ...ticketData, actiontime: e.target.value })}
                                >
                                    {ACTION_TIMES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Body className="space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 border-b pb-2">2. Éléments associés</h2>
                        
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <h3 className="text-sm font-medium text-gray-700">Sélectionner un actif à associer</h3>
                            
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="w-full md:w-64 space-y-1">
                                    <label className="text-xs text-gray-500">Type d'actif</label>
                                    <Select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                    >
                                        <option value="" disabled>Choisir un type</option>
                                        {TYPE_OPTIONS.filter(o => o.value !== '').map(opt => (
                                            <option key={`type-${opt.value}`} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-gray-500">Élément</label>
                                    <Select
                                        value={selectedItemId}
                                        onChange={(e) => setSelectedItemId(e.target.value)}
                                        disabled={!selectedType || isLoadingItems}
                                    >
                                        {isLoadingItems && <option value="">Chargement...</option>}
                                        {!isLoadingItems && availableItems.length === 0 && <option value="">Aucun élément disponible</option>}
                                        {!isLoadingItems && availableItems.map(item => (
                                            <option key={`item-${item.id}`} value={item.id}>
                                                {item.name || item.serial || `ID: ${item.id}`}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={handleAddItem} 
                                    disabled={!selectedType || !selectedItemId || isLoadingItems}
                                >
                                    Ajouter
                                </Button>
                            </div>
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="space-y-3 mt-4">
                                <h3 className="text-sm font-medium text-gray-700">Actifs actuellement associés ({selectedItems.length}) :</h3>
                                <div className="flex flex-col gap-2">
                                    {selectedItems.map(item => (
                                        <div key={`sel-${item.itemtype}-${item.id}`} className="flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-lg shadow-sm">
                                            <div>
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded mr-2">
                                                    {getTypeLabel(item.itemtype)}
                                                </span>
                                                <span className="font-medium text-gray-900">{item.name || item.serial || `ID ${item.id}`}</span>
                                            </div>
                                            <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(item)}>
                                                Retirer
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Création en cours...' : 'Créer le ticket'}
                    </Button>
                </div>
            </form>
        </>
    );
}

export default function CreateTicket() {
    return (
        <Container size="5xl">
            <div className="mb-6">
                <H1>Créer un Ticket</H1>
                <p className="text-gray-600">Déclarez un incident ou une demande avec tous les paramètres nécessaires.</p>
            </div>
            <CreateTicketForm />
        </Container>
    );
}
