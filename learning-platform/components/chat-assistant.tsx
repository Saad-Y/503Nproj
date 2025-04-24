"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Send, Bot, User, Loader2, X, Maximize2, Minimize2, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface ChatAssistantProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
  contextInfo?: string
}

export function ChatAssistant({ isOpen, onClose, initialMessage, contextInfo }: ChatAssistantProps) {
  const router = useRouter()
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    initialMessages: initialMessage ? [{ id: "welcome", role: "assistant", content: initialMessage }] : [],
    body: contextInfo ? { contextInfo } : undefined,
    onFinish: (message) => {
      // Check if the message contains a navigation command
      checkForNavigationCommand(message.content)
    },
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationTarget, setNavigationTarget] = useState("")

  // Function to check for navigation commands in the AI's response
  const checkForNavigationCommand = (content: string) => {
    // Look for patterns like [GO:homepage], [GO:courses], etc.
    const navigationRegex = /\[GO:([\w-/]+)\]/i
    const match = content.match(navigationRegex)

    if (match && match[1]) {
      const destination = match[1].toLowerCase()
      setNavigationTarget(destination)
      setIsNavigating(true)

      // Add a small delay to allow the user to see the message before navigating
      setTimeout(() => {
        navigateTo(destination)
      }, 1500)
    }
  }

  // Function to handle navigation
  const navigateTo = (destination: string) => {
    // Map common destinations to their routes
    const routes: Record<string, string> = {
      home: "/dashboard",
      homepage: "/dashboard",
      index: "/dashboard",
      courses: "/courses",
      dashboard: "/dashboard",
      profile: "/profile",
      settings: "/settings",
    }

    // Check if the destination is a course ID (e.g., course-1, course1)
    const courseRegex = /^course-?(\d+)$/i
    const courseMatch = destination.match(courseRegex)

    if (courseMatch && courseMatch[1]) {
      router.push(`/courses/${courseMatch[1]}`)
    } else if (routes[destination]) {
      router.push(routes[destination])
    } else if (destination.startsWith("/")) {
      // If it starts with a slash, assume it's a direct path
      router.push(destination)
    } else {
      // Default to homepage if destination is not recognized
      router.push("/")
    }

    // Reset navigation state
    setIsNavigating(false)
    setNavigationTarget("")

    // Close the chat after navigation
    onClose()
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isMinimized])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-lg shadow-xl border transition-all duration-200 ease-in-out",
        isMinimized ? "w-72 h-16" : "w-80 sm:w-96 h-[600px] max-h-[80vh]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Learning Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start gap-2 max-w-[90%]", message.role === "user" ? "ml-auto" : "mr-auto")}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full shrink-0",
                    message.role === "user" ? "bg-primary text-primary-foreground order-last" : "bg-muted",
                  )}
                >
                  {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {/* Replace [GO:destination] with a button */}
                  {message.role === "assistant" ? (
                    <div>
                      {message.content.split(/(\[GO:[^\]]+\])/).map((part, index) => {
                        const goMatch = part.match(/\[GO:([\w-/]+)\]/)
                        if (goMatch) {
                          const destination = goMatch[1]
                          return (
                            <Button
                              key={index}
                              variant="link"
                              className="p-0 h-auto text-primary-foreground underline flex items-center gap-1"
                              onClick={() => navigateTo(destination)}
                            >
                              <Navigation className="h-3 w-3" />
                              Go to {destination.replace(/-/g, " ")}
                            </Button>
                          )
                        }
                        return <span key={index}>{part}</span>
                      })}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2 max-w-[90%] mr-auto">
                <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted text-foreground">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {isNavigating && (
              <div className="flex items-start gap-2 max-w-[90%] mr-auto">
                <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 bg-muted">
                  <Navigation className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-primary text-primary-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Navigating to {navigationTarget}...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading || isNavigating}
              />
              <Button type="submit" size="sm" disabled={isLoading || isNavigating || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
