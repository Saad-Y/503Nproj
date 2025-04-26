"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FileText, Upload, Trash2, Play, PauseCircle, BookOpen, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"

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
      const endpoint = isNonParsable ? "/api/upload_document_non_parsable" : "/api/upload_document_parsable"

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include",
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
        credentials: "include",
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

      const response = await fetch(`/api/fetch_notes?doc_name=${encodeURIComponent(note.title)}`, {
        credentials: "include",
      })
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
        credentials: "include",
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
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setQuizSubmitted(false)

      const response = await fetch("/api/generate_quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_id: selectedNote.id }),
        credentials: "include",
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-2">My Notes</h2>
        <div className="flex flex-col gap-2">
          <Button onClick={() => fileInputRef.current?.click()} className="w-full justify-start" disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Notes
          </Button>
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="non-parsable-dir"
              checked={isNonParsable}
              onCheckedChange={() => setIsNonParsable(!isNonParsable)}
            />
            <label
              htmlFor="non-parsable-dir"
              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Document contains images of text
            </label>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
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
