/**
 * Composant Container réutilisable pour envelopper les pages
 * 
 * Props :
 *   - size : largeur max du conteneur ('3xl', '4xl', '5xl', '6xl', '7xl', 'full')
 */
export default function Container({
  size = '5xl',
  children,
  className = '',
  ...props
}) {
  const sizeClasses = {
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <div
      className={`
        mx-auto space-y-6 w-full
        ${sizeClasses[size] || sizeClasses['5xl']}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
