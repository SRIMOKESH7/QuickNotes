import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { EmptyState, ErrorBanner, LoadingState } from '../components/Feedback.jsx'
import './DashboardPage.css'

const statCards = [
  { key: 'total_notes', label: 'Total Notes' },
  { key: 'total_tasks', label: 'Total Tasks' },
  { key: 'completed_tasks', label: 'Completed Tasks' },
  { key: 'pending_tasks', label: 'Pending Tasks' },
]

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentNotes, setRecentNotes] = useState([])
  const [activeTasks, setActiveTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let isCurrentRequest = true

    async function loadDashboard() {
      try {
        const [dashboardStats, notes, tasks] = await Promise.all([
          apiRequest('dashboard/stats', { signal: controller.signal }),
          apiRequest('notes', { signal: controller.signal }),
          apiRequest('tasks?status=pending', { signal: controller.signal }),
        ])

        if (!isCurrentRequest) return

        const newestNotes = [...notes]
          .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
          .slice(0, 4)

        setStats(dashboardStats)
        setRecentNotes(newestNotes)
        setActiveTasks(tasks)
      } catch (error) {
        if (isCurrentRequest && error.name !== 'AbortError') {
          setPageError(error.message)
        }
      } finally {
        if (isCurrentRequest) setIsLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      isCurrentRequest = false
      controller.abort()
    }
  }, [])

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-heading">
      <header className="page-heading">
        <h1 id="dashboard-heading">Dashboard</h1>
        <p>Your daily overview</p>
      </header>

      <ErrorBanner message={pageError} />

      {isLoading ? (
        <LoadingState message="Loading your dashboard..." />
      ) : pageError ? null : (
        <>
          <section className="dashboard-stats" aria-label="Application statistics">
            {statCards.map((card) => (
              <article className="dashboard-stat-card" key={card.key}>
                <h2>{card.label}</h2>
                <p>{stats[card.key]}</p>
              </article>
            ))}
          </section>

          <div className="dashboard-sections">
            <section className="dashboard-panel" aria-labelledby="recent-notes-heading">
              <div className="dashboard-panel-heading">
                <h2 id="recent-notes-heading">Recent Notes</h2>
                <Link to="/notes">View All</Link>
              </div>
              {recentNotes.length === 0 ? (
                <EmptyState>No notes yet. Create a note to see it here.</EmptyState>
              ) : (
                <ul className="dashboard-note-list">
                  {recentNotes.map((note) => (
                    <li className="dashboard-note" key={note.id}>
                      <h3>{note.title}</h3>
                      <p>{note.content || 'No additional details.'}</p>
                      <time dateTime={note.created_at}>{formatDate(note.created_at)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="dashboard-panel" aria-labelledby="active-tasks-heading">
              <div className="dashboard-panel-heading">
                <h2 id="active-tasks-heading">Active Tasks</h2>
                <Link to="/tasks">View All</Link>
              </div>
              {activeTasks.length === 0 ? (
                <EmptyState>No pending tasks. You’re all caught up!</EmptyState>
              ) : (
                <ul className="dashboard-task-list">
                  {activeTasks.map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  )
}

export default DashboardPage
