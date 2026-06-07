/**
 * Composant Card réutilisable
 * 
 * Variantes : default, bordered, elevated
 * Accepte tous les props natifs de <div>
 * 
 * Exemple :
 *   <Card variant="elevated" onClick={handleClick}>
 *     <Card.Header>Titre</Card.Header>
 *     <Card.Body>Contenu</Card.Body>
 *     <Card.Footer>Pied</Card.Footer>
 *   </Card>
 */
const variantClasses = {
  default: 'bg-white border border-gray-200',
  bordered: 'bg-white border-2 border-gray-300',
  elevated: 'bg-white shadow-md',
}

export default function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        rounded-xl overflow-hidden
        ${variantClasses[variant] || variantClasses.default}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 border-t border-gray-100 bg-gray-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
