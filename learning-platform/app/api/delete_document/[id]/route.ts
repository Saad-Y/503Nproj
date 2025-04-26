import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/delete_document/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      credentials: "include",
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
