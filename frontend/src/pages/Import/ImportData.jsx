import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Input, Label, P, Table, Tbody, Td, Th, Thead, Tr } from '../../components'
import { importAssetsFromRows, parseCsvText, REQUIRED_COLUMNS } from '../../services/importDataService'
import { importTicketsFromRows, REQUIRED_TICKET_COLUMNS } from '../../services/importTicketCsvService'

function computeStats(results) {
  const total = results.length
  const created = results.filter((r) => r.status === 'created').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const failed = results.filter((r) => r.status === 'error').length
  return { total, created, skipped, failed }
}

function ProgressBar({ progress }) {
  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          {progress.done}/{progress.total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gray-900" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ResultsTable({ results }) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>#</Th>
          <Th>ItemType</Th>
          <Th>Nom</Th>
          <Th>Résultat</Th>
          <Th>Détail</Th>
        </Tr>
      </Thead>
      <Tbody>
        {results.map((r) => (
          <Tr key={`${r.index}-${r.name}-${r.itemType}`}>
            <Td>{r.index}</Td>
            <Td>{r.itemType}</Td>
            <Td>{r.name}</Td>
            <Td>
              {r.status === 'created' && <span className="text-green-700">Créé</span>}
              {r.status === 'skipped' && <span className="text-yellow-700">Ignoré</span>}
              {r.status === 'error' && <span className="text-red-700">Erreur</span>}
            </Td>
            <Td className="font-mono text-xs">{r.message}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

export default function ImportData() {
  const [assetFile, setAssetFile] = useState(null)
  const [assetRows, setAssetRows] = useState([])
  const [assetError, setAssetError] = useState('')
  const [isAssetParsing, setIsAssetParsing] = useState(false)
  const [isAssetImporting, setIsAssetImporting] = useState(false)
  const [assetProgress, setAssetProgress] = useState({ done: 0, total: 0 })
  const [assetResults, setAssetResults] = useState([])

  const [ticketFile, setTicketFile] = useState(null)
  const [ticketRows, setTicketRows] = useState([])
  const [ticketError, setTicketError] = useState('')
  const [isTicketParsing, setIsTicketParsing] = useState(false)
  const [isTicketImporting, setIsTicketImporting] = useState(false)
  const [ticketProgress, setTicketProgress] = useState({ done: 0, total: 0 })
  const [ticketResults, setTicketResults] = useState([])

  const hasAssetRows = assetRows.length > 0
  const hasTicketRows = ticketRows.length > 0

  const requiredAssetColumns = REQUIRED_COLUMNS
  const requiredTicketColumns = REQUIRED_TICKET_COLUMNS

  async function onPickAssetFile(e) {
    const selected = e.target.files?.[0] ?? null
    setAssetFile(selected)
    setAssetRows([])
    setAssetResults([])
    setAssetProgress({ done: 0, total: 0 })
    setAssetError('')

    if (!selected) return

    setIsAssetParsing(true)
    try {
      const text = await selected.text()
      const parsed = parseCsvText(text)
      if (parsed.length === 0) {
        setAssetError('Fichier CSV vide ou illisible.')
        return
      }

      const first = parsed[0] || {}
      const missing = requiredAssetColumns.filter((col) => !(col in first))
      if (missing.length > 0) {
        setAssetError(`Colonnes manquantes: ${missing.join(', ')}`)
        return
      }

      setAssetRows(parsed)
    } catch (err) {
      setAssetError(err?.message || 'Erreur lors de la lecture du fichier.')
    } finally {
      setIsAssetParsing(false)
    }
  }

  async function onImportAssets(e) {
    e.preventDefault()
    if (!hasAssetRows || isAssetImporting) return

    setIsAssetImporting(true)
    setAssetError('')
    setAssetResults([])
    setAssetProgress({ done: 0, total: assetRows.length })

    try {
      const out = await importAssetsFromRows(assetRows, {
        onProgress: ({ done, total }) => setAssetProgress({ done, total }),
        onResults: (partial) => setAssetResults(partial),
      })
      setAssetResults(out)
    } catch (err) {
      setAssetError(err?.message || 'Erreur lors de la préparation de l’import.')
    } finally {
      setIsAssetImporting(false)
    }
  }

  async function onImportAll(e) {
    e.preventDefault()
    if ((!hasAssetRows && !hasTicketRows) || isAssetImporting || isTicketImporting) return

    if (hasAssetRows) {
      await onImportAssets(e)
    }

    if (hasTicketRows) {
      await onImportTickets(e)
    }
  }

  async function onPickTicketFile(e) {
    const selected = e.target.files?.[0] ?? null
    setTicketFile(selected)
    setTicketRows([])
    setTicketResults([])
    setTicketProgress({ done: 0, total: 0 })
    setTicketError('')

    if (!selected) return

    setIsTicketParsing(true)
    try {
      const text = await selected.text()
      const parsed = parseCsvText(text)
      if (parsed.length === 0) {
        setTicketError('Fichier CSV vide ou illisible.')
        return
      }

      const first = parsed[0] || {}
      const missing = requiredTicketColumns.filter((col) => !(col in first))
      if (missing.length > 0) {
        setTicketError(`Colonnes manquantes: ${missing.join(', ')}`)
        return
      }

      setTicketRows(parsed)
    } catch (err) {
      setTicketError(err?.message || 'Erreur lors de la lecture du fichier.')
    } finally {
      setIsTicketParsing(false)
    }
  }

  async function onImportTickets(e) {
    e.preventDefault()
    if (!hasTicketRows || isTicketImporting) return

    setIsTicketImporting(true)
    setTicketError('')
    setTicketResults([])
    setTicketProgress({ done: 0, total: ticketRows.length })

    try {
      const out = await importTicketsFromRows(ticketRows, {
        assetRows,
        onProgress: ({ done, total }) => setTicketProgress({ done, total }),
        onResults: (partial) => setTicketResults(partial),
      })
      setTicketResults(out)
    } catch (err) {
      setTicketError(err?.message || 'Erreur lors de la préparation de l’import.')
    } finally {
      setIsTicketImporting(false)
    }
  }

  const assetStats = useMemo(() => computeStats(assetResults), [assetResults])
  const ticketStats = useMemo(() => computeStats(ticketResults), [ticketResults])
  const isBusy = isAssetParsing || isTicketParsing || isAssetImporting || isTicketImporting
  const canSubmit = !isBusy && (hasAssetRows || hasTicketRows)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xl font-semibold text-gray-900">Import de données</div>
        <P className="text-gray-600">
          Sélectionnez un fichier CSV (exemple: <span className="font-mono">import/fichier1.csv</span>).
        </P>
      </div>

      <form className="space-y-6" onSubmit={onImportAll}>
        <Card variant="elevated">
          <Card.Body>
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-assets-file">Fichier CSV (actifs)</Label>
              <Input
                id="csv-assets-file"
                type="file"
                accept=".csv,text/csv"
                onChange={onPickAssetFile}
                disabled={isBusy}
              />
              {assetFile && (
                <div className="text-xs text-gray-500">
                  {assetFile.name} ({Math.round(assetFile.size / 1024)} KB)
                </div>
              )}
              {hasAssetRows && (
                <div className="text-sm text-gray-600">
                  {assetRows.length} lignes prêtes à importer
                </div>
              )}
            </div>

            {assetError && <Alert variant="danger">{assetError}</Alert>}

            {(isAssetImporting || assetProgress.done > 0) && <ProgressBar progress={assetProgress} />}
            </div>
          </Card.Body>
        </Card>

      <Card variant="elevated">
        <Card.Body>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-tickets-file">Fichier CSV (tickets)</Label>
              <Input
                id="csv-tickets-file"
                type="file"
                accept=".csv,text/csv"
                onChange={onPickTicketFile}
                disabled={isBusy}
              />
              {ticketFile && (
                <div className="text-xs text-gray-500">
                  {ticketFile.name} ({Math.round(ticketFile.size / 1024)} KB)
                </div>
              )}
              <div className="text-xs text-gray-500">
                Exemple: <span className="font-mono">import/fichier2.csv</span>
              </div>
              {hasTicketRows && (
                <div className="text-sm text-gray-600">
                  {ticketRows.length} lignes prêtes à importer
                </div>
              )}
            </div>

            {ticketError && <Alert variant="danger">{ticketError}</Alert>}

            {(isTicketImporting || ticketProgress.done > 0) && <ProgressBar progress={ticketProgress} />}
          </div>
        </Card.Body>
      </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit}>
            Valider et importer
          </Button>
          {!canSubmit && !isBusy && (
            <div className="text-sm text-gray-600">Sélectionnez au moins un fichier CSV valide.</div>
          )}
        </div>
      </form>

      {assetStats.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Créés: {assetStats.created}</Badge>
          <Badge variant="warning">Ignorés: {assetStats.skipped}</Badge>
          <Badge variant="danger">Erreurs: {assetStats.failed}</Badge>
          <Badge variant="default">Total: {assetStats.total}</Badge>
        </div>
      )}

      {assetResults.length > 0 && <ResultsTable results={assetResults} />}

      {ticketStats.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Créés: {ticketStats.created}</Badge>
          <Badge variant="warning">Ignorés: {ticketStats.skipped}</Badge>
          <Badge variant="danger">Erreurs: {ticketStats.failed}</Badge>
          <Badge variant="default">Total: {ticketStats.total}</Badge>
        </div>
      )}

      {ticketResults.length > 0 && <ResultsTable results={ticketResults} />}
    </div>
  )
}
