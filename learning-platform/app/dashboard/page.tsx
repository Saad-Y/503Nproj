"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  Clock,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Plus,
  FileText,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"

// Import the ChatButton at the top of the file
import { ChatButton } from "@/components/chat-button"

export default function DashboardPage() {
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

  // Create context information for the AI assistant
  const contextInfo = `User is on their dashboard. 
  They are enrolled in ${enrolledCourses.length} courses: ${enrolledCourses.map((c) => c.title).join(", ")}. 
  Their overall progress across all courses is ${Math.round(enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / enrolledCourses.length)}%.`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-6 w-6" />
          <span>LearnHub</span>
        </Link>
        <nav className="hidden flex-1 md:flex">
          <Link
            href="/dashboard"
            className="flex h-full items-center border-b-2 border-primary px-4 text-sm font-medium"
          >
            Dashboard
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
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/dashboard/notes" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted">
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
        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-4 md:gap-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500">Welcome to LearnHub! Here's your learning dashboard.</p>
              </div>
            </div>
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">3</div>
                      <p className="text-xs text-muted-foreground">+1 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1</div>
                      <p className="text-xs text-muted-foreground">+1 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Hours Spent</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">24.5</div>
                      <p className="text-xs text-muted-foreground">+5.2 from last week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        className="h-4 w-4 text-muted-foreground"
                      >
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">5</div>
                      <p className="text-xs text-muted-foreground">+2 new badges</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>Continue Learning</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <div className="space-y-4">
                        {enrolledCourses.map((course) => (
                          <div key={course.id} className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img
                                src={course.image || "/placeholder.svg"}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-gray-500">
                                {course.completedLessons} of {course.totalLessons} lessons completed
                              </div>
                              <Progress value={course.progress} className="h-2" />
                            </div>
                            <Link href={`/courses/${course.id}`}>
                              <Button size="sm">
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="courses" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">My Courses</h2>
                  <Link href="/dashboard/create-course">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Course
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {enrolledCourses.map((course) => (
                    <Card key={course.id}>
                      <div className="aspect-video w-full bg-gray-100 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            src={course.image || "/placeholder.svg"}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={course.progress} className="h-2" />
                        <div className="mt-2 text-xs text-gray-500">{course.progress}% complete</div>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/courses/${course.id}`} className="w-full">
                          <Button className="w-full">Continue Learning</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="achievements" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id}>
                      <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <achievement.icon className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle>{achievement.title}</CardTitle>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center text-sm text-gray-500">
                        Earned on {achievement.date}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      {/* Dashboard-specific chat button with context */}
      <ChatButton
        initialMessage="👋 Welcome to your dashboard! Need help tracking your progress or finding your next course?"
        contextInfo={contextInfo}
      />
    </div>
  )
}

const enrolledCourses = [
  {
    id: "1",
    title: "Web Development Fundamentals",
    image: "/placeholder.svg?height=200&width=300",
    completedLessons: 3,
    totalLessons: 5,
    progress: 60,
  },
  {
    id: "2",
    title: "Data Science Essentials",
    image: "/placeholder.svg?height=200&width=300",
    completedLessons: 2,
    totalLessons: 10,
    progress: 20,
  },
  {
    id: "3",
    title: "Digital Marketing Masterclass",
    image: "/placeholder.svg?height=200&width=300",
    completedLessons: 1,
    totalLessons: 8,
    progress: 12,
  },
]

const achievements = [
  {
    id: "1",
    title: "First Course Completed",
    description: "Completed your first course on LearnHub",
    date: "April 15, 2023",
    icon: GraduationCap,
  },
  {
    id: "2",
    title: "Fast Learner",
    description: "Completed 5 lessons in a single day",
    date: "May 3, 2023",
    icon: Clock,
  },
  {
    id: "3",
    title: "Course Explorer",
    description: "Enrolled in 3 different courses",
    date: "June 12, 2023",
    icon: BookOpen,
  },
]
