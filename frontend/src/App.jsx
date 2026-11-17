import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NotesPage from './pages/NotesPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="main-workspace" id="main-content">
          <div className="page-container">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
