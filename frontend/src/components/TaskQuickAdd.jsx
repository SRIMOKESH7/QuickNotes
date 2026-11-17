import { useRef, useState } from 'react'

function TaskQuickAdd({ isSubmitting, onCreate }) {
  const [title, setTitle] = useState('')
  const [validationError, setValidationError] = useState('')
  const titleInputRef = useRef(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setValidationError('Please enter a task title.')
      titleInputRef.current?.focus()
      return
    }

    setValidationError('')
    const created = await onCreate(trimmedTitle)
    if (created) setTitle('')
  }

  return (
    <form className="task-quick-add" onSubmit={handleSubmit} noValidate>
      <label className="task-visually-hidden" htmlFor="new-task-title">
        What needs to be done?
      </label>
      <input
        ref={titleInputRef}
        autoComplete="off"
        disabled={isSubmitting}
        id="new-task-title"
        onChange={(event) => {
          setTitle(event.target.value)
          setValidationError('')
        }}
        placeholder="What needs to be done?"
        value={title}
      />
      <button className="task-add-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Adding...' : 'Add Task'}
      </button>
      {validationError && (
        <p className="task-validation" id="task-title-error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  )
}

export default TaskQuickAdd
