import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend with cookies for authentication
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/documents`, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      credentials: "include",
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
