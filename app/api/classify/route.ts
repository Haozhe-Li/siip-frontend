import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    // Create new FormData for backend request
    const backendFormData = new FormData()
    backendFormData.append("file", file)

    // Get API URL from environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://siip-hcd-classifier-997139946856.us-central1.run.app"

    console.log("[v0] Forwarding request to backend:", `${apiUrl}/classify`)
    console.log("[v0] File name:", file.name)
    console.log("[v0] File size:", file.size)

    // Forward request to backend API
    const response = await fetch(`${apiUrl}/classify`, {
      method: "POST",
      body: backendFormData,
    })

    console.log("[v0] Backend response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error:", errorText)
      return NextResponse.json(
        { error: `Backend API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Backend response received successfully")

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
