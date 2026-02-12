import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
    const response = await fetch(`${apiUrl}/fetch-unlabeled`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching unlabeled activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch unlabeled activity" },
      { status: 500 }
    )
  }
}
