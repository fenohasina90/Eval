/**
 * Composant Error — écran d'erreur plein écran
 *
 * Props :
 *   - title     : titre de l'erreur (défaut : "Une erreur est survenue")
 *   - message   : description détaillée (défaut : null)
 *   - code      : code HTTP ou code d'erreur à afficher (défaut : null)
 *   - onRetry   : callback pour le bouton "Réessayer" (défaut : null → pas de bouton)
 *   - onGoBack  : callback pour le bouton "Retour" (défaut : null → pas de bouton)
 *   - overlay   : si true, fond semi-transparent en overlay (défaut : false)
 *   - className : classes CSS supplémentaires
 *
 * Exemple :
 *   <Error />
 *   <Error code={404} title="Page introuvable" message="La ressource demandée n'existe pas." />
 *   <Error onRetry={() => refetch()} onGoBack={() => navigate(-1)} />
 */
export default function Error({
  title = "Une erreur est survenue",
  message = null,
  code = null,
  onRetry = null,
  onGoBack = null,
  overlay = false,
  className = "",
  ...props
}) {
  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center px-6
        ${overlay ? "bg-gray-900/60 backdrop-blur-sm" : "bg-gray-50"}
        ${className}
      `}
      {...props}
    >
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Icône d'erreur */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        {/* Code d'erreur */}
        {code && (
          <span className="mb-2 text-5xl font-bold tracking-tight text-red-500/80">
            {code}
          </span>
        )}

        {/* Titre */}
        <h2
          className={`text-xl font-semibold mb-2 ${
            overlay ? "text-white" : "text-gray-800"
          }`}
        >
          {title}
        </h2>

        {/* Message détaillé */}
        {message && (
          <p
            className={`text-sm leading-relaxed mb-6 ${
              overlay ? "text-gray-300" : "text-gray-500"
            }`}
          >
            {message}
          </p>
        )}

        {/* Actions */}
        {(onRetry || onGoBack) && (
          <div className="flex items-center gap-3 mt-4">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="
                  px-5 py-2.5 text-sm font-medium rounded-lg
                  border border-gray-300 text-gray-700 bg-white
                  hover:bg-gray-50 active:bg-gray-100
                  transition-colors cursor-pointer
                "
              >
                Retour
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="
                  px-5 py-2.5 text-sm font-medium rounded-lg
                  bg-indigo-500 text-white
                  hover:bg-indigo-600 active:bg-indigo-700
                  transition-colors cursor-pointer
                "
              >
                Réessayer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
