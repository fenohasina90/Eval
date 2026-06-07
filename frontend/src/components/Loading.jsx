/**
 * Composant Loading — écran de chargement plein écran
 *
 * Props :
 *   - message  : texte affiché sous le spinner (défaut : "Chargement…")
 *   - overlay  : si true, fond semi-transparent en overlay (défaut : false → fond opaque)
 *   - className : classes CSS supplémentaires
 *
 * Exemple :
 *   <Loading />
 *   <Loading message="Récupération des données…" />
 *   <Loading overlay />
 */
export default function Loading({
  message = "Chargement…",
  overlay = false,
  className = "",
  ...props
}) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        ${overlay ? "bg-gray-900/60 backdrop-blur-sm" : "bg-gray-50"}
        ${className}
      `}
      {...props}
    >
      {/* Spinner */}
      <div className="relative mb-6">
        {/* Anneau extérieur */}
        <div
          className="
            w-16 h-16 rounded-full
            border-4 border-gray-200
            border-t-indigo-500
            animate-spin
          "
        />
        {/* Point central pulsant */}
        <div
          className="
            absolute inset-0 flex items-center justify-center
          "
        >
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>

      {/* Message */}
      {message && (
        <p
          className={`
            text-sm font-medium tracking-wide animate-pulse
            ${overlay ? "text-white" : "text-gray-500"}
          `}
        >
          {message}
        </p>
      )}
    </div>
  );
}
