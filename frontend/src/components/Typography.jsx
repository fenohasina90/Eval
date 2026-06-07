/**
 * Composants Typographie réutilisables
 * 
 * H1, H2, H3, H4, P, Small, Label
 * Acceptent tous les props natifs de leur élément HTML respectif
 * 
 * Exemple :
 *   <H1 className="text-center">Mon Titre</H1>
 *   <P className="mt-4">Mon paragraphe</P>
 */

export function H1({ children, className = '', ...props }) {
  return (
    <h1
      className={`text-3xl font-bold text-gray-900 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h1>
  )
}

export function H2({ children, className = '', ...props }) {
  return (
    <h2
      className={`text-2xl font-semibold text-gray-900 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
}

export function H3({ children, className = '', ...props }) {
  return (
    <h3
      className={`text-xl font-semibold text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function H4({ children, className = '', ...props }) {
  return (
    <h4
      className={`text-lg font-medium text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </h4>
  )
}

export function P({ children, className = '', ...props }) {
  return (
    <p
      className={`text-sm text-gray-600 leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

export function Small({ children, className = '', ...props }) {
  return (
    <small
      className={`text-xs text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </small>
  )
}

export function Label({ children, className = '', ...props }) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}
