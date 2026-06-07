import Badge from './Badge'

/**
 * Composant TrackingItem réutilisable
 * Affiche une ligne de statut avec un titre, un sous-titre et un badge
 */
export default function TrackingItem({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'default',
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        flex flex-col gap-2 rounded-xl bg-white px-4 py-3 border border-gray-100 shadow-2xs
        sm:flex-row sm:items-center sm:justify-between
        ${className}
      `}
      {...props}
    >
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{title}</span>
        {subtitle && <span className="text-xs text-gray-500 mt-0.5">{subtitle}</span>}
      </div>
      {badgeText && (
        <div className="flex items-center">
          <Badge variant={badgeVariant}>{badgeText}</Badge>
        </div>
      )}
    </div>
  )
}
