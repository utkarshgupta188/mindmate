// App.tsx
import React, { Suspense, lazy, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'

// Lazy-loaded pages (keeps initial bundle small)
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Motivations = lazy(() => import('./pages/Motivations'))
const News = lazy(() => import('./pages/News'))
const IndiaHelp = lazy(() => import('./pages/IndiaHelp'))
const Games = lazy(() => import('./pages/Games'))
const Chat = lazy(() => import('./pages/Chat'))
const Reports = lazy(() => import('./pages/Reports'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile')) // new

// Simple loading fallback while lazy chunks load
function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
    </div>
  )
}

// Minimal ErrorBoundary to catch lazy load chunk errors
type ErrorBoundaryState = { hasError: boolean; error?: Error | null }
type ErrorBoundaryProps = { children?: React.ReactNode }
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    // you can log to a service here
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Failed to load this part of the app. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded bg-slate-800 text-white"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children as React.ReactNode
  }
}

// Framer Motion variants for page transitions (centralized)
const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}
const pageTransition = { duration: 0.20 }

export default function App(): JSX.Element {
  const { user } = useAuth() as { user?: any | null } // adjust User type if you have one
  const location = useLocation()

  // Hide Navbar on auth pages (optional — edit list as you prefer)
  const hideNavbarOn = useMemo(() => ['/login', '/signup'], [])
  const showNavbar = !hideNavbarOn.includes(location.pathname)

  // Update document title slightly on route change (quick UX)
  useEffect(() => {
    const titleBase = 'MindMate'
    const path = location.pathname === '/' ? 'Home' : location.pathname.replace('/', '')
    document.title = `${titleBase} • ${path || 'Home'}`
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ScrollToTop />
      {showNavbar && <Navbar />}

      <div className="container-p py-6">
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <AnimatePresence mode="wait" initial={false}>
              {/* key must change on navigation for animate presence to pick it up */}
              <motion.div
                key={location.pathname + location.search}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Routes location={location}>
                  <Route path="/" element={<Landing />} />

                  <Route
                    path="/login"
                    element={user ? <Navigate replace to="/dashboard" /> : <Login />}
                  />
                  <Route
                    path="/signup"
                    element={user ? <Navigate replace to="/dashboard" /> : <Signup />}
                  />

                  <Route path="/motivations" element={<Motivations />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/government-help" element={<IndiaHelp />} />
                  <Route path="/india-help" element={<Navigate to="/government-help" replace />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/reports" element={<Reports />} />

                  {/* Profile read-only view */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Profile edit/settings page */}
                  <Route
                    path="/profile/edit"
                    element={
                      <ProtectedRoute>
                        <EditProfile />
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

                  <Route path="*" element={<Navigate replace to="/" />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </div>

      <footer className="py-10">
        <div className="container-p text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} MindMate. Not a medical device. For education only.</p>
        </div>
      </footer>
    </div>
  )
}