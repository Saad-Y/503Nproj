import { type NextRequest, NextResponse } from "next/server"

// Mock authentication - in a real app, this would verify the user's session
const getUsername = () => "demo_user"

export async function GET(request: NextRequest) {
  try {
    const username = getUsername()
    const docName = request.nextUrl.searchParams.get("doc_name")

    if (!docName) {
      return NextResponse.json({ error: "Document name is required" }, { status: 400 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/fetch_notes?doc_name=${encodeURIComponent(docName)}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "X-Username": username,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}
