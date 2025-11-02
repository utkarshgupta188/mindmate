import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Motivations from './pages/Motivations'
import News from './pages/News'
import IndiaHelp from './pages/IndiaHelp'
import Games from './pages/Games'
import Chat from './pages/Chat'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  const { user } = useAuth()
  const location = useLocation()
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ScrollToTop />
      <Navbar />
      <div className="container-p py-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/motivations" element={<Motivations />} />
          <Route path="/news" element={<News />} />
          <Route path="/india-help" element={<IndiaHelp />} />
          <Route path="/games" element={<Games />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
      <footer className="py-10">
        <div className="container-p text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} MindMate. Not a medical device. For education only.</p>
        </div>
      </footer>
    </div>
  )
}
