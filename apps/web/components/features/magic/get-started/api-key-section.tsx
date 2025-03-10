"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { ApiKey } from "@/types/global"
import { toast } from "sonner"
import {
  LoaderCircle,
  Lock,
  Check,
  Copy
} from "lucide-react"

import { TermsDialog } from "@/components/features/api/terms-dialog"

interface ApiKeySectionProps {
  apiKey: ApiKey | null
  setApiKey: (key: ApiKey | null) => void
  userId: string | null
}

export function ApiKeySection({
  apiKey,
  setApiKey,
  userId,
}: ApiKeySectionProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const supabase = useClerkSupabaseClient()

  const createApiKey = async () => {
    toast.info("Creating API key...")

    if (!userId) {
      toast.error("You must be logged in to create an API key")
      return
    }

    setLoading(true)
    try {
      toast.loading("Creating your API key...")

      const { data, error } = await supabase.rpc("create_api_key", {
        user_id: userId,
        plan: "free",
        requests_limit: 100,
      })

      if (error) {
        toast.error(`Failed to create API key: ${error.message}`)
        throw error
      }

      if (!data || !data.key) {
        toast.error("Server returned invalid response")
        throw new Error("No API key returned from server")
      }

      const newKey: ApiKey = {
        id: data.id,
        key: data.key,
        user_id: data.user_id,
        plan: data.plan || "free",
        requests_limit: data.requests_limit || 100,
        requests_count: data.requests_count || 0,
        created_at: data.created_at || new Date().toISOString(),
        expires_at: data.expires_at,
        last_used_at: data.last_used_at,
        is_active: data.is_active ?? true,
        project_url: "https://21st.dev/magic",
      }

      setApiKey(newKey)
      await navigator.clipboard.writeText(newKey.key)

      toast.success("API key created and copied to clipboard")
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Failed to create API key: ${error.message}`)
      } else {
        toast.error("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
      setShowTerms(false)
      toast.dismiss()
    }
  }

  const copyToClipboard = async () => {
    if (!apiKey) {
      return
    }
    try {
      await navigator.clipboard.writeText(apiKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("API key copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy API key")
    }
  }

  if (!userId) {
    return (
      <div className="flex justify-start">
        <Button
          onClick={() => {
            window.location.href = `https://accounts.21st.dev/sign-in?redirect_url=${encodeURIComponent("https://21st.dev/magic/console")}`
          }}
          variant="default"
        >
          Sign In
        </Button>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <>
        <Button
          onClick={() => setShowTerms(true)}
          disabled={loading}
          variant="default"
          className="w-[140px] bg-black text-white hover:bg-black/90"
        >
          {loading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          Create API Key
        </Button>

        <TermsDialog
          open={showTerms}
          onAccept={() => {
            createApiKey()
          }}
          onClose={() => setShowTerms(false)}
        />
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-card space-y-4">
        <div className="relative">
          <div className="flex items-center gap-2 bg-muted p-1 rounded-md w-full max-w-[650px]">
            <code className="flex-1 font-mono text-muted-foreground text-sm tracking-wider overflow-hidden pl-1">
              {apiKey.key
                .split("")
                .map(() => "•")
                .join("")}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
