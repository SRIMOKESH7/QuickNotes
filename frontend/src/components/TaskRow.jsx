import { useState } from 'react'

function TaskRow({ task, isBusy, onSave, onToggle, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)
  const [validationError, setValidationError] = useState('')

  function beginEditing() {
    setDraftTitle(task.title)
    setValidationError('')
    setIsEditing(true)
  }

  async function handleSave(event) {
    event.preventDefault()
    if (isBusy) return

    const trimmedTitle = draftTitle.trim()
    if (!trimmedTitle) {
      setValidationError('Task title cannot be blank.')
      return
    }

    setValidationError('')
    await onSave(task.id, trimmedTitle)
  }

  function cancelEditing() {
    setIsEditing(false)
    setValidationError('')
  }

  return (
    <li className={`task-item ${task.is_completed ? 'task-item-completed' : ''}`}>
      <input
        aria-label={
          task.is_completed
            ? `Mark ${task.title} as pending`
            : `Mark ${task.title} as completed`
        }
        checked={task.is_completed}
        className="task-checkbox"
        disabled={isBusy}
        onChange={() => onToggle(task)}
        type="checkbox"
      />

      {isEditing ? (
        <form className="task-edit-form" onSubmit={handleSave} noValidate>
          <label className="task-visually-hidden" htmlFor={`edit-task-${task.id}`}>
            Edit task title
          </label>
          <div className="task-edit-fields">
            <input
              autoFocus
              disabled={isBusy}
              id={`edit-task-${task.id}`}
              onChange={(event) => {
                setDraftTitle(event.target.value)
                setValidationError('')
              }}
              value={draftTitle}
            />
            {validationError && (
              <p className="task-validation" role="alert">
                {validationError}
              </p>
            )}
          </div>
          <div className="task-row-actions">
            <button className="task-action-save" disabled={isBusy} type="submit">
              Save
            </button>
            <button
              className="task-action-secondary"
              disabled={isBusy}
              onClick={cancelEditing}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <span className="task-title">{task.title}</span>
          <div className="task-row-actions">
            <button
              aria-label={`Edit task: ${task.title}`}
              className="task-action-secondary"
              disabled={isBusy}
              onClick={beginEditing}
              type="button"
            >
              Edit
            </button>
            <button
              aria-label={`Delete task: ${task.title}`}
              className="task-action-delete"
              disabled={isBusy}
              onClick={() => onDelete(task)}
              type="button"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  )
}

export default TaskRow
