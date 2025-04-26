import { redirect } from "next/navigation"

// Redirect to the auth page instead of homepage
export default function Index() {
  redirect("/auth")
}
