import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required" },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .or(`username.eq.${username},display_username.eq.${username}`)
      .single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    const userId = session?.userId
    console.log("PATCH request received, userId:", userId)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("Request body:", body)

    const targetUsername = body.target_username
    console.log("Target username:", targetUsername)

    const {
      display_name,
      display_username,
      display_image_url,
      bio,
      website_url,
      github_url,
      twitter_url,
      paypal_email,
    } = body

    console.log("Extracted paypal_email:", paypal_email)

    let targetUserId = userId
    if (targetUsername) {
      console.log("Looking up user by username:", targetUsername)
      const { data: userData, error: userError } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(
          `username.eq.${targetUsername},display_username.eq.${targetUsername}`,
        )
        .single()

      if (userError || !userData) {
        console.error("Error finding user by username:", userError)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const { data: currentUser, error: currentUserError } = await supabaseAdmin
        .from("users")
        .select("is_admin")
        .eq("id", userId)
        .single()

      if (currentUserError || !currentUser) {
        console.error("Error checking admin status:", currentUserError)
        return NextResponse.json(
          { error: "Failed to verify permissions" },
          { status: 500 },
        )
      }

      if (!currentUser.is_admin) {
        return NextResponse.json(
          { error: "Unauthorized to update other users" },
          { status: 403 },
        )
      }

      targetUserId = userData.id
      console.log("Found target user ID:", targetUserId)
    }

    if (display_username && !/^[a-zA-Z0-9_-]+$/.test(display_username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      )
    }

    if (display_username) {
      const { data: existingUsers, error: queryError } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(
          `username.eq."${display_username}",display_username.eq."${display_username}"`,
        )
        .neq("id", targetUserId)

      if (queryError) {
        console.error("Username validation error:", queryError)
        return NextResponse.json(
          { error: "Failed to validate username" },
          { status: 500 },
        )
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 },
        )
      }
    }

    if (paypal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypal_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      )
    }

    const processUrl = (url: string | null) => {
      if (!url) return null
      if (url.startsWith("http://") || url.startsWith("https://")) return url
      return `https://${url}`
    }

    let finalImageUrl = display_image_url
    if (display_image_url?.startsWith("data:image")) {
      try {
        const base64Data = display_image_url.split(",")[1]
        const buffer = Buffer.from(base64Data, "base64")

        const fileExt = display_image_url.split(";")[0].split("/")[1]
        const fileName = `${targetUserId}/avatar.${fileExt}`

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage.from("users").upload(fileName, buffer, {
            contentType: `image/${fileExt}`,
            upsert: true,
          })

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 },
          )
        }

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from("users").getPublicUrl(fileName)

        finalImageUrl = publicUrl
      } catch (error) {
        console.error("Error processing image:", error)
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 500 },
        )
      }
    }

    const updateData: Record<string, any> = {}

    if (display_name !== undefined)
      updateData.display_name = display_name || null
    if (display_username !== undefined)
      updateData.display_username = display_username || null
    if (finalImageUrl !== undefined)
      updateData.display_image_url = finalImageUrl || null
    if (bio !== undefined) updateData.bio = bio || null
    if (website_url !== undefined)
      updateData.website_url = processUrl(website_url)
    if (github_url !== undefined) updateData.github_url = processUrl(github_url)
    if (twitter_url !== undefined)
      updateData.twitter_url = processUrl(twitter_url)

    if (paypal_email !== undefined) {
      updateData.paypal_email = paypal_email || null
      console.log("Adding paypal_email to updateData:", paypal_email)
    }

    console.log("Final updateData:", updateData)

    if (Object.keys(updateData).length === 0) {
      console.log("No data to update")
      return NextResponse.json({ success: true, message: "No data to update" })
    }

    console.log(`Updating user with ID ${targetUserId} with data:`, updateData)

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", targetUserId)
      .select()

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      )
    }

    console.log("Update successful, updated data:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
