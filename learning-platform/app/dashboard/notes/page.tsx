import type { Metadata } from "next"
import { NotesPage } from "@/components/notes-page"

export const metadata: Metadata = {
  title: "My Notes | LearnHub",
  description: "Upload, manage, and study your notes",
}

export default function Notes() {
  return <NotesPage />
}
