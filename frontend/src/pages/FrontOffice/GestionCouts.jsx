import { useState, useEffect } from 'react'
import { Button, Card, Input, Label, Select, Table, Tbody, Td, Th, Thead, Tr, Modal, Loading, Alert } from '../../components'
import { superCoutService } from '../../services/superCoutService'
import { coutOuvertureService } from '../../services/coutOuvertureService'

const libellesMode = {
  '1': 'Dernier super cout',
  '2': 'Premier super cout',
  '3': 'Moyenne des super cout',
  '4': 'Somme des super cout'
}

export default function GestionCouts() {
  const [chargement, setChargement] = useState(false)
  const [superCouts, setSuperCouts] = useState([])
  const [reouvertures, setReouvertures] = useState([])
  
  // États pour les modales de modification
  const [modalSuperCoutOuverte, setModalSuperCoutOuverte] = useState(false)
  const [superCoutSelectionne, setSuperCoutSelectionne] = useState(null)
  const [nouvelleValeurSuperCout, setNouvelleValeurSuperCout] = useState('')

  const [modalReouvertureOuverte, setModalReouvertureOuverte] = useState(false)
  const [reouvertureSelectionnee, setReouvertureSelectionnee] = useState(null)
  const [nouveauPourcentage, setNouveauPourcentage] = useState('')
  const [nouveauMode, setNouveauMode] = useState('1')
  const [nouveauSuperCoutInitial, setNouveauSuperCoutInitial] = useState('')

  const chargerDonnees = async () => {
    setChargement(true)
    try {
      const [sc, ro] = await Promise.all([
        superCoutService.getAll(),
        coutOuvertureService.getAll()
      ])
      setSuperCouts(sc)
      setReouvertures(ro)
    } catch (erreur) {
      console.error('Erreur lors du chargement des données:', erreur)
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [])

  const ouvrirModalSuperCout = (superCout) => {
    setSuperCoutSelectionne(superCout)
    setNouvelleValeurSuperCout(superCout.cout.toString())
    setModalSuperCoutOuverte(true)
  }

  const modifierSuperCout = async () => {
    if (!superCoutSelectionne || !nouvelleValeurSuperCout) return
    try {
      await superCoutService.update(superCoutSelectionne.id, parseFloat(nouvelleValeurSuperCout))
      await chargerDonnees()
      setModalSuperCoutOuverte(false)
    } catch (erreur) {
      console.error('Erreur lors de la modification du super cout:', erreur)
    }
  }

  const ouvrirModalReouverture = (reouverture) => {
    setReouvertureSelectionnee(reouverture)
    setNouveauPourcentage(reouverture.pourcentage.toString())
    setNouveauMode('1')
    setNouveauSuperCoutInitial(reouverture.superCoutInitial?.toString() || '')
    setModalReouvertureOuverte(true)
  }

  const modifierReouverture = async () => {
    if (!reouvertureSelectionnee || !nouveauPourcentage) return
    try {
      await coutOuvertureService.update(
        reouvertureSelectionnee.id,
        parseFloat(nouveauPourcentage),
        nouveauMode,
        nouveauSuperCoutInitial ? parseFloat(nouveauSuperCoutInitial) : null
      )
      await chargerDonnees()
      setModalReouvertureOuverte(false)
    } catch (erreur) {
      console.error('Erreur lors de la modification de la réouverture:', erreur)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des coûts</h1>
        <Button onClick={chargerDonnees} disabled={chargement}>
          Rafraîchir les données
        </Button>
      </div>

      {chargement && <Loading message="Chargement des données..." />}

      {/* Section des réouvertures */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Liste des réouvertures</h2>
        </Card.Header>
        <Card.Body>
          {reouvertures.length === 0 ? (
            <Alert variant="info">Aucune réouverture enregistrée</Alert>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Ticket ID</Th>
                  <Th>Pourcentage (%)</Th>
                  <Th>Super cout initial</Th>
                  <Th>Coût d'ouverture</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {reouvertures.map((ro) => (
                  <Tr key={ro.id}>
                    <Td className="font-mono">{ro.id}</Td>
                    <Td className="font-mono">{ro.ticketId}</Td>
                    <Td>{ro.pourcentage}%</Td>
                    <Td>{ro.superCoutInitial} €</Td>
                    <Td>{ro.coutOuverture.toFixed(3)} €</Td>
                    <Td>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => ouvrirModalReouverture(ro)}
                      >
                        Modifier
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Section des super couts */}
      <Card variant="elevated">
        <Card.Header>
          <h2 className="text-xl font-semibold text-gray-900">Liste des super couts</h2>
        </Card.Header>
        <Card.Body>
          {superCouts.length === 0 ? (
            <Alert variant="info">Aucun super cout enregistré</Alert>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Ticket ID</Th>
                  <Th>Valeur du super cout</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {superCouts.map((sc) => (
                  <Tr key={sc.id}>
                    <Td className="font-mono">{sc.id}</Td>
                    <Td className="font-mono">{sc.ticketId}</Td>
                    <Td>{sc.cout} €</Td>
                    <Td>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => ouvrirModalSuperCout(sc)}
                      >
                        Modifier
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal pour modifier un super cout */}
      <Modal
        isOpen={modalSuperCoutOuverte}
        onClose={() => setModalSuperCoutOuverte(false)}
        title="Modifier le super cout"
        className="max-w-md"
      >
        <div className="space-y-4">
          {superCoutSelectionne && (
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">ID du super cout: <span className="font-mono">{superCoutSelectionne.id}</span></p>
                <p className="text-sm text-gray-600">Ticket associé: <span className="font-mono">{superCoutSelectionne.ticketId}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nouvelle-valeur-supercout">Nouvelle valeur du super cout</Label>
                <Input
                  id="nouvelle-valeur-supercout"
                  type="number"
                  step="0.01"
                  value={nouvelleValeurSuperCout}
                  onChange={(e) => setNouvelleValeurSuperCout(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setModalSuperCoutOuverte(false)}>Annuler</Button>
                <Button onClick={modifierSuperCout}>Enregistrer et recalculer</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal pour modifier une réouverture */}
      <Modal
        isOpen={modalReouvertureOuverte}
        onClose={() => setModalReouvertureOuverte(false)}
        title="Modifier la réouverture"
        className="max-w-md"
      >
        <div className="space-y-4">
          {reouvertureSelectionnee && (
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">ID de la réouverture: <span className="font-mono">{reouvertureSelectionnee.id}</span></p>
                <p className="text-sm text-gray-600">Ticket associé: <span className="font-mono">{reouvertureSelectionnee.ticketId}</span></p>
                <p className="text-sm text-gray-600">Coût d'ouverture actuel: <span className="font-semibold">{reouvertureSelectionnee.coutOuverture.toFixed(3)} €</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nouveau-pourcentage">Nouveau pourcentage (%)</Label>
                <Input
                  id="nouveau-pourcentage"
                  type="number"
                  step="0.01"
                  value={nouveauPourcentage}
                  onChange={(e) => setNouveauPourcentage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nouveau-mode">Mode de calcul</Label>
                <Select
                  id="nouveau-mode"
                  value={nouveauMode}
                  onChange={(e) => setNouveauMode(e.target.value)}
                >
                  {Object.entries(libellesMode).map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>{libelle}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nouveau-supercout-initial">
                  Super cout initial (optionnel, si pas de super couts enregistrés)
                </Label>
                <Input
                  id="nouveau-supercout-initial"
                  type="number"
                  step="0.01"
                  value={nouveauSuperCoutInitial}
                  onChange={(e) => setNouveauSuperCoutInitial(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setModalReouvertureOuverte(false)}>Annuler</Button>
                <Button onClick={modifierReouverture}>Enregistrer et recalculer</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
