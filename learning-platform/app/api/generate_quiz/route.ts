import { type NextRequest, NextResponse } from "next/server"

// Mock authentication - in a real app, this would verify the user's session
const getUsername = () => "demo_user"

export async function POST(request: NextRequest) {
  try {
    const username = getUsername()
    const data = await request.json()

    if (!data.document_id && !data.topic) {
      return NextResponse.json({ error: "Either document_id or topic is required" }, { status: 400 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/generate_quiz`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "X-Username": username,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate quiz: ${response.statusText}`)
    }

    const quizData = await response.json()
    return NextResponse.json(quizData)
  } catch (error) {
    console.error("Error generating quiz:", error)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
