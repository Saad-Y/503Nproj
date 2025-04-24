"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateCoursePage() {
  const [courseName, setCourseName] = useState("")
  const [degree, setDegree] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [platforms, setPlatforms] = useState({
    "Khan Academy": false,
    Udemy: false,
    EdX: false,
    Coursera: false,
  })

  const handlePlatformChange = (platform: string) => {
    setPlatforms({
      ...platforms,
      [platform]: !platforms[platform as keyof typeof platforms],
    })
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
      })

      if (!response.ok) {
        throw new Error("Failed to generate course")
      }

      const data = await response.json()

      toast({
        title: "Success!",
        description: "Course generated successfully",
      })

      // Reset form
      setCourseName("")
      setDegree("")
      setPlatforms({
        "Khan Academy": false,
        Udemy: false,
        EdX: false,
        Coursera: false,
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
    </div>
  )
}
