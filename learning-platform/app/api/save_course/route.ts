import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { course_name, modules } = body

    // Get cookies for authentication
    const cookies = req.cookies.getAll()
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")

    // Forward the request to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/save_course`

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        course_name,
        modules,
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving course:", error)
    return NextResponse.json({ error: "Failed to save course" }, { status: 500 })
  }
}
