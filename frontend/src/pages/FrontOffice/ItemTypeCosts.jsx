import { useState, useEffect } from 'react'
import {
  Button,
  Container,
  H1,
  H2,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Loading,
  Error,
} from '../../components'
import { aggregateItemTypeCosts, recupererDetailsParItemType, recupererHistoriqueProduit } from '../../services/itemCostService'

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

function formatDateString(date) {
  if (!date) return 'Date inconnue'
  try {
    return new Date(date).toLocaleString('fr-FR')
  } catch {
    return 'Date invalide'
  }
}

function getTypeLabel(type) {
  return typeLabels[type] || type
}

export default function ItemTypeCosts() {
  const [itemTypeCosts, setItemTypeCosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [typeSelectionne, setTypeSelectionne] = useState(null)
  const [detailsProduits, setDetailsProduits] = useState([])
  const [chargementDetails, setChargementDetails] = useState(false)
  const [produitSelectionne, setProduitSelectionne] = useState(null)
  const [historiqueProduit, setHistoriqueProduit] = useState([])
  const [chargementHistorique, setChargementHistorique] = useState(false)

  const loadCostData = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await aggregateItemTypeCosts()
      setItemTypeCosts(data)
      setLastUpdate(new Date())
      setTypeSelectionne(null)
      setProduitSelectionne(null)
    } catch (err) {
      console.error('Error loading cost data:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const afficherDetails = async (itemType) => {
    if (typeSelectionne === itemType) {
      setTypeSelectionne(null)
      setDetailsProduits([])
      setProduitSelectionne(null)
      return
    }
    setTypeSelectionne(itemType)
    setChargementDetails(true)
    try {
      const details = await recupererDetailsParItemType(itemType)
      setDetailsProduits(details)
    } catch (err) {
      console.error('Erreur chargement détails:', err)
    } finally {
      setChargementDetails(false)
    }
  }

  const afficherHistorique = async (produit) => {
    if (produitSelectionne?.itemId === produit.itemId && produitSelectionne?.itemType === produit.itemType) {
      setProduitSelectionne(null)
      setHistoriqueProduit([])
      return
    }
    setProduitSelectionne(produit)
    setChargementHistorique(true)
    try {
      const historique = await recupererHistoriqueProduit(produit.itemType, produit.itemId)
      setHistoriqueProduit(historique)
    } catch (err) {
      console.error('Erreur chargement historique:', err)
    } finally {
      setChargementHistorique(false)
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
        <>
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
                itemTypeCosts.map((item, index) => (
                  <Tr
                    key={item.itemType || index}
                    onClick={() => afficherDetails(item.itemType)}
                    style={{ cursor: 'pointer', background: typeSelectionne === item.itemType ? '#e0f0ff' : 'white' }}
                  >
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
                ))
              )}
            </Tbody>
            <tfoot>
              <Tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                <Td>Total Général</Td>
                <Td>
                  {formatCurrency(itemTypeCosts.reduce((sum, item) => sum + (item.sumCout || 0), 0))}
                </Td>
                <Td>
                  {formatCurrency(itemTypeCosts.reduce((sum, item) => sum + (item.sumSuperCout || 0), 0))}
                </Td>
                <Td>
                  {formatCurrency(itemTypeCosts.reduce((sum, item) => sum + (item.sumCoutOuverture || 0), 0))}
                </Td>
                <Td>
                  {formatCurrency(itemTypeCosts.reduce((sum, item) => sum + (item.sumTotal || 0), 0))}
                </Td>
              </Tr>
            </tfoot>
          </Table>

          {typeSelectionne && (
            <div style={{ marginTop: '2rem' }}>
              <H1>Détails : {getTypeLabel(typeSelectionne)}</H1>
              {chargementDetails ? (
                <Loading message="Chargement des détails..." />
              ) : (
                <>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Produit</Th>
                        <Th>Somme Cout</Th>
                        <Th>Somme superCout</Th>
                        <Th>Somme cout ouverture</Th>
                        <Th>Somme Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {detailsProduits.length === 0 ? (
                        <Tr>
                          <Td colSpan={5}>Aucun produit pour ce type</Td>
                        </Tr>
                      ) : (
                        detailsProduits.map((produit, i) => (
                          <Tr
                            key={i}
                            onClick={() => afficherHistorique(produit)}
                            style={{
                              cursor: 'pointer',
                              background: produitSelectionne?.itemId === produit.itemId && produitSelectionne?.itemType === produit.itemType
                                ? '#e8f5e9'
                                : 'white'
                            }}
                          >
                            <Td>{produit.nom}</Td>
                            <Td>{formatCurrency(produit.sumCout)}</Td>
                            <Td>{formatCurrency(produit.sumSuperCout)}</Td>
                            <Td>{formatCurrency(produit.sumCoutOuverture)}</Td>
                            <Td>{formatCurrency(produit.sumTotal)}</Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>

                  {produitSelectionne && (
                    <div style={{ marginTop: '2rem' }}>
                      <H2>Historique : {produitSelectionne.nom}</H2>
                      {chargementHistorique ? (
                        <Loading message="Chargement de l'historique..." />
                      ) : (
                        <Table>
                          <Thead>
                            <Tr>
                              <Th>Date</Th>
                              <Th>Type</Th>
                              <Th>Valeur</Th>
                              <Th>Montant</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {historiqueProduit.length === 0 ? (
                              <Tr>
                                <Td colSpan={4}>Aucun historique pour ce produit</Td>
                              </Tr>
                            ) : (
                              historiqueProduit.map((entry, i) => (
                                <Tr key={entry.id || i}>
                                  <Td>{formatDateString(entry.date)}</Td>
                                  <Td>{entry.type}</Td>
                                  <Td>{entry.valeur || '-'}</Td>
                                  <Td>{formatCurrency(entry.montant)}</Td>
                                </Tr>
                              ))
                            )}
                          </Tbody>
                        </Table>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </Container>
  )
}
