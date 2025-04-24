"use client"

import type React from "react"
import { ChatButton } from "@/components/chat-button"
import { usePathname } from "next/navigation"

export function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ClientChatButton />
    </>
  )
}

// Client component to conditionally render the chat button
function ClientChatButton() {
  const pathname = usePathname()

  // Don't show chat button on auth pages
  if (pathname?.startsWith("/auth")) {
    return null
  }

  return (
    <ChatButton
      initialMessage={`👋 Hi there! I'm your LearnHub assistant. I can help you with:

- Finding courses
- Answering questions about your learning journey
- Navigating the platform (just ask me to "go to" any page)

How can I assist you today?`}
    />
  )
}
