"use client"

import { useState } from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatAssistant } from "@/components/chat-assistant"

interface ChatButtonProps {
  initialMessage?: string
  contextInfo?: string
}

export function ChatButton({ initialMessage, contextInfo }: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Default initial message that includes navigation instructions
  const defaultInitialMessage = `👋 Hi there! I'm your LearnHub assistant. I can help you with:

- Finding courses
- Answering questions about your learning journey
- Navigating the platform (just ask me to "go to" any page)

How can I assist you today?`

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full h-12 w-12 shadow-lg"
        size="icon"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <ChatAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialMessage={initialMessage || defaultInitialMessage}
        contextInfo={contextInfo}
      />
    </>
  )
}
