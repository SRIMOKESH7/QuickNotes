import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/notes', label: 'Notes' },
  { to: '/tasks', label: 'Tasks' },
]

function Navbar() {
  return (
    <aside className="sidebar">
      <NavLink className="brand" to="/" aria-label="QuickNotes home">
        QuickNotes
      </NavLink>

      <nav className="primary-navigation" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <NavLink
            className="nav-link"
            end={item.end}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Navbar
