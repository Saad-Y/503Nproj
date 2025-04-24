"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FileText, Upload, Trash2, Play, BookOpen, Loader2, FileUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Note {
  id: string
  title: string
  owner_username: string
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [quiz, setQuiz] = useState<any>(null)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch notes")
      }

      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast({
        title: "Error",
        description: "Failed to load your notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    try {
      setUploading(true)
      setUploadProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      const formData = new FormData()
      formData.append("file", file)

      // Determine if file is parsable based on extension
      const isParsable = /\.(txt|pdf|docx)$/i.test(file.name)
      const endpoint = isParsable ? "/api/upload_document_parsable" : "/api/upload_document_non_parsable"

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      toast({
        title: "Success",
        description: "Note uploaded successfully!",
      })

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ""

      // Refresh notes list
      fetchNotes()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload note. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/delete_document/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      toast({
        title: "Success",
        description: "Note deleted successfully!",
      })

      // Update notes list
      setNotes(notes.filter((note) => note.id !== noteId))
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewNote = async (note: Note) => {
    try {
      setSelectedNote(note)
      setIsNoteOpen(true)

      const response = await fetch(`/api/fetch_notes?doc_name=${encodeURIComponent(note.title)}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch note content")
      }

      const data = await response.json()
      setNoteContent(data.notes)
    } catch (error) {
      console.error("Error fetching note content:", error)
      toast({
        title: "Error",
        description: "Failed to load note content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateAudio = async (note: Note) => {
    try {
      setSelectedNote(note)
      setIsGeneratingAudio(true)

      // First, fetch the note content if not already loaded
      if (!noteContent) {
        const response = await fetch(`/api/fetch_notes?doc_name=${encodeURIComponent(note.title)}`, {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch note content")
        }

        const data = await response.json()
        setNoteContent(data.notes)
      }

      // Then generate audio from the content
      const audioResponse = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: noteContent }),
        credentials: "include",
      })

      if (!audioResponse.ok) {
        throw new Error("Failed to generate audio")
      }

      // Create blob URL from audio response
      const blob = await audioResponse.blob()
      const url = URL.createObjectURL(blob)
      setAudioSrc(url)

      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        setIsPlaying(true)
      }

      toast({
        title: "Success",
        description: "Audio generated and playing!",
      })
    } catch (error) {
      console.error("Error generating audio:", error)
      toast({
        title: "Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const handleGenerateQuiz = async (note: Note) => {
    try {
      setSelectedNote(note)
      setIsGeneratingQuiz(true)

      const response = await fetch("/api/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_id: note.id }),
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const data = await response.json()
      setQuiz(JSON.parse(data.quiz))
      setIsQuizOpen(true)

      toast({
        title: "Success",
        description: "Quiz generated successfully!",
      })
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Notes</h1>
        <p className="text-muted-foreground">Upload, manage, and study your notes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <FileUp className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Drop your own notes here</p>
                    <p className="text-sm text-muted-foreground">Supports PDF, DOCX, TXT, and image files</p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select File
                      </>
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
                  />
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Play className="h-4 w-4 mt-0.5 text-primary" />
                  <span>
                    Click <strong>Listen</strong> to hear your notes read aloud
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 text-primary" />
                  <span>
                    Click <strong>Generate Quiz</strong> to create practice questions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Click on a note to view its full content</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>My Uploaded Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-1">No notes yet</h3>
                  <p className="text-muted-foreground">Upload your first note to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card key={note.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div
                          className="flex-1 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleViewNote(note)}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="font-medium">{note.title}</h3>
                              <p className="text-sm text-muted-foreground">Click to view content</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateAudio(note)}
                            disabled={isGeneratingAudio && selectedNote?.id === note.id}
                          >
                            {isGeneratingAudio && selectedNote?.id === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            <span className="ml-2">Listen</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateQuiz(note)}
                            disabled={isGeneratingQuiz && selectedNote?.id === note.id}
                          >
                            {isGeneratingQuiz && selectedNote?.id === note.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <BookOpen className="h-4 w-4" />
                            )}
                            <span className="ml-2">Generate Quiz</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Note Content Dialog */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedNote?.title}</DialogTitle>
            <DialogDescription>Your uploaded note content</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto mt-4 mb-6 border rounded-md p-4">
            <ScrollArea className="h-[300px]">
              <div className="whitespace-pre-wrap">{noteContent}</div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsNoteOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Player */}
      {audioSrc && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Now Playing</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAudioSrc(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => {
                if (audioRef.current) {
                  if (isPlaying) {
                    audioRef.current.pause()
                  } else {
                    audioRef.current.play()
                  }
                  setIsPlaying(!isPlaying)
                }
              }}
            >
              {isPlaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{selectedNote?.title}</p>
              <p className="text-xs text-muted-foreground">{isPlaying ? "Playing" : "Paused"}</p>
            </div>
            <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} className="hidden" />
          </div>
        </div>
      )}

      {/* Quiz Dialog */}
      {quiz && (
        <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Quiz on {selectedNote?.title}</DialogTitle>
              <DialogDescription>Test your knowledge with these questions</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 mt-4 mb-6">
              <div className="space-y-6">
                {quiz.map((question: any, index: number) => (
                  <div key={index} className="border rounded-md p-4">
                    <h3 className="font-medium mb-3">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-2 ml-4">
                      {question.options.map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              optIndex === question.answer
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-gray-100 text-gray-800 border border-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <span className={optIndex === question.answer ? "font-medium" : ""}>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button onClick={() => setIsQuizOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
