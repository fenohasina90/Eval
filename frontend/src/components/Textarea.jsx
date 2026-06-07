/**
 * Composant Textarea réutilisable
 * 
 * Accepte tous les props natifs de <textarea>
 * 
 * Exemple :
 *   <Textarea placeholder="Message..." rows={4} onChange={handleChange} />
 */
export default function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`
        block w-full rounded-lg border border-gray-300 bg-white
        px-3 py-2 text-sm
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500
        placeholder:text-gray-400
        disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
        resize-y
        ${className}
      `}
      {...props}
    />
  )
}
