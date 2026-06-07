/**
 * Composant Select réutilisable
 * 
 * Tailles : sm, md, lg
 * Accepte tous les props natifs de <select>
 * 
 * Exemple :
 *   <Select onChange={handleChange} value={selected}>
 *     <option value="a">Option A</option>
 *     <option value="b">Option B</option>
 *   </Select>
 */
const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
}

export default function Select({
  children,
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <select
      className={`
        block w-full rounded-lg border border-gray-300 bg-white
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500
        disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
        cursor-pointer
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  )
}
