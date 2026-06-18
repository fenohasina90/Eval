import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Checkbox, Input, Label, P, Table, Tbody, Td, Th, Thead, Tr, Select } from '../../components'
import { importerMouvementsCsv } from '../../services/importTicketMouvementService'

import { getAllTickets } from "../../services/ticketService";

export default function ImportStateTicket() {

  const [isLoading, setIsLoading] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [importResults, setImportResults] = useState([])
  // const [selectedMode, setSelectedMode] = useState('1') // Default mode 1

  // const modeLabels = {
  //   '1': 'Mode 1: Dernier supercout',
  //   '2': 'Mode 2: Premier supercout',
  //   '3': 'Mode 3: Moyenne des supercout',
  //   '4': 'Mode 4: Somme des supercout'
  // }

  // #region PRESHOOT
  // const [selectedTicket, setSelectedTicket] = useState('') // Stocke l'externalId
  // const [tickets, setTickets] = useState([])
  // const [ticketsLoading, setTicketsLoading] = useState(true)
  // const [ticketsError, setTicketsError] = useState(false)

  // // Récupérer les tickets au chargement du composant
  // useEffect(() => {
  //   const fetchAllTickets = async () => {
  //     try {
  //       setTicketsLoading(true)
  //       setTicketsError(false)
  //       const data = await getAllTickets()
  //       console.log('Tickets récupérés:', data)
  //       setTickets(data)
  //     } catch (error) {
  //       console.log("Erreur lors du chargement des tickets:", error)
  //       setTicketsError(true)
  //     } finally {
  //       setTicketsLoading(false)
  //     }
  //   }
  //   fetchAllTickets()
  // }, [])

  // const [rows, setRows] = useState([
  //   { refTicket: '1', mvt: 'open', valeur: '16.5', mode: '1' },
  // ])

  // // Ajouter une nouvelle ligne
  // const addRow = () => {
  //   setRows([...rows, { refTicket: '', mvt: 'open', valeur: '', mode: '1' }])
  // }

  // // Supprimer une ligne
  // const removeRow = (index) => {
  //   setRows(rows.filter((_, i) => i !== index))
  // }

  // // Mettre a jour une cellule
  // const updateRow = (index, field, value) => {
  //   const updatedRows = [...rows]
  //   updatedRows[index][field] = value
  //   setRows(updatedRows)
  // }

  // // Convertir les donnees en format CSV
  // const generateCSV = () => {
  //   const headers = ['refTicket', 'mvt', 'valeur', 'mode']
  //   const csvRows = rows.map(row =>
  //     `${row.refTicket},${row.mvt},${row.valeur || ''},${row.mode || ''}`
  //   )
  //   return [headers.join(','), ...csvRows].join('\n')
  // }

  // async function handleSubmitPreshoot(e) {
  //   e.preventDefault()

  //   // Valider que toutes les lignes ont un refTicket et mvt
  //   const invalidRows = rows.filter(row => !row.refTicket || !row.mvt)
  //   if (invalidRows.length > 0) {
  //     alert('Veuillez remplir les champs refTicket et mvt pour toutes les lignes')
  //     return
  //   }

  //   setIsLoading(true)
  //   setImportResults([])

  //   try {
  //     const csvContent = generateCSV()
  //     console.log("Ty Koa ilay iray fa tratra : " + csvContent)
  //     console.log("Mode sélectionné :", selectedMode);
  //     const results = await importerMouvementsCsv(csvContent)
  //     setImportResults(results)
  //   } catch (error) {
  //     setImportResults([{ ligne: '', success: false, error: error.message }])
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // #region FIN PRESHOOT

  // gestion selection du fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setFileContent(event.target.result)
    }
    reader.readAsText(file)
  }

  // gestion soummission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fileContent.trim()) return

    setIsLoading(true)
    setImportResults([])

    try {
      console.log("Ty lery fa tratra : " + fileContent);
      const results = await importerMouvementsCsv(fileContent)
      setImportResults(results)
    } catch (error) {
      console.error('Erreur import:', error)
      setImportResults([{ ligne: '', success: false, error: error.message || 'Erreur inconnue' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xl font-semibold text-gray-900">Import de mouvements de tickets</div>
        <P className="text-gray-600">
          Sélectionnez un fichier CSV avec les colonnes : <span className="font-mono">refTicket, mvt, valeur, mode</span>
        </P>
      </div>

      {/*<div className="space-y-2">
        <Label htmlFor="mode-select">Mode de calcul du cout de réouverture</Label>
        <Select
          id="mode-select"
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value)}
          disabled={isLoading}
        >
          <option value="1">{modeLabels['1']}</option>
          <option value="2">{modeLabels['2']}</option>
          <option value="3">{modeLabels['3']}</option>
          <option value="4">{modeLabels['4']}</option>
        </Select>
      </div>*/}



      <form className="space-y-6"
        onSubmit={handleSubmit}
      >
        <Card variant="elevated">
          <Card.Body>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-assets-file">Fichier CSV</Label>
                <Input
                  id="csv-assets-file"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </Card.Body>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading || !fileContent.trim()}>
            {isLoading ? 'Import en cours...' : 'Valider et importer'}
          </Button>
        </div>
      </form>

      {/*  #region PRESHOOT */}
      {/* <div className="text-xl font-semibold text-gray-900">Saisie Manuel</div>
      <form className="space-y-6" onSubmit={handleSubmitPreshoot}>
        <Card variant="elevated">
          <Card.Header>
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">Données à importer</div>
              <Button
                type="button"
                variant="outline"
                onClick={addRow}
                disabled={isLoading}
              >
                + Ajouter une ligne
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>refTicket</Th>
                    <Th>mvt</Th>
                    <Th>valeur</Th>
                    <Th>mode</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody> */}
                  {/* {rows.map((row, index) => (
                    <Tr key={index}>
                      <Td className="text-center">{index + 1}</Td>
                      <Td>
                        <Select
                          id={`ticket-select-${index}`}
                          value={row.refTicket}
                          onChange={(e) => updateRow(index, 'refTicket', e.target.value)}
                          disabled={isLoading || tickets.length === 0}
                        >
                          <option value="">-- Choisir un ticket --</option>
                          {tickets.map(ticket => (
                            <option
                              key={ticket.id}
                              value={ticket.external_id}
                            >
                              #{ticket.external_id} - {ticket.name}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td>
                        <Select
                          value={row.mvt}
                          onChange={(e) => updateRow(index, 'mvt', e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="open">open</option>
                          <option value="close">close</option>
                          <option value="cancel">cancel</option>
                        </Select>
                      </Td>
                      <Td>
                        <Input
                          type="text"
                          value={row.valeur}
                          onChange={(e) => updateRow(index, 'valeur', e.target.value)}
                          placeholder="ex: 16.5"
                          disabled={isLoading}
                          className="w-24"
                        />
                      </Td>
                      <Td>
                        <Select
                          value={row.mode}
                          onChange={(e) => updateRow(index, 'mode', e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="1">{modeLabels['1']}</option>
                          <option value="2">{modeLabels['2']}</option>
                          <option value="3">{modeLabels['3']}</option>
                          <option value="4">{modeLabels['4']}</option>
                        </Select>
                      </Td>
                      <Td>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeRow(index)}
                          disabled={isLoading || rows.length === 1}
                        >
                          Supprimer
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody> */}
              {/* </Table>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-1">Aperçu CSV généré :</div>
              <pre className="text-xs font-mono bg-white p-2 rounded border overflow-x-auto">
                {generateCSV()}
              </pre>
            </div>
          </Card.Body>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading || rows.length === 0}>
            {isLoading ? 'Import en cours...' : 'Valider et importer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRows([
                { refTicket: '1', mvt: 'open', valeur: '16.5', mode: '1' },
                { refTicket: '2', mvt: 'open', valeur: '5.5', mode: '2' },
                { refTicket: '2', mvt: 'close', valeur: '20' },
                { refTicket: '2', mvt: 'cancel', valeur: '', mode: '3' }
              ])
            }}
          >
            Charger l'exemple
          </Button>
        </div>
      </form> */}

      {/* #end PRESHOOT */}

      {/* Résultats de l'import */}
      {importResults.length > 0 && (
        <Card variant="elevated">
          <Card.Header>
            <div className="text-lg font-semibold">Résultats de l'import</div>
          </Card.Header>
          <Card.Body>
            <Table>
              <Thead>
                <Tr>
                  <Th>Ligne</Th>
                  <Th>Statut</Th>
                  <Th>Message</Th>
                </Tr>
              </Thead>
              <Tbody>
                {importResults.map((result, index) => (
                  <Tr key={index}>
                    <Td className="font-mono text-sm">{result.ligne}</Td>
                    <Td>
                      <Badge variant={result.success ? 'success' : 'danger'}>
                        {result.success ? 'OK' : 'Erreur'}
                      </Badge>
                    </Td>
                    <Td>{result.error || 'Importé avec succès'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
