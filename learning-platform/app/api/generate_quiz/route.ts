import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.document_id && !data.topic) {
      return NextResponse.json({ error: "Either document_id or topic is required" }, { status: 400 })
    }

    const response = await fetch(`${process.env.DOCUMENTS_API_URL}/generate_quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(data),
      credentials: "include",
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
