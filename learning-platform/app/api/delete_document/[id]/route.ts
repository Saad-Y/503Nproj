import { type NextRequest, NextResponse } from "next/server"

// Mock authentication - in a real app, this would verify the user's session
const getUsername = () => "demo_user"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const username = getUsername()
    const id = params.id

    const response = await fetch(`${process.env.BACKEND_URL}/delete_document/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
        "X-Username": username,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
