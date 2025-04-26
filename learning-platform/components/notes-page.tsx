"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FileText, Upload, Trash2, Play, BookOpen, Loader2, FileUp, X, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

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
  const [isNonParsable, setIsNonParsable] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

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
      // const isParsable = /\.(txt|pdf|docx)$/i.test(file.name)
      const endpoint = isNonParsable ? "/api/upload_document_non_parsable" : "/api/upload_document_parsable"

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
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setQuizSubmitted(false)

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

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (quizSubmitted) return
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }))
  }

  const handleQuizSubmit = () => {
    if (!quiz) return

    let correctCount = 0
    quiz.forEach((question: any, index: number) => {
      if (userAnswers[index] === question.answer) {
        correctCount++
      }
    })

    setQuizScore({
      correct: correctCount,
      total: quiz.length,
    })

    setQuizSubmitted(true)
  }

  const handleQuizReset = () => {
    setUserAnswers({})
    setQuizSubmitted(false)
    setQuizScore({ correct: 0, total: 0 })
    setCurrentQuestionIndex(0)
  }

  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
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
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="non-parsable"
                      checked={isNonParsable}
                      onCheckedChange={() => setIsNonParsable(!isNonParsable)}
                    />
                    <label
                      htmlFor="non-parsable"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Document contains images of text (non-parsable)
                    </label>
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
                    accept=".pdf,.txt,.png,.jpg,.jpeg"
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
        <Dialog
          open={isQuizOpen}
          onOpenChange={(open) => {
            setIsQuizOpen(open)
            if (!open) {
              handleQuizReset()
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Quiz on {selectedNote?.title}</DialogTitle>
              <DialogDescription>
                {quizSubmitted
                  ? `You scored ${quizScore.correct} out of ${quizScore.total}`
                  : "Select the best answer for each question"}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 mt-4 mb-6 border rounded-md p-6">
              {quiz.length > 0 && (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm font-medium">
                      Question {currentQuestionIndex + 1} of {quiz.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(userAnswers).length} of {quiz.length} answered
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">{quiz[currentQuestionIndex].question}</h3>
                    <div className="space-y-3">
                      {quiz[currentQuestionIndex].options.map((option: string, optionIndex: number) => {
                        const isSelected = userAnswers[currentQuestionIndex] === optionIndex
                        const isCorrect = quiz[currentQuestionIndex].answer === optionIndex
                        const showCorrect = quizSubmitted && isCorrect
                        const showIncorrect = quizSubmitted && isSelected && !isCorrect

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center gap-2 p-3 rounded-md cursor-pointer border ${
                              isSelected ? "border-primary bg-primary/5" : "border-muted"
                            } ${showCorrect ? "border-green-500 bg-green-50" : ""} ${
                              showIncorrect ? "border-red-500 bg-red-50" : ""
                            }`}
                            onClick={() => handleAnswerSelect(currentQuestionIndex, optionIndex)}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-100 text-gray-800 border border-gray-300"
                              } ${showCorrect ? "bg-green-500 text-white" : ""} ${
                                showIncorrect ? "bg-red-500 text-white" : ""
                              }`}
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <span className={`${isSelected ? "font-medium" : ""} ${showCorrect ? "font-medium" : ""}`}>
                              {option}
                            </span>
                            {quizSubmitted && isCorrect && (
                              <span className="ml-auto text-green-600 text-sm font-medium">Correct</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {currentQuestionIndex < quiz.length - 1 ? (
                      <Button
                        onClick={goToNextQuestion}
                        className="flex items-center gap-1"
                        disabled={!userAnswers.hasOwnProperty(currentQuestionIndex)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleQuizSubmit}
                        disabled={quizSubmitted || Object.keys(userAnswers).length < quiz.length}
                      >
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {quizSubmitted ? (
                <div className="flex w-full justify-between items-center">
                  <div className="text-sm">
                    <span className="font-medium">Score: </span>
                    <span
                      className={`${
                        quizScore.correct === quizScore.total
                          ? "text-green-600"
                          : quizScore.correct > quizScore.total / 2
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {quizScore.correct}/{quizScore.total} ({Math.round((quizScore.correct / quizScore.total) * 100)}%)
                    </span>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={handleQuizReset}>
                      Try Again
                    </Button>
                    <Button onClick={() => setIsQuizOpen(false)}>Close</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsQuizOpen(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
