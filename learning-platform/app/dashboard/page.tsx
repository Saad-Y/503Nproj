"use client"

import { useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Plus,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showCourseDetails, setShowCourseDetails] = useState(false)

  const courseDetailsRef = useRef(null)

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

  const fetchEnrolledCourses = async () => {
    try {
      setIsLoadingCourses(true)
      const response = await fetch("/api/enrolled-courses", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch enrolled courses")
      }

      const data = await response.json()
      setEnrolledCourses(data)
    } catch (error) {
      console.error("Error fetching enrolled courses:", error)
      toast({
        title: "Error",
        description: "Failed to load your courses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCourses(false)
    }
  }

  useEffect(() => {
    fetchEnrolledCourses()
  }, [])

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

  const handleContinueCourse = (course) => {
    setSelectedCourse(course)
    setShowCourseDetails(true)

    // Scroll to course details section
    setTimeout(() => {
      if (courseDetailsRef.current) {
        courseDetailsRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  const getSourceFromUrl = (url) => {
    if (url.includes("edx.org")) return "EdX"
    if (url.includes("coursera.org")) return "Coursera"
    if (url.includes("udemy.com")) return "Udemy"
    if (url.includes("khanacademy.org")) return "Khan Academy"
    return "Unknown Source"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-6 w-6" />
          <span>Learnify</span>
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
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-4 md:gap-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500">Welcome to Learnify! Here's your learning dashboard.</p>
              </div>
            </div>
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">My Courses</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{enrolledCourses.length}</div>
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
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-full">
                    <CardHeader>
                      <CardTitle>Continue Learning</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      {isLoadingCourses ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : enrolledCourses.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No courses yet. Create your first course to get started.
                          </p>
                        </div>
                      ) : (
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
                                  {course.completedLessons || 0} of {course.totalLessons || course.modules?.length || 0}{" "}
                                  lessons completed
                                </div>
                                <Progress value={course.progress || 0} className="h-2" />
                              </div>
                              <Button size="sm" onClick={() => handleContinueCourse(course)}>
                                Continue
                                <ArrowDown className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
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

                {isLoadingCourses ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-1">No courses yet</h3>
                    <p className="text-muted-foreground">Create your first course to get started</p>
                  </div>
                ) : (
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
                            {course.completedLessons || 0} of {course.totalLessons || course.modules?.length || 0}{" "}
                            lessons completed
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Progress value={course.progress || 0} className="h-2" />
                          <div className="mt-2 text-xs text-gray-500">{course.progress || 0}% complete</div>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" onClick={() => handleContinueCourse(course)}>
                            Continue Learning
                            <ArrowDown className="ml-2 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Course Details Section */}
            {showCourseDetails && selectedCourse && (
              <div ref={courseDetailsRef} className="mt-8 pt-8 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                  <Button variant="outline" size="sm" onClick={() => setShowCourseDetails(false)}>
                    Hide Details
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedCourse.modules?.map((module, index) => (
                    <Card key={index} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{module.unit_name}</CardTitle>
                        <CardDescription className="text-xs">
                          Source: {getSourceFromUrl(module.unit_url)}
                        </CardDescription>
                      </CardHeader>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full flex justify-center items-center gap-1">
                            <span>Details</span>
                            <ChevronDown className="h-4 w-4 ml-1 collapsible-closed" />
                            <ChevronUp className="h-4 w-4 ml-1 collapsible-open" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2 text-sm">Summary</h4>
                                <p className="text-sm text-muted-foreground">{module.unit_summary}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2 text-sm">Learning Objectives</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {module.learning_objectives?.map((objective, idx) => (
                                    <li key={idx} className="text-sm">
                                      {objective}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <a
                                  href={module.unit_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary flex items-center gap-1 hover:underline"
                                >
                                  Visit Resource <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
