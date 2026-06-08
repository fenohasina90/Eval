import { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Card, Table, Tbody, Td, Th, Thead, Tr } from '../../components'
import { getDashboardStats } from '../../services/dashboardService'

// Couleur badge selon le statut ticket
const STATUS_BADGE_VARIANT = {
  blue: 'info',
  yellow: 'warning',
  orange: 'warning',
  purple: 'secondary',
  green: 'success',
  gray: 'default',
}

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

function StatusTable({ rows }) {
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Statut</Th>
          <Th>Nombre</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((r) => (
          <Tr key={r.key}>
            <Td>{r.label}</Td>
            <Td>
              <Badge variant={STATUS_BADGE_VARIANT[r.color] ?? 'default'}>
                {r.count}
              </Badge>
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
    return () => { cancelled = true }
  }, [])

  const assets = data?.assets
  const tickets = data?.tickets

  const assetRows = useMemo(() => assets?.byType ?? [], [assets?.byType])
  const ticketRows = useMemo(() => tickets?.byType ?? [], [tickets?.byType])
  const statusRows = useMemo(() => tickets?.byStatus ?? [], [tickets?.byStatus])

  const placeholder = isLoading ? '...' : 0

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold text-gray-900">Dashboard</div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Cards résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Elements (total)" total={assets?.total ?? placeholder} />
        <SummaryCard title="Tickets (total)" total={tickets?.total ?? placeholder} />
      </div>

      {/* Détail actifs + tickets par type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <Card.Body>
            <div className="text-sm font-medium text-gray-900">Detail des elements</div>
            <div className="mt-4">
              {assetRows.length > 0
                ? <BreakdownTable rows={assetRows} />
                : <div className="text-sm text-gray-600">Aucune donnee.</div>}
            </div>
          </Card.Body>
        </Card>

        <Card variant="elevated">
          <Card.Body>
            <div className="text-sm font-medium text-gray-900">Tickets par type</div>
            <div className="mt-4">
              {ticketRows.length > 0
                ? <BreakdownTable rows={ticketRows} />
                : <div className="text-sm text-gray-600">Aucune donnee.</div>}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Détail tickets par statut — nouvelle section */}
      <Card variant="elevated">
        <Card.Body>
          <div className="text-sm font-medium text-gray-900">Tickets par statut</div>
          <div className="mt-4">
            {statusRows.length > 0
              ? <StatusTable rows={statusRows} />
              : <div className="text-sm text-gray-600">Aucune donnee.</div>}
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
