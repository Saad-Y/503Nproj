import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const docName = request.nextUrl.searchParams.get("doc_name")

    if (!docName) {
      return NextResponse.json({ error: "Document name is required" }, { status: 400 })
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_API_URL}/fetch_notes?doc_name=${encodeURIComponent(docName)}`,
      {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
        credentials: "include",
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}
