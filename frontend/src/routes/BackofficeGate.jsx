import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import AccessCode from '../pages/AccessCode/AccessCode'
import { isBackofficeUnlocked } from '../services/backofficeAccess'

export default function BackofficeGate({ children }) {
  const location = useLocation()
  const redirectTo = useMemo(() => {
    const path = location.pathname || '/'
    const search = location.search || ''
    const hash = location.hash || ''
    return `${path}${search}${hash}`
  }, [location.hash, location.pathname, location.search])

  if (!isBackofficeUnlocked()) {
    return <AccessCode redirectTo={redirectTo} />
  }

  return children
}

