import { useMemo, useState } from 'react'
import { allAPI, purgeAll } from '../../services/resetService'
import {
	Button,
	Card,
	H1,
	P,
	Small,
	Alert,
	Grid,
	Container,
	CheckboxCard,
	TrackingItem
} from '../../components'

export default function Reset() {
	const [selected, setSelected] = useState(() => allAPI.map((entity) => entity.url))
	const [isResetting, setIsResetting] = useState(false)
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const [tracking, setTracking] = useState([])
	const [completedCount, setCompletedCount] = useState(0)

	const selectedCount = selected.length
	const totalCount = allAPI.length
	const isAllSelected = selectedCount === totalCount
	const trackingTotal = tracking.length

	const selectedLabel = useMemo(() => {
		if (selectedCount === 0) {
			return 'Aucune entité sélectionnée'
		}

		if (selectedCount === totalCount) {
			return 'Toutes les entités sont sélectionnées'
		}

		return `${selectedCount} entité(s) sélectionnée(s)`
	}, [selectedCount, totalCount])

	const toggleEntity = (entityName) => {
		setSelected((current) =>
			current.includes(entityName)
				? current.filter((item) => item !== entityName)
				: [...current, entityName],
		)
		setMessage('')
		setError('')
	}

	const toggleAll = () => {
		setSelected(isAllSelected ? [] : allAPI.map((entity) => entity.url))
		setMessage('')
		setError('')
	}

	const handleReset = async () => {
		if (selected.length === 0) {
			setError('Sélectionne au moins une case avant de lancer la purge.')
			return
		}

		try {
			setIsResetting(true)
			setError('')
			setMessage('')
			setCompletedCount(0)
			setTracking(
				selected.map((entity) => ({
					entity,
					status: 'pending',
					total: 0,
					successCount: 0,
					failureCount: 0,
				})),
			)

			const results = await purgeAll(selected, ({ entity, status, total, successCount, failureCount }) => {
				setTracking((current) =>
					current.map((item) =>
						item.entity === entity
							? {
								...item,
								status,
								total: total ?? item.total,
								successCount: successCount ?? item.successCount,
								failureCount: failureCount ?? item.failureCount,
							}
							: item,
					),
				)

				if (status === 'success' || status === 'warning' || status === 'error') {
					setCompletedCount((current) => Math.min(current + 1, selected.length))
				}
			})
			const successCount = results.filter((result) => result.success).length
			const failureCount = results.length - successCount

			if (failureCount > 0) {
				setMessage(`Purge terminée avec ${successCount} suppression(s) réussie(s) et ${failureCount} erreur(s).`)
			} else {
				setMessage(`Purge terminée: ${successCount} suppression(s) réussie(s).`)
			}
		} catch {
			setError('Impossible de lancer la purge.')
		} finally {
			setIsResetting(false)
		}
	}

	return (
		<Container size="5xl">
			<Card className="p-6">
				<div className="space-y-2">
					<H1>Reset des données</H1>
					<P className="text-gray-600">
						Coche les entités à purger, puis lance le reset uniquement sur celles sélectionnées.
					</P>
					<Small className="text-gray-500">{selectedLabel}</Small>
				</div>

				<Grid cols={3} gap={3} className="mt-6">
					{allAPI.map((entity) => (
						<CheckboxCard
							key={entity.url}
							checked={selected.includes(entity.url)}
							onChange={() => toggleEntity(entity.url)}
							label={entity.url}
						/>
					))}
				</Grid>

				<div className="mt-6 flex flex-wrap gap-3">
					<Button variant="secondary" onClick={toggleAll} disabled={isResetting}>
						{isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
					</Button>
					<Button variant="danger" onClick={handleReset} disabled={isResetting || selected.length === 0}>
						{isResetting ? 'Purge en cours...' : 'Lancer le reset'}
					</Button>
				</div>

				{tracking.length > 0 && (
					<div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
						<div className="mb-3 flex items-center justify-between">
							<P className="font-medium text-gray-900">Détail du suivi</P>
							<Small className="text-gray-500">{completedCount} / {trackingTotal} étape(s) terminée(s)</Small>
						</div>
						<div className="space-y-2">
							{tracking.map((item) => {
								const badgeVariant =
									item.status === 'success'
										? 'success'
										: item.status === 'warning'
											? 'warning'
											: item.status === 'error'
												? 'danger'
												: item.status === 'running'
													? 'info'
													: 'default'

								const statusLabel =
									item.status === 'success'
										? 'OK'
										: item.status === 'warning'
											? 'Partiel'
											: item.status === 'error'
												? 'Erreur'
												: item.status === 'running'
													? 'En cours'
													: 'En attente'

								const subtitleLabel = item.total > 0
									? `${item.successCount} OK · ${item.failureCount} erreur(s) · ${item.total} total`
									: 'En attente de traitement'

								return (
									<TrackingItem
										key={item.entity}
										title={item.entity}
										subtitle={subtitleLabel}
										badgeText={statusLabel}
										badgeVariant={badgeVariant}
									/>
								)
							})}
						</div>
					</div>
				)}

				{message && (
					<Alert variant="success" className="mt-4">
						{message}
					</Alert>
				)}

				{error && (
					<Alert variant="danger" className="mt-4">
						{error}
					</Alert>
				)}
			</Card>

			<Card>
				<Card.Body className="space-y-2">
					<H1>Rappel</H1>
					<P className="text-gray-600">
						La purge utilise `getIdsPour` pour récupérer les IDs de chaque entité cochée, puis appelle la suppression définitive sur chaque élément.
					</P>
				</Card.Body>
			</Card>
		</Container>
	)
}
