import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
    const response = await fetch(`${apiUrl}/label-stats`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching label stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch label stats" },
      { status: 500 }
    )
  }
}
