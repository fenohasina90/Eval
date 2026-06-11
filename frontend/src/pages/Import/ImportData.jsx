import { useCallback, useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Checkbox, Input, Label, P, Table, Tbody, Td, Th, Thead, Tr } from '../../components'
import { importAssetsFromRows, parseCsvText, REQUIRED_COLUMNS } from '../../services/importDataService'
import { importTicketsFromRows, REQUIRED_TICKET_COLUMNS } from '../../services/importTicketCsvService'
import { importTicketCostsFromRows, REQUIRED_TICKET_COST_COLUMNS } from '../../services/importTicketCostsCsvService'
import { importZipImages } from '../../services/importZipImagesService'
import { getKanbanCustomization } from '../../services/frontOfficeKanbanTicketService'

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
          <Th>Nom / Fichier</Th>
          <Th>Résultat</Th>
          <Th>Détail</Th>
        </Tr>
      </Thead>
      <Tbody>
        {results.map((r, idx) => {
          const key = r.index !== undefined ? `${r.index}-${r.name}-${r.itemType}` : `zip-${idx}-${r.filename}`;
          return (
            <Tr key={key}>
              <Td>{r.index !== undefined ? r.index : idx + 1}</Td>
              <Td>{r.itemType || 'Image (ZIP)'}</Td>
              <Td>{r.name || r.filename}</Td>
              <Td>
                {r.status === 'created' && <span className="text-green-700">Créé/Lié</span>}
                {r.status === 'skipped' && <span className="text-yellow-700">Ignoré</span>}
                {r.status === 'error' && <span className="text-red-700">Erreur</span>}
              </Td>
              <Td className="font-mono text-xs">{r.message}</Td>
            </Tr>
          )
        })}
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

  const [costFile, setCostFile] = useState(null)
  const [costRows, setCostRows] = useState([])
  const [costError, setCostError] = useState('')
  const [isCostParsing, setIsCostParsing] = useState(false)
  const [isCostImporting, setIsCostImporting] = useState(false)
  const [costProgress, setCostProgress] = useState({ done: 0, total: 0 })
  const [costResults, setCostResults] = useState([])

  const [zipFile, setZipFile] = useState(null)
  const [zipError, setZipError] = useState('')
  const [isZipImporting, setIsZipImporting] = useState(false)
  const [zipProgress, setZipProgress] = useState({ done: 0, total: 0 })
  const [zipResults, setZipResults] = useState([])

  const [isZipRequired, setIsZipRequired] = useState(false)

  const hasAssetRows = assetRows.length > 0
  const hasTicketRows = ticketRows.length > 0
  const hasCostRows = costRows.length > 0
  const hasZipFile = zipFile !== null

  const requiredAssetColumns = REQUIRED_COLUMNS
  const requiredTicketColumns = REQUIRED_TICKET_COLUMNS
  const requiredCostColumns = REQUIRED_TICKET_COST_COLUMNS

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
    if ((!hasAssetRows && !hasTicketRows && !hasCostRows) || isAssetImporting || isTicketImporting || isCostImporting) return

    if (hasAssetRows) {
      await onImportAssets(e)
    }

    if (hasTicketRows) {
      await fetchAndImportTickets()
    }

    if (hasCostRows) {
      await onImportCosts(e)
    }

    if (hasZipFile) {
      await onImportZip(e)
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

  const fetchAndImportTickets = useCallback(async () => {
    if (!hasTicketRows || isTicketImporting) return

    setIsTicketImporting(true)
    setTicketError('')
    setTicketResults([])
    setTicketProgress({ done: 0, total: ticketRows.length })

    try {
      const customization = await getKanbanCustomization()
      const out = await importTicketsFromRows(ticketRows, {
        assetRows,
        customization,
        onProgress: ({ done, total }) => setTicketProgress({ done, total }),
        onResults: (partial) => setTicketResults(partial),
      })
      setTicketResults(out)
    } catch (err) {
      setTicketError(err?.message || 'Erreur lors de la préparation de l’import.')
    } finally {
      setIsTicketImporting(false)
    }
  }, [hasTicketRows, isTicketImporting, ticketRows, assetRows])

  async function onImportTickets(e) {
    e.preventDefault()
    await fetchAndImportTickets()
  }

  async function onPickCostFile(e) {
    const selected = e.target.files?.[0] ?? null
    setCostFile(selected)
    setCostRows([])
    setCostResults([])
    setCostProgress({ done: 0, total: 0 })
    setCostError('')

    if (!selected) return

    setIsCostParsing(true)
    try {
      const text = await selected.text()
      const parsed = parseCsvText(text)
      if (parsed.length === 0) {
        setCostError('Fichier CSV vide ou illisible.')
        return
      }

      const first = parsed[0] || {}
      const missing = requiredCostColumns.filter((col) => !(col in first))
      if (missing.length > 0) {
        setCostError(`Colonnes manquantes: ${missing.join(', ')}`)
        return
      }

      setCostRows(parsed)
    } catch (err) {
      setCostError(err?.message || 'Erreur lors de la lecture du fichier.')
    } finally {
      setIsCostParsing(false)
    }
  }

  async function onImportCosts(e) {
    e.preventDefault()
    if (!hasCostRows || isCostImporting) return

    setIsCostImporting(true)
    setCostError('')
    setCostResults([])
    setCostProgress({ done: 0, total: costRows.length })

    try {
      const out = await importTicketCostsFromRows(costRows, {
        onProgress: ({ done, total }) => setCostProgress({ done, total }),
        onResults: (partial) => setCostResults(partial),
      })
      setCostResults(out)
    } catch (err) {
      setCostError(err?.message || 'Erreur lors de la préparation de l’import.')
    } finally {
      setIsCostImporting(false)
    }
  }

  function onPickZipFile(e) {
    const selected = e.target.files?.[0] ?? null
    setZipFile(selected)
    setZipResults([])
    setZipProgress({ done: 0, total: 0 })
    setZipError('')
  }

  async function onImportZip(e) {
    e.preventDefault()
    if (!hasZipFile || isZipImporting) return

    setIsZipImporting(true)
    setZipError('')
    setZipResults([])
    setZipProgress({ done: 0, total: 0 }) // Le total sera calculé après lecture du ZIP

    try {
      const out = await importZipImages(zipFile, {
        onProgress: ({ done, total }) => setZipProgress({ done, total }),
        onResults: (partial) => setZipResults(partial),
      })
      setZipResults(out)
    } catch (err) {
      setZipError(err?.message || "Erreur lors de l'import du ZIP.")
    } finally {
      setIsZipImporting(false)
    }
  }

  const assetStats = useMemo(() => computeStats(assetResults), [assetResults])
  const ticketStats = useMemo(() => computeStats(ticketResults), [ticketResults])
  const costStats = useMemo(() => computeStats(costResults), [costResults])
  const zipStats = useMemo(() => computeStats(zipResults), [zipResults])
  
  const isBusy = isAssetParsing || isTicketParsing || isCostParsing || isAssetImporting || isTicketImporting || isCostImporting || isZipImporting
  const canSubmit = !isBusy && 
    (hasAssetRows || hasTicketRows || hasCostRows) && 
    (!isZipRequired || hasZipFile)

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

      <Card variant="elevated">
        <Card.Body>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-costs-file">Fichier CSV (coûts ticket)</Label>
              <Input
                id="csv-costs-file"
                type="file"
                accept=".csv,text/csv"
                onChange={onPickCostFile}
                disabled={isBusy}
              />
              {costFile && (
                <div className="text-xs text-gray-500">
                  {costFile.name} ({Math.round(costFile.size / 1024)} KB)
                </div>
              )}
              <div className="text-xs text-gray-500">
                Exemple: <span className="font-mono">import/fichier3.csv</span>
              </div>
              {hasCostRows && (
                <div className="text-sm text-gray-600">
                  {costRows.length} lignes prêtes à importer
                </div>
              )}
            </div>

            {costError && <Alert variant="danger">{costError}</Alert>}

            {(isCostImporting || costProgress.done > 0) && <ProgressBar progress={costProgress} />}
          </div>
        </Card.Body>
      </Card>

      <Card variant="elevated">
        <Card.Body>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zip-images-file">Fichier ZIP (images d'actifs)</Label>
              <Input
                id="zip-images-file"
                type="file"
                accept=".zip,application/zip"
                onChange={onPickZipFile}
                disabled={isBusy}
              />
              {zipFile && (
                <div className="text-xs text-gray-500">
                  {zipFile.name} ({Math.round(zipFile.size / 1024)} KB)
                </div>
              )}
              <div className="text-xs text-gray-500">
                Les images doivent être nommées comme les actifs (ex: <span className="font-mono">PC-001.png</span>).
              </div>
              {hasZipFile && (
                <div className="text-sm text-gray-600">
                  ZIP prêt à être analysé
                </div>
              )}
            </div>

            <Checkbox
              id="zip-required"
              label="Rendre l'import du fichier ZIP obligatoire"
              checked={isZipRequired}
              onChange={(e) => setIsZipRequired(e.target.checked)}
              disabled={isBusy}
            />

            {zipError && <Alert variant="danger">{zipError}</Alert>}
            {isZipRequired && !hasZipFile && (
              <Alert variant="danger">Veuillez sélectionner un fichier ZIP pour continuer.</Alert>
            )}

            {(isZipImporting || zipProgress.total > 0) && <ProgressBar progress={zipProgress} />}
          </div>
        </Card.Body>
      </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit}>
            Valider et importer
          </Button>
          {!canSubmit && !isBusy && (
            <div className="text-sm text-gray-600">
              {isZipRequired && !hasZipFile 
                ? "Veuillez sélectionner un fichier ZIP pour continuer." 
                : "Sélectionnez au moins un fichier CSV (actifs, tickets ou coûts) valide."}
            </div>
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

      {costStats.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Créés: {costStats.created}</Badge>
          <Badge variant="warning">Ignorés: {costStats.skipped}</Badge>
          <Badge variant="danger">Erreurs: {costStats.failed}</Badge>
          <Badge variant="default">Total: {costStats.total}</Badge>
        </div>
      )}

      {costResults.length > 0 && <ResultsTable results={costResults} />}

      {zipStats.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Liées: {zipStats.created}</Badge>
          <Badge variant="warning">Ignorées: {zipStats.skipped}</Badge>
          <Badge variant="danger">Erreurs: {zipStats.failed}</Badge>
          <Badge variant="default">Total: {zipStats.total}</Badge>
        </div>
      )}

      {zipResults.length > 0 && <ResultsTable results={zipResults} />}
    </div>
  )
}
