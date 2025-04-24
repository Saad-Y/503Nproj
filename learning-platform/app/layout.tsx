import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientRootLayout } from "./ClientRootLayout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LearnHub - Online Learning Platform",
  description: "Discover thousands of courses taught by expert instructors to help you master new skills.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ClientRootLayout>{children}</ClientRootLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
