import Checkbox from './Checkbox'

/**
 * Composant CheckboxCard réutilisable
 * Affiche une checkbox stylisée sous forme de carte cliquable
 */
export default function CheckboxCard({
  checked,
  onChange,
  label,
  className = '',
  ...props
}) {
  return (
    <label
      className={`
        flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all cursor-pointer select-none
        ${checked
          ? 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }
        ${className}
      `}
      {...props}
    >
      <Checkbox
        checked={checked}
        onChange={onChange}
        label={label}
      />
    </label>
  )
}
