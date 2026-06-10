/**
 * Composant Modal réutilisable
 * 
 * Props : isOpen, onClose, title
 * Accepte tous les props natifs de <div> (sur le conteneur)
 * 
 * Exemple :
 *   <Modal isOpen={show} onClose={() => setShow(false)} title="Confirmation">
 *     <p>Êtes-vous sûr ?</p>
 *   </Modal>
 */
import { useState, useEffect } from 'react'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  ...props
}) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateDarkMode = () => {
      setIsDark(document.body.classList.contains('dark'))
    }
    updateDarkMode()
    
    const observer = new MutationObserver(() => {
      updateDarkMode()
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={`
          relative z-10 rounded-2xl shadow-xl
          w-full max-w-5xl mx-4
          flex flex-col max-h-[90vh]
          animate-[fadeIn_0.2s_ease-out]
          ${isDark ? 'bg-gray-800' : 'bg-white'}
          ${className}
        `}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
            <button
              onClick={onClose}
              className={`transition-colors cursor-pointer ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
