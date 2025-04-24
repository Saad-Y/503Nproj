"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Info, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Module {
  id: string
  unit_name: string
  unit_url: string
  unit_summary: string
  learning_objectives: string[]
  learning_outcomes: string[]
}

export function ModuleSelector() {
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseName, setCourseName] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch("/data/modules.json")
        if (!response.ok) {
          throw new Error("Failed to fetch modules")
        }
        const data = await response.json()
        setModules(data)

        // Initialize all modules as unselected
        const initialSelection: Record<string, boolean> = {}
        data.forEach((module: Module) => {
          initialSelection[module.id] = false
        })
        setSelectedModules(initialSelection)

        setLoading(false)
      } catch (err) {
        setError("Failed to load modules. Please try again later.")
        setLoading(false)
        console.error(err)
      }
    }

    fetchModules()
  }, [])

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  const handleCreateCourse = () => {
    if (!courseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course name",
        variant: "destructive",
      })
      return
    }

    const selectedModuleIds = Object.entries(selectedModules)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id)

    if (selectedModuleIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one module",
        variant: "destructive",
      })
      return
    }

    // In a real application, you would send this data to your backend
    const newCourse = {
      name: courseName,
      description: courseDescription,
      modules: modules.filter((module) => selectedModuleIds.includes(module.id)),
    }

    console.log("Creating new course:", newCourse)

    toast({
      title: "Success!",
      description: `Course "${courseName}" created with ${selectedModuleIds.length} modules`,
    })

    // Reset form
    setCourseName("")
    setCourseDescription("")
    setSelectedModules((prev) => {
      const reset: Record<string, boolean> = {}
      Object.keys(prev).forEach((key) => {
        reset[key] = false
      })
      return reset
    })
  }

  const filteredModules = modules.filter(
    (module) =>
      module.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.unit_summary.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedCount = Object.values(selectedModules).filter(Boolean).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="course-name">Course Name</Label>
            <Input
              id="course-name"
              placeholder="Enter course name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course-description">Course Description (Optional)</Label>
            <Input
              id="course-description"
              placeholder="Enter course description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Select Modules</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{selectedCount} selected</Badge>
          <Input
            placeholder="Search modules..."
            className="w-[200px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4 space-y-4">
          {filteredModules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No modules found matching your search.</p>
          ) : (
            filteredModules.map((module) => (
              <Card
                key={module.id}
                className={`transition-colors ${selectedModules[module.id] ? "border-primary bg-primary/5" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedModules[module.id]}
                      onCheckedChange={() => toggleModuleSelection(module.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{module.unit_name}</CardTitle>
                      <CardDescription>{module.unit_summary}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full flex justify-center items-center gap-1">
                      <Info className="h-4 w-4" />
                      <span>Details</span>
                      <ChevronDown className="h-4 w-4 ml-1 collapsible-closed" />
                      <ChevronUp className="h-4 w-4 ml-1 collapsible-open" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Learning Objectives</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {module.learning_objectives.map((objective, index) => (
                              <li key={index} className="text-sm">
                                {objective}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Learning Outcomes</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {module.learning_outcomes.map((outcome, index) => (
                              <li key={index} className="text-sm">
                                {outcome}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end">
        <Button onClick={handleCreateCourse} disabled={selectedCount === 0 || !courseName.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>
    </div>
  )
}
