import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    // Get cookies for authentication
    const cookies = req.cookies.getAll()
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")

    // Forward the request to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/enrolled_courses`

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return NextResponse.json({ error: "Failed to fetch enrolled courses" }, { status: 500 })
  }
}
