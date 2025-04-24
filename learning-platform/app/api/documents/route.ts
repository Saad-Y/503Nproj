import { type NextRequest, NextResponse } from "next/server"

// Mock authentication - in a real app, this would verify the user's session
const getUsername = () => "demo_user"

export async function GET(request: NextRequest) {
  try {
    const username = getUsername()

    const response = await fetch(`${process.env.BACKEND_URL}/documents`, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "X-Username": username,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
