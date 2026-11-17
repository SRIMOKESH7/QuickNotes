import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../api/client.js'
import { EmptyState, ErrorBanner, LoadingState } from '../components/Feedback.jsx'
import TaskQuickAdd from '../components/TaskQuickAdd.jsx'
import TaskRow from '../components/TaskRow.jsx'
import './TasksPage.css'

const taskFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [busyTaskIds, setBusyTaskIds] = useState(() => new Set())

  const createLock = useRef(false)
  const taskActionLocks = useRef(new Set())

  useEffect(() => {
    const controller = new AbortController()
    let isCurrentRequest = true

    async function loadTasks() {
      try {
        const result = await apiRequest(`tasks?status=${filter}`, {
          signal: controller.signal,
        })
        if (isCurrentRequest) setTasks(result)
      } catch (error) {
        if (isCurrentRequest && error.name !== 'AbortError') {
          setPageError(error.message)
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }

    void loadTasks()

    return () => {
      isCurrentRequest = false
      controller.abort()
    }
  }, [filter, refreshKey])

  function changeFilter(nextFilter) {
    if (nextFilter === filter) return
    setFilter(nextFilter)
    setIsLoading(true)
    setPageError('')
  }

  async function createTask(title) {
    if (createLock.current) return false

    createLock.current = true
    setIsCreating(true)
    setPageError('')

    try {
      await apiRequest('tasks', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      setIsLoading(true)
      setRefreshKey((current) => current + 1)
      return true
    } catch (error) {
      setPageError(error.message)
      return false
    } finally {
      createLock.current = false
      setIsCreating(false)
    }
  }

  async function runTaskAction(taskId, request) {
    if (taskActionLocks.current.has(taskId)) return false

    taskActionLocks.current.add(taskId)
    setBusyTaskIds((current) => new Set(current).add(taskId))
    setPageError('')

    try {
      await request()
      setIsLoading(true)
      setRefreshKey((current) => current + 1)
      return true
    } catch (error) {
      setPageError(error.message)
      return false
    } finally {
      taskActionLocks.current.delete(taskId)
      setBusyTaskIds((current) => {
        const next = new Set(current)
        next.delete(taskId)
        return next
      })
    }
  }

  function updateTask(taskId, title) {
    return runTaskAction(taskId, () =>
      apiRequest(`tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title }),
      }),
    )
  }

  function toggleTask(task) {
    void runTaskAction(task.id, () =>
      apiRequest(`tasks/${task.id}/toggle`, { method: 'PATCH' }),
    )
  }

  function deleteTask(task) {
    if (taskActionLocks.current.has(task.id)) return
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`)
    if (!confirmed) return

    void runTaskAction(task.id, () =>
      apiRequest(`tasks/${task.id}`, { method: 'DELETE' }),
    )
  }

  function renderTaskRows(taskList) {
    return (
      <ul className="task-list">
        {taskList.map((task) => (
          <TaskRow
            isBusy={busyTaskIds.has(task.id)}
            key={task.id}
            onDelete={deleteTask}
            onSave={updateTask}
            onToggle={toggleTask}
            task={task}
          />
        ))}
      </ul>
    )
  }

  const pendingTasks = tasks.filter((task) => !task.is_completed)
  const completedTasks = tasks.filter((task) => task.is_completed)

  return (
    <section className="tasks-page" aria-labelledby="tasks-heading">
      <header className="page-heading">
        <h1 id="tasks-heading">Tasks</h1>
        <p>Keep track of what needs to get done.</p>
      </header>

      <TaskQuickAdd isSubmitting={isCreating} onCreate={createTask} />

      <div className="task-filters" role="group" aria-label="Filter tasks">
        {taskFilters.map((item) => (
          <button
            aria-pressed={filter === item.value}
            className="task-filter-button"
            key={item.value}
            onClick={() => changeFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={pageError} onDismiss={() => setPageError('')} />

      {isLoading ? (
        <LoadingState message="Loading tasks..." />
      ) : pageError && tasks.length === 0 ? null : tasks.length === 0 ? (
        <EmptyState>
          {filter === 'completed'
            ? 'No completed tasks yet.'
            : "You're all caught up! Add a task above to get started."}
        </EmptyState>
      ) : filter === 'all' ? (
        <div className="task-sections">
          <section className="task-section" aria-labelledby="active-tasks-heading">
            <h2 id="active-tasks-heading">Active tasks</h2>
            {pendingTasks.length > 0 ? (
              renderTaskRows(pendingTasks)
            ) : (
              <p className="task-section-empty">No pending tasks.</p>
            )}
          </section>

          <section className="task-section" aria-labelledby="completed-tasks-heading">
            <h2 id="completed-tasks-heading">Completed ({completedTasks.length})</h2>
            {completedTasks.length > 0 ? (
              renderTaskRows(completedTasks)
            ) : (
              <p className="task-section-empty">No completed tasks yet.</p>
            )}
          </section>
        </div>
      ) : (
        renderTaskRows(tasks)
      )}
    </section>
  )
}

export default TasksPage
