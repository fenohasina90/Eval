import { useState, useEffect } from 'react'
import { searchElements, getStates, getDropdowns } from '../../services/frontOfficeService'
import {
  Button,
  Container,
  H1,
  Input,
  Select,
  Table, Thead, Tbody, Tr, Th, Td,
  Loading,
  Error,
  Card
} from '../../components'

// Options pour les sélecteurs de filtre
const typeOptions = [
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
]

export default function ElementList() {
  const [elements, setElements] = useState([])
  const [statusOptions, setStatusOptions] = useState([{ value: '', label: 'Tous les statuts' }])
  const [dropdownsMap, setDropdownsMap] = useState({ locations: {}, manufacturers: {}, models: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  
  // États de recherche
  const [criteria, setCriteria] = useState({
    text: '',
    itemtype: '',
    status: ''
  })

  // Fonction pour charger les données
  const fetchElements = async (searchParams, map = dropdownsMap) => {
    try {
      setLoading(true)
      setError(false)
      const data = await searchElements(searchParams, map)
      setElements(data)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // Chargement initial
  useEffect(() => {
    const loadInitData = async () => {
      // Charger les statuts dynamiquement
      const statesData = await getStates()
      const formattedStates = statesData.map(st => ({
        value: String(st.id),
        label: st.name || st.completename || `Statut ${st.id}`
      }))
      setStatusOptions([{ value: '', label: 'Tous les statuts' }, ...formattedStates])
      
      // Charger les dropdowns (Lieux, Fabricants, Modèles) pour l'affichage en clair
      const dds = await getDropdowns()
      const toMap = (arr) => arr.reduce((acc, curr) => { acc[curr.id] = curr.name || curr.completename; return acc; }, {})
      
      const newMap = {
        locations: toMap(dds.locations),
        manufacturers: toMap(dds.manufacturers),
        models: toMap(dds.models),
        states: formattedStates.reduce((acc, curr) => { acc[curr.value] = curr.label; return acc; }, {})
      };
      setDropdownsMap(newMap)

      // Charger les éléments
      fetchElements(criteria, newMap)
    }
    
    loadInitData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Soumission du formulaire de recherche
  const handleSearch = (e) => {
    e.preventDefault()
    fetchElements(criteria)
  }

  // Traduction du type d'actif
  const getTypeLabel = (type) => {
    const t = typeOptions.find(opt => opt.value === type)
    return t ? t.label : type
  }

  // Fonction utilitaire pour le statut (states_id)
  const getStatusLabel = (statusId) => {
    if (!statusId) return '-'
    const s = statusOptions.find(opt => opt.value === String(statusId))
    return s ? s.label : `Statut ID ${statusId}`
  }

  return (
    <Container size="7xl">
      <div className="mb-6 flex justify-between items-end">
        <H1>Mes Actifs</H1>
      </div>

      <Card className="mb-8">
        <Card.Body>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-sm font-medium text-gray-700">Recherche</label>
              <Input
                placeholder="Nom, numéro de série..."
                value={criteria.text}
                onChange={(e) => setCriteria({ ...criteria, text: e.target.value })}
              />
            </div>
            
            <div className="w-full md:w-64 space-y-2">
              <label className="text-sm font-medium text-gray-700">Type d'actif</label>
              <Select
                value={criteria.itemtype}
                onChange={(e) => setCriteria({ ...criteria, itemtype: e.target.value })}
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>

            <div className="w-full md:w-64 space-y-2">
              <label className="text-sm font-medium text-gray-700">Statut</label>
              <Select
                value={criteria.status}
                onChange={(e) => setCriteria({ ...criteria, status: e.target.value })}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>

            <Button type="submit" variant="primary" className="w-full md:w-auto">
              Rechercher
            </Button>
          </form>
        </Card.Body>
      </Card>

      {error ? (
        <Error message="Erreur lors de la récupération des éléments." />
      ) : loading ? (
        <Loading message="Recherche en cours..." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Type</Th>
              <Th>Nom</Th>
              <Th>Numéro de série</Th>
              <Th>Fabricant</Th>
              <Th>Modèle</Th>
              <Th>Lieu</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {elements.length === 0 ? (
              <Tr>
                <Td colSpan={8} className="text-center py-8 text-gray-500">
                  Aucun actif trouvé correspondant à vos critères.
                </Td>
              </Tr>
            ) : (
              elements.map(el => {
                const modelId = el.computermodels_id || el.monitormodels_id || el.printermodels_id ||
                                el.networkequipmentmodels_id || el.peripheralmodels_id || el.phonemodels_id ||
                                el.rackmodels_id || el.enclosuremodels_id || el.passivedcequipmentmodels_id ||
                                el.pdumodels_id || el.cablemodels_id || el.unmanagedmodels_id || el.appliancemodels_id;
                return (
                  <Tr key={`${el.itemtype}-${el.id}`}>
                    <Td>{el.id}</Td>
                    <Td>{getTypeLabel(el.itemtype)}</Td>
                    <Td>{el.name || '-'}</Td>
                    <Td>{el.serial || el.otherserial || '-'}</Td>
                    <Td>{dropdownsMap.manufacturers[el.manufacturers_id] || el.manufacturers_id || '-'}</Td>
                    <Td>{dropdownsMap.models[modelId] || modelId || '-'}</Td>
                    <Td>{dropdownsMap.locations[el.locations_id] || el.locations_id || '-'}</Td>
                    <Td>{getStatusLabel(el.states_id || el.status)}</Td>
                  </Tr>
                )
              })
            )}
          </Tbody>
        </Table>
      )}
    </Container>
  )
}
