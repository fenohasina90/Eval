import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Card, Table, Tbody, Td, Th, Thead, Tr } from '../../components'
import { getDashboardStats } from '../../services/dashboardService'

function SummaryCard({ title, total }) {
  return (
    <Card variant="elevated">
      <Card.Body>
        <div className="text-sm text-gray-600">{title}</div>
        <div className="mt-2 text-3xl font-semibold text-gray-900">{total}</div>
      </Card.Body>
    </Card>
  )
}

function BreakdownTable({ rows }) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Type</Th>
          <Th>Nombre</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.key}>
            <Td>{r.label}</Td>
            <Td>
              <Badge variant="default">{r.count}</Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const stats = await getDashboardStats()
        if (!cancelled) setData(stats)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Erreur lors du chargement du dashboard.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const assets = data?.assets
  const tickets = data?.tickets

  const assetRows = useMemo(() => assets?.byType ?? [], [assets?.byType])
  const ticketRows = useMemo(() => tickets?.byType ?? [], [tickets?.byType])

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold text-gray-900">Dashboard</div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Éléments (total)" total={assets?.total ?? (isLoading ? '…' : 0)} />
        <SummaryCard title="Tickets (total)" total={tickets?.total ?? (isLoading ? '…' : 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <Card.Body>
            <div className="text-sm font-medium text-gray-900">Détail des éléments</div>
            <div className="mt-4">{assetRows.length > 0 ? <BreakdownTable rows={assetRows} /> : <div className="text-sm text-gray-600">Aucune donnée.</div>}</div>
          </Card.Body>
        </Card>

        <Card variant="elevated">
          <Card.Body>
            <div className="text-sm font-medium text-gray-900">Détail des tickets</div>
            <div className="mt-4">{ticketRows.length > 0 ? <BreakdownTable rows={ticketRows} /> : <div className="text-sm text-gray-600">Aucune donnée.</div>}</div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

