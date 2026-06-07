/**
 * Composant Checkbox réutilisable
 * 
 * Accepte tous les props natifs de <input type="checkbox">
 * 
 * Exemple :
 *   <Checkbox label="J'accepte" checked={isChecked} onChange={handleChange} />
 */
export default function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="
          w-4 h-4 rounded border-gray-300
          text-gray-900
          focus:ring-2 focus:ring-gray-500 focus:ring-offset-0
          cursor-pointer
        "
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
