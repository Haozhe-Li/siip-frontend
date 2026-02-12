import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
        const response = await fetch(`${apiUrl}/label-activity`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return NextResponse.json(
                { error: errorData.message || `Backend API error: ${response.status}` },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Error labeling activity:", error)
        return NextResponse.json(
            { error: "Failed to label activity" },
            { status: 500 }
        )
    }
}
