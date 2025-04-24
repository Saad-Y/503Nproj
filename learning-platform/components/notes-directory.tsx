"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FileText, Upload, Trash2, Play, PauseCircle, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"

interface Note {
  id: string
  title: string
  owner_username: string
}

export function NotesDirectory() {
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents")
      if (!response.ok) throw new Error("Failed to fetch notes")
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

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

      // Determine if file is parsable based on extension
      const isParsable = /\.(txt|pdf|docx)$/i.test(file.name)
      const endpoint = isParsable ? "/api/upload_document_parsable" : "/api/upload_document_non_parsable"

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) throw new Error("Failed to upload file")

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
      })

      if (!response.ok) throw new Error("Failed to delete note")

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

      const response = await fetch(`/api/fetch_notes?doc_name=${encodeURIComponent(note.title)}`)
      if (!response.ok) throw new Error("Failed to fetch note content")

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

  const handleGenerateAudio = async () => {
    if (!selectedNote || !noteContent) return

    try {
      setIsGeneratingAudio(true)

      const response = await fetch("/api/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: noteContent }),
      })

      if (!response.ok) throw new Error("Failed to generate audio")

      // Create blob URL from audio response
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioSrc(url)

      toast({
        title: "Success",
        description: "Audio generated successfully!",
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

  const handleGenerateQuiz = async () => {
    if (!selectedNote) return

    try {
      setIsGeneratingQuiz(true)

      const response = await fetch("/api/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_id: selectedNote.id }),
      })

      if (!response.ok) throw new Error("Failed to generate quiz")

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

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }

    setIsPlaying(!isPlaying)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">My Notes</h2>
        <div className="flex flex-col gap-2">
          <Button onClick={() => fileInputRef.current?.click()} className="w-full justify-start" disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Notes
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
          />

          {uploadProgress > 0 && <Progress value={uploadProgress} className="h-2 w-full" />}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notes yet. Upload some!</p>
            </div>
          ) : (
            notes.map((note) => (
              <Card key={note.id} className="mb-2">
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium truncate">{note.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardFooter className="py-2 px-3 flex justify-between">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewNote(note)}>
                    <FileText className="mr-1 h-3 w-3" />
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

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

          {audioSrc && (
            <div className="mb-4 flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={toggleAudioPlayback}>
                {isPlaying ? <PauseCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} className="hidden" />
              <span className="text-sm">{isPlaying ? "Playing audio..." : "Audio ready to play"}</span>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleGenerateAudio} disabled={isGeneratingAudio}>
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate Audio
                </>
              )}
            </Button>
            <Button onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
              {isGeneratingQuiz ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    <h3 className="font-medium mb-2">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-2 ml-4">
                      {question.options.map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
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
