import { useState, useEffect } from 'react'
import {
  Button,
  Container,
  H1,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Loading,
  Error
} from '../../components'
import { aggregateItemTypeCosts } from '../../services/itemCostService'

const typeLabels = {
  'Computer': 'Ordinateurs',
  'Monitor': 'Écrans',
  'Printer': 'Imprimantes',
  'Peripheral': 'Périphériques',
  'Phone': 'Téléphones',
  'NetworkEquipment': 'Matériel réseau',
  'Unknown': 'Inconnu'
}

function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return '0,00 €'
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €'
}

function getTypeLabel(type) {
  return typeLabels[type] || type
}

export default function ItemTypeCosts() {
  const [itemTypeCosts, setItemTypeCosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const loadCostData = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await aggregateItemTypeCosts()
      setItemTypeCosts(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading cost data:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCostData()
  }, [])

  return (
    <Container>
      <div>
        <H1>Coûts par Type d'Actif</H1>
        {lastUpdate && (
          <p>
            Dernière mise à jour: {lastUpdate.toLocaleString('fr-FR')}
          </p>
        )}
        <Button onClick={loadCostData} disabled={loading}>
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </Button>
      </div>

      {error ? (
        <Error message="Erreur lors de la récupération des données de coûts." />
      ) : loading ? (
        <Loading message="Chargement des données de coûts..." />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Somme Cout</Th>
              <Th>Somme superCout</Th>
              <Th>Somme cout ouverture</Th>
              <Th>Somme Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {itemTypeCosts.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  Aucune donnée de coût disponible. Veuillez d'abord importer des coûts.
                </Td>
              </Tr>
            ) : (
              itemTypeCosts.map((item, index) => {
                return (
                  <Tr key={item.itemType || index}>
                    <Td>
                      <div>
                        <span>{getTypeLabel(item.itemType)}</span>
                      </div>
                    </Td>
                    <Td>{formatCurrency(item.sumCout || 0)}</Td>
                    <Td>{formatCurrency(item.sumSuperCout || 0)}</Td>
                    <Td>{formatCurrency(item.sumCoutOuverture || 0)}</Td>
                    <Td>{formatCurrency(item.sumTotal || 0)}</Td>
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
