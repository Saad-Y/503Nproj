"use client"

import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, LayoutDashboard, FileText, MessageSquare, GraduationCap, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  // Check authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/auth_check`, {
          credentials: "include", // Important for cookies
        })

        if (!response.ok) {
          router.push("/auth")
          return
        }

        const data = await response.json()
        setUsername(data.user)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/logout`, {
        method: "POST",
        credentials: "include", // Important for cookies
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      router.push("/auth")
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-6 w-6" />
          <span>LearnHub</span>
        </Link>
        <nav className="hidden flex-1 md:flex">
          <Link href="/dashboard" className="flex h-full items-center px-4 text-sm font-medium">
            Dashboard
          </Link>
          <Link
            href="/dashboard/notes"
            className="flex h-full items-center border-b-2 border-primary px-4 text-sm font-medium"
          >
            My Notes
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {username && <span className="text-sm hidden md:inline-block">Hello, {username}</span>}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-[250px] flex-col border-r bg-muted/40 md:flex">
          <div className="flex flex-col h-full">
            <nav className="grid gap-2 p-4 text-sm font-medium">
              <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/notes"
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-primary-foreground"
              >
                <FileText className="h-4 w-4" />
                My Notes
              </Link>
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
                <MessageSquare className="h-4 w-4" />
                AI Assistant
              </Link>
              <Link
                href="/dashboard/achievements"
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <GraduationCap className="h-4 w-4" />
                Achievements
              </Link>
            </nav>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
