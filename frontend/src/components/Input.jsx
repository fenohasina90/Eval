/**
 * Composant Input réutilisable
 * 
 * Variantes : default, error
 * Tailles : sm, md, lg
 * Accepte tous les props natifs de <input>
 * 
 * Exemple :
 *   <Input placeholder="Email" onChange={handleChange} />
 *   <Input variant="error" value={email} />
 */
const variantClasses = {
  default: 'border-gray-300 focus:border-gray-500 focus:ring-gray-500',
  error: 'border-red-400 focus:border-red-500 focus:ring-red-500 text-red-700',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
}

export default function Input({
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <input
      className={`
        block w-full rounded-lg border bg-white
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-offset-0
        placeholder:text-gray-400
        disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
        ${variantClasses[variant] || variantClasses.default}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      {...props}
    />
  )
}
