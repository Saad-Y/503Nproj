"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Module {
  learning_objectives: string[]
  unit_name: string
  unit_summary: string
  unit_url: string
  selected?: boolean
}

interface CourseResponse {
  course: string
  modules: Module[][]
}

export default function CreateCoursePage() {
  const router = useRouter()
  const [courseName, setCourseName] = useState("")
  const [degree, setDegree] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [platforms, setPlatforms] = useState({
    "Khan Academy": false,
    Udemy: false,
    EdX: false,
    Coursera: false,
  })
  const [generatedCourse, setGeneratedCourse] = useState<CourseResponse | null>(null)
  const [flattenedModules, setFlattenedModules] = useState<Module[]>([])

  // Check authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/auth_check`, {
          credentials: "include", // Important for cookies
        })

        if (!response.ok) {
          router.push("/auth")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router])

  // Flatten modules when generatedCourse changes
  useEffect(() => {
    if (generatedCourse && generatedCourse.modules) {
      // Flatten the array of arrays and add selected property
      const flattened = generatedCourse.modules.flat().map((module) => ({
        ...module,
        selected: true, // Default to selected
      }))
      setFlattenedModules(flattened)
    }
  }, [generatedCourse])

  const handlePlatformChange = (platform: string) => {
    setPlatforms({
      ...platforms,
      [platform]: !platforms[platform as keyof typeof platforms],
    })
  }

  const handleModuleSelectionChange = (index: number) => {
    setFlattenedModules((prev) =>
      prev.map((module, i) => (i === index ? { ...module, selected: !module.selected } : module)),
    )
  }

  const getSourceFromUrl = (url: string): string => {
    if (url.includes("edx.org")) return "EdX"
    if (url.includes("coursera.org")) return "Coursera"
    if (url.includes("udemy.com")) return "Udemy"
    if (url.includes("khanacademy.org")) return "Khan Academy"
    return "Unknown Source"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!courseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course name",
        variant: "destructive",
      })
      return
    }

    if (!degree.trim()) {
      toast({
        title: "Error",
        description: "Please enter your degree",
        variant: "destructive",
      })
      return
    }

    const selectedPlatforms = Object.entries(platforms)
      .filter(([_, isSelected]) => isSelected)
      .map(([platform]) => platform)

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setGeneratedCourse(null)
    setFlattenedModules([])

    try {
      // Call the API endpoint
      const response = await fetch("/api/generate_course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_status: degree,
          course: courseName,
          platforms: selectedPlatforms,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to generate course")
      }

      const data = await response.json()
      setGeneratedCourse(data)

      toast({
        title: "Success!",
        description: "Course generated successfully. Please select the modules you want to include.",
      })
    } catch (error) {
      console.error("Error generating course:", error)
      toast({
        title: "Error",
        description: "Failed to generate course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitCourse = async () => {
    if (!generatedCourse) return

    const selectedModules = flattenedModules.filter((module) => module.selected)

    if (selectedModules.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one module",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Call the API endpoint to save the course
      const response = await fetch("/api/save_course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_name: generatedCourse.course,
          modules: selectedModules,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to save course")
      }

      toast({
        title: "Success!",
        description: "Course saved successfully",
      })

      // Reset form and redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (error) {
      console.error("Error saving course:", error)
      toast({
        title: "Error",
        description: "Failed to save course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6 pl-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Course</h1>
          <p className="text-muted-foreground">Generate a personalized learning path</p>
        </div>
      </div>

      {!generatedCourse ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Enter your preferences to generate a customized course</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  placeholder="e.g., Machine Learning, Web Development"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="degree">Your Degree</Label>
                <Input
                  id="degree"
                  placeholder="e.g., Computer Science, Business"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Platforms</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(platforms).map(([platform, isChecked]) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={isChecked}
                        onCheckedChange={() => handlePlatformChange(platform)}
                      />
                      <label
                        htmlFor={platform}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {platform}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  "Generate Course"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Generated Course: {generatedCourse.course}</CardTitle>
            <CardDescription>Select the modules you want to include in your course</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {flattenedModules.map((module, index) => (
                  <Card key={index} className={`border ${module.selected ? "border-primary" : "border-muted"}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`module-${index}`}
                            checked={module.selected}
                            onCheckedChange={() => handleModuleSelectionChange(index)}
                            className="mt-1"
                          />
                          <div>
                            <CardTitle className="text-base">{module.unit_name}</CardTitle>
                            <CardDescription className="text-xs">
                              Source: {getSourceFromUrl(module.unit_url)}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
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
                                {module.learning_objectives.map((objective, idx) => (
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
            </ScrollArea>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedCourse(null)
                  setFlattenedModules([])
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitCourse}
                disabled={isSubmitting || flattenedModules.filter((m) => m.selected).length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Course...
                  </>
                ) : (
                  "Save Course"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
