import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input, Label, P } from '../../components'
import { getPrefilledAccessCode, unlockBackoffice } from '../../services/backofficeAccess'

export default function AccessCode({ redirectTo = '/' }) {
  const navigate = useNavigate()
  const initialCode = useMemo(() => getPrefilledAccessCode(), [])
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function onSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = unlockBackoffice(code)
    if (!result.ok) {
      setError(result.message || 'Accès refusé.')
      setIsSubmitting(false)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card variant="elevated">
          <Card.Header>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-900">
                Accès au backoffice
              </div>
              <P className="text-gray-600">
                Saisissez le code unique pour accéder à l’application.
              </P>
            </div>
          </Card.Header>

          <Card.Body>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="access-code">Code d’accès</Label>
                <Input
                  id="access-code"
                  type="password"
                  autoComplete="current-password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Code unique"
                />
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Accéder
              </Button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Espace utilisateur</span>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                type="button" 
                className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                onClick={() => navigate('/front')}
              >
                Accéder au Front Office
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

