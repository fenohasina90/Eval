/**
 * Composant Alert réutilisable
 * 
 * Variantes : info, success, danger, warning
 * Accepte tous les props natifs de <div>
 */
export default function Alert({
  variant = 'info',
  children,
  className = '',
  ...props
}) {
  const variantClasses = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }

  return (
    <div
      className={`
        rounded-2xl border px-4 py-3 text-sm transition-all
        ${variantClasses[variant] || variantClasses.info}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
