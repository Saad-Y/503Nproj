import { type NextRequest, NextResponse } from "next/server"

// Mock authentication - in a real app, this would verify the user's session
const getUsername = () => "demo_user"

export async function POST(request: NextRequest) {
  try {
    const username = getUsername()

    const formData = await request.formData()

    const response = await fetch(`${process.env.BACKEND_URL}/upload_document_non_parsable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "X-Username": username,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
