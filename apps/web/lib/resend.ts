// Client-side utility for newsletter and waitlist subscriptions

export async function addToAudience(
  email: string,
  type: "newsletter" | "magic-waitlist",
) {
  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, type }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to subscribe")
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error adding to audience:", error)
    return { success: false, error }
  }
}

export async function addToMagicWaitlist(email: string) {
  return addToAudience(email, "magic-waitlist")
}

export async function addToNewsletter(email: string) {
  return addToAudience(email, "newsletter")
}
