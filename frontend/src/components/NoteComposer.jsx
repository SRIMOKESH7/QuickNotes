import { useEffect, useRef, useState } from 'react'
import { ErrorBanner } from './Feedback.jsx'

function NoteComposer({
  note = null,
  isOpen = false,
  isSaving = false,
  error = '',
  onOpen,
  onCancel,
  onSave,
  onClearError,
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [validationError, setValidationError] = useState('')
  const titleInputRef = useRef(null)
  const isEditing = note !== null

  useEffect(() => {
    if (isEditing || isOpen) {
      titleInputRef.current?.focus()
    }
  }, [isEditing, isOpen])

  if (!isEditing && !isOpen) {
    return (
      <button className="note-composer-collapsed" type="button" onClick={onOpen}>
        Take a note...
      </button>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setValidationError('Please enter a title for your note.')
      titleInputRef.current?.focus()
      return
    }

    setValidationError('')
    onSave({ title: trimmedTitle, content: content.trim() })
  }

  const form = (
    <form
      className={`note-form ${isEditing ? 'note-edit-form' : 'note-create-form'}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="note-field-label" htmlFor="note-title">
        Title
      </label>
      <input
        ref={titleInputRef}
        autoComplete="off"
        id="note-title"
        onChange={(event) => {
          setTitle(event.target.value)
          setValidationError('')
          onClearError?.()
        }}
        placeholder="Note title"
        value={title}
      />

      <label className="note-field-label" htmlFor="note-content">
        Content
      </label>
      <textarea
        id="note-content"
        onChange={(event) => {
          setContent(event.target.value)
          onClearError?.()
        }}
        placeholder="Write your note..."
        rows={4}
        value={content}
      />

      <ErrorBanner message={validationError || error} />

      <div className="note-form-actions">
        <button
          className="button button-quiet"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button className="button button-primary" disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : isEditing ? 'Update Note' : 'Save'}
        </button>
      </div>
    </form>
  )

  if (!isEditing) return form

  return (
    <div className="note-modal-backdrop">
      <section
        aria-labelledby="note-editor-heading"
        aria-modal="true"
        className="note-modal"
        role="dialog"
      >
        <h2 id="note-editor-heading">Edit note</h2>
        {form}
      </section>
    </div>
  )
}

export default NoteComposer
