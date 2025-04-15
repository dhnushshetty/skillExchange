"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, UserCircle, Lightbulb, Send, InboxIcon, BarChart3, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "./sidebar-provider"

export function Sidebar() {
  const pathname = usePathname()
  const { logout } = useSidebar()

  const routes = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Profile",
      path: "/profile",
      icon: UserCircle,
    },
    {
      name: "Create Skill",
      path: "/create-skill",
      icon: Lightbulb,
    },
    {
      name: "Create Request",
      path: "/create-request",
      icon: Send,
    },
    {
      name: "Skill Requests",
      path: "/skill-requests",
      icon: InboxIcon,
    },
    {
      name: "My Transactions",
      path: "/transactions",
      icon: BarChart3,
    },
  ]

  return (
    <div className="w-64 bg-background border-r h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Skill Exchange</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {routes.map((route) => (
            <li key={route.path}>
              <Link href={route.path} passHref>
                <Button variant="ghost" className={cn("w-full justify-start", pathname === route.path && "bg-muted")}>
                  <route.icon className="mr-2 h-4 w-4" />
                  {route.name}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
