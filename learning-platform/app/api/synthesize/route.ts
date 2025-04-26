import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ text: data.text }),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to synthesize speech: ${response.statusText}`)
    }

    // Get the audio file as a blob
    const audioBlob = await response.blob()

    // Return the audio file
    return new NextResponse(audioBlob, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error) {
    console.error("Error synthesizing speech:", error)
    return NextResponse.json({ error: "Failed to synthesize speech" }, { status: 500 })
  }
}
