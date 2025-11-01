import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DarkModeToggle from './DarkModeToggle'
import BotLauncher from './BotLauncher'

export default function Navbar() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    'px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition ' + (isActive ? 'bg-slate-100 dark:bg-slate-800' : '')

  return (
    <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur sticky top-0 z-50">
      <div className="container-p flex items-center justify-between h-16">
        <Link to="/" className="font-semibold text-lg">
          <span className="bg-gradient-to-r from-forest-500 to-moss bg-clip-text text-transparent">
            MindMate
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink className={linkClass} to="/">Home</NavLink>
          <NavLink className={linkClass} to="/motivations">Motivations</NavLink>
          <NavLink className={linkClass} to="/news">News</NavLink>
          <NavLink className={linkClass} to="/india-help">India Help</NavLink>
          <NavLink className={linkClass} to="/games">Games</NavLink>
          <NavLink className={linkClass} to="/reports">Reports</NavLink>
          {user && <NavLink className={linkClass} to="/dashboard">Dashboard</NavLink>}
        </nav>
        <div className="flex items-center gap-2">
          <BotLauncher />
          <DarkModeToggle />
          {!user ? (
            <>
              <Link to="/login" className="px-3 py-2 rounded-xl border btn-outline">Log in</Link>
              <Link to="/signup" className="px-3 py-2 rounded-xl btn btn-primary">Sign up</Link>
            </>
          ) : (
            <button onClick={logout} className="px-3 py-2 rounded-xl border btn-outline">Log out</button>
          )}
        </div>
      </div>
    </header>
  )
}
