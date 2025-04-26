import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.student_status || !data.course || !data.platforms || data.platforms.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/generate_course`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(data),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to generate course: ${response.statusText}`)
    }

    const courseData = await response.json()
    return NextResponse.json(courseData)
  } catch (error) {
    console.error("Error generating course:", error)
    return NextResponse.json({ error: "Failed to generate course" }, { status: 500 })
  }
}
