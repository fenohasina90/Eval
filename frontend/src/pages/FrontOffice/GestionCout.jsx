import { useState, useEffect } from 'react'
import { Button, Table, Thead, Tbody, Tr, Th, Td, Modal, Input, Label, Select } from '../../components'
import { superCoutService } from '../../services/superCoutService'
import { coutOuvertureService } from '../../services/coutOuvertureService'
import backendApi from '../../services/backend-api'
import { configurationService } from '../../services/ConfigService'
import { updateTicketStatus } from '../../services/frontOfficeKanbanTicketService'

const labelMode = {
  '1': 'Mode 1',
  '2': 'Mode 2',
  '3': 'Mode 3',
  '4': 'Mode 4',
}

export default function GestionCout() {
  const [chargement, setChargement] = useState(false)
  const [supercouts, setSuperCouts] = useState([])
  const [reouvertures, setReouverture] = useState([])
  const [annulations, setAnnulations] = useState([]);
  const [plafond, setPlafond] = useState('20')

  // États modales
  const [modalSc, setModalSc] = useState(false)
  const [scSelectionne, setScSelectionne] = useState(null)
  const [valSc, setValSc] = useState('')

  const [modalRo, setModalRo] = useState(false)
  const [roSelectionne, setRoSelectionne] = useState(null)
  const [valPourcentage, setValPourcentage] = useState('')
  const [valMode, setValMode] = useState('1')
  const [valScIni, setValScIni] = useState('')


  const chargerDonnees = async () => {
    setChargement(true)
    try {
      const [sc, ro, plafondData, annulationsResponse] = await Promise.all([
        superCoutService.getAll(),
        coutOuvertureService.getAll(),
        configurationService.getPlafondReouverture(),
        backendApi.get('/api/ticket-history/annulations')
      ])
      console.log('Annulations response:', annulationsResponse)
      setSuperCouts(sc)
      setReouverture(ro)
      setPlafond(plafondData.valeur)
      setAnnulations(annulationsResponse.data)

      console.log('Annulations state after set:', annulationsResponse.data);
      
    } catch (error) {
      console.error('Erreur Be mits')
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    chargerDonnees()
  }, [])

  const ouvrirModalSc = (sc) => {
    setScSelectionne(sc)
    setValSc(sc.cout.toString())
    setModalSc(true)
  }

  const modifierSc = async () => {
    if (!scSelectionne) return
    await superCoutService.update(scSelectionne.id, parseFloat(valSc))
    await chargerDonnees()
    setModalSc(false)
  }

  const ouvrirModalRo = (ro) => {
    setRoSelectionne(ro)
    setValPourcentage(ro.pourcentage.toString())
    setValMode(ro.mode || '1')
    setValScIni(ro.superCoutInitial?.toString() || '')
    setModalRo(true)
  }

  const modifierRo = async () => {
    if (!roSelectionne) return
    await coutOuvertureService.update(
      roSelectionne.id,
      parseFloat(valPourcentage),
      valMode,
      valScIni ? parseFloat(valScIni) : null
    )
    await chargerDonnees()
    setModalRo(false)
  }

  const restaurerAnnulation = async (id) => {
      try {
        // Find the annulation object in our state
        const annulation = annulations.find(an => an.id === id)
        console.log('Annulation object:', annulation)
        if (!annulation) return

        // First restore the backend changes
        await backendApi.post(`/api/ticket-history/restaurer-annulation/${id}`)
        
        // Then update the ticket's status back to oldStatus
        console.log('Old status:', annulation.oldStatus)
        console.log('New status:', annulation.newStatus)
        if (annulation.oldStatus != null) {
          console.log('Updating ticket status to:', annulation.oldStatus)
          await updateTicketStatus(annulation.ticketId, annulation.oldStatus, {}, annulation.newStatus)
        } else {
          console.warn('No oldStatus found!')
        }
        
        // Refresh all data
        await chargerDonnees()
      } catch (error) {
        console.error('Erreur restauration annulation:', error)
      }
  }

  const modifierPlafond = async () => {
      try {
        await configurationService.setPlafondReouverture(parseFloat(plafond))
        await chargerDonnees()
      } catch (error) {
        console.error('Erreur modification plafond:', error)
      }
  }

  return (
    <div>
      <Button onClick={chargerDonnees} disabled={chargement}>
        Charger Donnee
      </Button>

      <div>
        <Label htmlFor="plafond">Plafond reouverture</Label>

        <Input
          id="plafond"
          type="number"
          value={plafond}
          onChange={(e)=> setPlafond(e.target.value)}
        />

        <Button onClick={modifierPlafond}>Enregistre Plafond</Button>
      </div>
      <h1>Cout ouverture</h1>
      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Ticket ID</Th>
            <Th>Pourcentage</Th>
            <Th>Mode</Th>
            <Th>SuperCout Initial</Th>
            <Th>Cout Ouverture</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Array.isArray(reouvertures) && reouvertures.map((ro) => (
            <Tr key={ro.id}>
              <Td>{ro.id}</Td>
              <Td>{ro.ticketId}</Td>
              <Td>{ro.pourcentage}</Td>
              <Td>{ro.mode}</Td>
              <Td>{ro.superCoutInitial}</Td>
              <Td>{ro.coutOuverture}</Td>
              <Td>
                <Button onClick={() => ouvrirModalRo(ro)}>Modifier</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <h1>SuperCout</h1>
      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Ticket ID</Th>
            <Th>Valeur</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Array.isArray(supercouts) && supercouts.map((sc) => (
            <Tr key={sc.id}>
              <Td>{sc.id}</Td>
              <Td>{sc.ticketId}</Td>
              <Td>{sc.cout}</Td>
              <Td>
                <Button onClick={() => ouvrirModalSc(sc)}>Modifier</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <h1>Annulation</h1>
      <Table>
        <Thead>
          <Tr>
            <Th>ID</Th>
            <Th>Ticket ID</Th>
            <Th>Statut ancien</Th>
            <Th>Statut actuel</Th>
            <Th>Super Cout annulee</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Array.isArray(annulations) && annulations.map((an) => (
            <Tr key={an.id}>
              <Td>{an.id}</Td>
              <Td>{an.ticketId}</Td>
              <Td>{an.oldStatus}</Td>
              <Td>{an.newStatus}</Td>
              <Td>{an.superCout}</Td>
              <Td>
                <Button onClick={() => restaurerAnnulation(an.id)}>Restaurer</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Modal SuperCout */}
      <Modal isOpen={modalSc} onClose={() => setModalSc(false)} title="Modifier SuperCout">
        {scSelectionne && (
          <div>
            <Label>Valeur:</Label>
            <Input type="number" value={valSc} onChange={(e) => setValSc(e.target.value)} />
            <div style={{ marginTop: '1rem' }}>
              <Button onClick={() => setModalSc(false)}>Annuler</Button>
              <Button onClick={modifierSc} style={{ marginLeft: '0.5rem' }}>Enregistrer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Reouverture */}
      <Modal isOpen={modalRo} onClose={() => setModalRo(false)} title="Modifier Reouverture">
        {roSelectionne && (
          <div>
            <Label>Pourcentage:</Label>
            <Input type="number" value={valPourcentage} onChange={(e) => setValPourcentage(e.target.value)} />

            <Label style={{ marginTop: '1rem' }}>Mode:</Label>
            <Select value={valMode} onChange={(e) => setValMode(e.target.value)}>
              {Object.entries(labelMode).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>

            <Label style={{ marginTop: '1rem' }}>SuperCout Initial (optionnel):</Label>
            <Input type="number" value={valScIni} onChange={(e) => setValScIni(e.target.value)} />

            <div style={{ marginTop: '1rem' }}>
              <Button onClick={() => setModalRo(false)}>Annuler</Button>
              <Button onClick={modifierRo} style={{ marginLeft: '0.5rem' }}>Enregistrer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
