import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { AuthProvider } from './context/AuthContext'
import { UserSettingsProvider } from './context/UserSettingsContext'
import { ThemeProvider } from './context/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <UserSettingsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </UserSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
