/**
 * Composant Grid réutilisable pour structurer en colonnes
 * 
 * Props :
 *   - cols : nombre max de colonnes sur grand écran (1, 2, 3, 4, ou "auto")
 *   - gap : espacement (2, 3, 4, 6)
 */
export default function Grid({
  cols = 1,
  gap = 4,
  children,
  className = '',
  ...props
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
  }

  return (
    <div
      className={`
        grid
        ${colClasses[cols] || colClasses[1]}
        ${gapClasses[gap] || gapClasses[4]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
