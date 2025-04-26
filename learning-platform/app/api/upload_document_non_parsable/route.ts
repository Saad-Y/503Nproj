import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const response = await fetch(`${process.env.DOCUMENTS_API_URL}/upload_document_non_parsable`, {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      body: formData,
      credentials: "include",
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
