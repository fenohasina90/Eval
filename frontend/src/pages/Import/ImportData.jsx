import { useMemo, useState } from 'react'
import { Alert, Badge, Button, Card, Input, Label, P, Table, Tbody, Td, Th, Thead, Tr } from '../../components'
import { importAssetsFromRows, parseCsvText, REQUIRED_COLUMNS } from '../../services/importDataService'

export default function ImportData() {
  const [file, setFile] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults] = useState([])

  const hasRows = rows.length > 0

  const requiredColumns = REQUIRED_COLUMNS

  async function onPickFile(e) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setRows([])
    setResults([])
    setProgress({ done: 0, total: 0 })
    setError('')

    if (!selected) return

    setIsParsing(true)
    try {
      const text = await selected.text()
      const parsed = parseCsvText(text)
      if (parsed.length === 0) {
        setError('Fichier CSV vide ou illisible.')
        return
      }

      const first = parsed[0] || {}
      const missing = requiredColumns.filter((col) => !(col in first))
      if (missing.length > 0) {
        setError(`Colonnes manquantes: ${missing.join(', ')}`)
        return
      }

      setRows(parsed)
    } catch (err) {
      setError(err?.message || 'Erreur lors de la lecture du fichier.')
    } finally {
      setIsParsing(false)
    }
  }

  async function onImport(e) {
    e.preventDefault()
    if (!hasRows || isImporting) return

    setIsImporting(true)
    setError('')
    setResults([])
    setProgress({ done: 0, total: rows.length })

    try {
      const out = await importAssetsFromRows(rows, {
        onProgress: ({ done, total }) => setProgress({ done, total }),
        onResults: (partial) => setResults(partial),
      })
      setResults(out)
    } catch (err) {
      setError(err?.message || 'Erreur lors de la préparation de l’import.')
    } finally {
      setIsImporting(false)
    }
  }

  const stats = useMemo(() => {
    const total = results.length
    const created = results.filter((r) => r.status === 'created').length
    const skipped = results.filter((r) => r.status === 'skipped').length
    const failed = results.filter((r) => r.status === 'error').length
    return { total, created, skipped, failed }
  }, [results])

  const percent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xl font-semibold text-gray-900">Import de données</div>
        <P className="text-gray-600">
          Sélectionnez un fichier CSV (exemple: <span className="font-mono">import/fichier1.csv</span>).
        </P>
      </div>

      <Card variant="elevated">
        <Card.Body>
          <form className="space-y-4" onSubmit={onImport}>
            <div className="space-y-2">
              <Label htmlFor="csv-file">Fichier CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={onPickFile}
                disabled={isParsing || isImporting}
              />
              {file && (
                <div className="text-xs text-gray-500">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              )}
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!hasRows || isParsing || isImporting}>
                Valider et importer
              </Button>
              {hasRows && (
                <div className="text-sm text-gray-600">
                  {rows.length} lignes prêtes à importer
                </div>
              )}
            </div>

            {(isImporting || progress.done > 0) && (
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
            )}
          </form>
        </Card.Body>
      </Card>

      {stats.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Créés: {stats.created}</Badge>
          <Badge variant="warning">Ignorés: {stats.skipped}</Badge>
          <Badge variant="danger">Erreurs: {stats.failed}</Badge>
          <Badge variant="default">Total: {stats.total}</Badge>
        </div>
      )}

      {results.length > 0 && (
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
      )}
    </div>
  )
}
