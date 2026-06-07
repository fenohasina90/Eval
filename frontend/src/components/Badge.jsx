/**
 * Composant Badge réutilisable
 * 
 * Variantes : default, success, warning, danger, info
 * Accepte tous les props natifs de <span>
 * 
 * Exemple :
 *   <Badge variant="success">Actif</Badge>
 *   <Badge variant="danger" onClick={handleClick}>Supprimé</Badge>
 */
const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${variantClasses[variant] || variantClasses.default}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
