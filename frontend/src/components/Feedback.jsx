function LoadingState({ message = 'Loading notes...' }) {
  return (
    <p className="notes-loading" role="status" aria-live="polite">
      {message}
    </p>
  )
}

function EmptyState({ children }) {
  return (
    <div className="notes-empty-state">
      <p>{children}</p>
    </div>
  )
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="notes-error" role="alert">
      <p>{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss error">
          Dismiss
        </button>
      )}
    </div>
  )
}

export { EmptyState, ErrorBanner, LoadingState }
