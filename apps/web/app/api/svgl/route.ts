import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const type = searchParams.get("type")
  const svgUrl = searchParams.get("svg")

  if (svgUrl) {
    try {
      const response = await fetch(svgUrl)
      const svgText = await response.text()
      return new NextResponse(svgText, {
        headers: {
          "Content-Type": "image/svg+xml",
        },
      })
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to fetch SVG content" },
        { status: 500 },
      )
    }
  }

  let url = "https://api.svgl.app"

  if (type === "categories") {
    url += "/categories"
  } else {
    if (category && category !== "all") {
      const formattedCategory = category.toLowerCase()
      url = `https://api.svgl.app/category/${formattedCategory}`
    }
    if (search) {
      const searchParams = new URLSearchParams({ search })
      url += `?${searchParams.toString()}`
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from SVGL API: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("SVGL API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch from SVGL API" },
      { status: 500 },
    )
  }
}
