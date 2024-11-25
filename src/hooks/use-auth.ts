import { useState, useEffect } from 'react'

// In a real app, this would be an environment variable or secure configuration
const ADMIN_PASSWORD = 'midweave-admin'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('midweave-auth') === 'true'
    }
    return false
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on mount
    const authStatus = localStorage.getItem('midweave-auth')
    setIsAuthenticated(authStatus === 'true')
    setIsLoading(false)
  }, [])

  // Update localStorage whenever isAuthenticated changes
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('midweave-auth', 'true')
    } else {
      localStorage.removeItem('midweave-auth')
    }
  }, [isAuthenticated])

  const login = (password: string): boolean => {
    const success = password === ADMIN_PASSWORD
    setIsAuthenticated(success)
    return success
  }

  const logout = () => {
    setIsAuthenticated(false)
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  }
} 