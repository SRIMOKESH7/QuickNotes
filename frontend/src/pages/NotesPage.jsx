import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api/client.js'
import { EmptyState, ErrorBanner, LoadingState } from '../components/Feedback.jsx'
import NoteCard from '../components/NoteCard.jsx'
import NoteComposer from '../components/NoteComposer.jsx'
import './NotesPage.css'

function NotesPage() {
  const [notes, setNotes] = useState([])
  const [searchText, setSearchText] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [composerError, setComposerError] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [busyNoteIds, setBusyNoteIds] = useState(() => new Set())

  const saveLock = useRef(false)
  const noteActionLocks = useRef(new Set())

  const searchQuery = searchText.trim()

  useEffect(() => {
    const controller = new AbortController()
    let isCurrentRequest = true
    const searchForRequest = searchText.trim()

    const timer = window.setTimeout(async () => {
      const path = searchForRequest
        ? `notes?search=${encodeURIComponent(searchForRequest)}`
        : 'notes'

      try {
        const result = await apiRequest(path, { signal: controller.signal })
        if (isCurrentRequest) setNotes(result)
      } catch (error) {
        if (isCurrentRequest && error.name !== 'AbortError') {
          setPageError(error.message)
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }, searchForRequest ? 250 : 0)

    return () => {
      isCurrentRequest = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [searchText, refreshKey])

  function openComposer() {
    setComposerError('')
    setEditingNote(null)
    setIsComposerOpen(true)
  }

  function closeComposer() {
    if (saveLock.current) return
    setIsComposerOpen(false)
    setEditingNote(null)
    setComposerError('')
  }

  function startEditing(note) {
    setComposerError('')
    setIsComposerOpen(false)
    setEditingNote(note)
  }

  function changeSearch(value) {
    setSearchText(value)
    setIsLoading(true)
    setPageError('')
  }

  async function saveNote(values) {
    if (saveLock.current) return

    saveLock.current = true
    setIsSaving(true)
    setComposerError('')

    const isEditing = editingNote !== null
    const path = isEditing ? `notes/${editingNote.id}` : 'notes'

    try {
      await apiRequest(path, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(values),
      })
      setIsComposerOpen(false)
      setEditingNote(null)
      setPageError('')
      setIsLoading(true)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setComposerError(error.message)
    } finally {
      saveLock.current = false
      setIsSaving(false)
    }
  }

  async function runNoteAction(noteId, request) {
    if (noteActionLocks.current.has(noteId)) return

    noteActionLocks.current.add(noteId)
    setBusyNoteIds((current) => new Set(current).add(noteId))
    setPageError('')

    try {
      await request()
      setIsLoading(true)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      setPageError(error.message)
    } finally {
      noteActionLocks.current.delete(noteId)
      setBusyNoteIds((current) => {
        const next = new Set(current)
        next.delete(noteId)
        return next
      })
    }
  }

  function deleteNote(note) {
    if (noteActionLocks.current.has(note.id)) return
    const confirmed = window.confirm(`Delete "${note.title}"? This cannot be undone.`)
    if (!confirmed) return

    void runNoteAction(note.id, () =>
      apiRequest(`notes/${note.id}`, { method: 'DELETE' }),
    )
  }

  function togglePin(note) {
    void runNoteAction(note.id, () =>
      apiRequest(`notes/${note.id}/pin`, { method: 'PATCH' }),
    )
  }

  return (
    <section className="notes-page" aria-labelledby="notes-heading">
      <header className="page-heading">
        <h1 id="notes-heading">Notes</h1>
        <p>Capture and find your thoughts.</p>
      </header>

      <div className="notes-controls">
        <NoteComposer
          error={composerError}
          isOpen={isComposerOpen}
          isSaving={isSaving}
          key={isComposerOpen ? 'create-open' : 'create-closed'}
          onCancel={closeComposer}
          onClearError={() => setComposerError('')}
          onOpen={openComposer}
          onSave={saveNote}
        />
        <label className="notes-search">
          <span className="visually-hidden">Search notes</span>
          <input
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search notes..."
            type="search"
            value={searchText}
          />
          {searchText && (
            <button
              aria-label="Clear search"
              className="notes-search-clear"
              onClick={() => changeSearch('')}
              type="button"
            >
              Clear
            </button>
          )}
        </label>
      </div>

      <ErrorBanner message={pageError} onDismiss={() => setPageError('')} />

      {isLoading ? (
        <LoadingState />
      ) : notes.length > 0 ? (
        <div className="notes-grid">
          {notes.map((note) => (
            <NoteCard
              isBusy={busyNoteIds.has(note.id)}
              key={note.id}
              note={note}
              onDelete={deleteNote}
              onEdit={startEditing}
              onTogglePin={togglePin}
            />
          ))}
        </div>
      ) : pageError ? null : (
        <EmptyState>
          {searchQuery
            ? `No notes match “${searchQuery}”.`
            : 'No notes yet. Click above to create your first note!'}
        </EmptyState>
      )}

      {editingNote && (
        <NoteComposer
          error={composerError}
          isSaving={isSaving}
          key={editingNote.id}
          note={editingNote}
          onCancel={closeComposer}
          onClearError={() => setComposerError('')}
          onSave={saveNote}
        />
      )}
    </section>
  )
}

export default NotesPage
