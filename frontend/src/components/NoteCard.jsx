function formatUpdatedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function NoteCard({ note, isBusy, onEdit, onDelete, onTogglePin }) {
  return (
    <article className={`note-card ${note.is_pinned ? 'note-card-pinned' : ''}`}>
      <div className="note-card-heading">
        <h2 title={note.title}>{note.title}</h2>
        <div className="note-card-actions">
          <button
            aria-label={`Edit note: ${note.title}`}
            className="note-action-button"
            disabled={isBusy}
            onClick={() => onEdit(note)}
            type="button"
          >
            Edit
          </button>
          <button
            aria-label={`Delete note: ${note.title}`}
            className="note-action-button note-delete-button"
            disabled={isBusy}
            onClick={() => onDelete(note)}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="note-card-content">{note.content}</p>

      <div className="note-card-footer">
        <time dateTime={note.updated_at}>
          Updated {formatUpdatedAt(note.updated_at)}
        </time>
        <button
          aria-label={`${note.is_pinned ? 'Unpin' : 'Pin'} note: ${note.title}`}
          aria-pressed={note.is_pinned}
          className="note-pin-button"
          disabled={isBusy}
          onClick={() => onTogglePin(note)}
          type="button"
        >
          {note.is_pinned ? 'Unpin' : 'Pin'}
        </button>
      </div>
    </article>
  )
}

export default NoteCard
