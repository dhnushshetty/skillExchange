"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"

type SidebarContextType = {
  isAuthenticated: boolean
  userId: string | null
  login: (userId: string) => void
  logout: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated on client side
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      setIsAuthenticated(true)
      setUserId(storedUserId)
    } else if (pathname !== "/" && pathname !== "/register") {
      router.push("/")
    }
  }, [pathname, router])

  const login = (userId: string) => {
    localStorage.setItem("userId", userId)
    setIsAuthenticated(true)
    setUserId(userId)
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("userId")
    setIsAuthenticated(false)
    setUserId(null)
    router.push("/")
  }

  return (
    <SidebarContext.Provider value={{ isAuthenticated, userId, login, logout }}>
      {isAuthenticated && pathname !== "/" && pathname !== "/register" ? (
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      ) : (
        children
      )}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
