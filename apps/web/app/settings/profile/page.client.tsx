"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Check,
  ImagePlus,
  X,
  Loader2,
  Upload,
  LoaderCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useImageUpload } from "@/hooks/use-image-upload"
import { useUserProfile } from "@/components/hooks/use-user-profile"
import { DeleteAccountDialog } from "@/components/ui/delete-account-dialog"

const profileFormSchema = z.object({
  display_name: z.string().min(2).max(50),
  use_custom_username: z.boolean().default(false),
  display_username: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens",
    })
    .optional(),
  display_image_url: z.string().url().optional().nullable(),
  bio: z.string().max(180).optional(),
  website_url: z.string().optional(),
  github_url: z.string().optional(),
  twitter_url: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const CLERK_ACCOUNT_URL =
  process.env.NODE_ENV === "development"
    ? "https://wanted-titmouse-48.accounts.dev/user"
    : "https://accounts.21st.dev/user"

export default function ProfileSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | null
  >(null)
  const [isVisible, setIsVisible] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const {
    user: dbUser,
    clerkUser: user,
    isLoading: isUserLoading,
  } = useUserProfile()

  const {
    previewUrl,
    isDragging,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useImageUpload()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: "",
      use_custom_username: false,
      display_username: "",
      display_image_url: "",
      bio: "",
      website_url: "",
      github_url: "",
      twitter_url: "",
    },
  })

  // Update form when user data is loaded
  useEffect(() => {
    if (!isUserLoading && dbUser && user) {
      form.reset({
        display_name: dbUser.display_name || user.fullName || "",
        use_custom_username: !!dbUser.display_username,
        display_username:
          dbUser.display_username || user.externalAccounts?.[0]?.username || "",
        display_image_url: dbUser.display_image_url || user.imageUrl || "",
        bio: dbUser.bio || "",
        website_url: dbUser.website_url?.replace(/^https?:\/\//, "") || "",
        github_url: dbUser.github_url?.replace(/^https?:\/\//, "") || "",
        twitter_url: dbUser.twitter_url?.replace(/^https?:\/\//, "") || "",
      })
      setIsFormInitialized(true)
    }
  }, [isUserLoading, dbUser, user, form])

  // Add debounced auto-save with status management
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Don't trigger save on form initialization
      if (type === "change") {
        setIsVisible(true)
        setSaveStatus("saving")

        // Clear previous save timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        // Clear previous hide timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
          onSubmit(form.getValues())
        }, 1000)
      }
    })
    return () => {
      subscription.unsubscribe()
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [form.watch])

  // Handle save status visibility
  useEffect(() => {
    if (saveStatus === "saved") {
      setIsVisible(true)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
    }
  }, [saveStatus])

  const useCustomUsername = form.watch("use_custom_username")

  const checkUsername = async (username: string) => {
    if (!username) {
      setIsUsernameValid(null)
      return
    }

    setIsCheckingUsername(true)
    try {
      const response = await fetch("/api/user/profile/check-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ display_username: username }),
      })
      const result = await response.json()
      setIsUsernameValid(!result.exists)
    } catch (error) {
      console.error("Error checking username:", error)
      setIsUsernameValid(null)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    setSaveStatus("saving")
    try {
      // Clean up empty strings
      const cleanData = {
        ...data,
        display_username: data.use_custom_username
          ? data.display_username
          : null,
        bio: data.bio || null,
        website_url: data.website_url || null,
        github_url: data.github_url || null,
        twitter_url: data.twitter_url || null,
        display_image_url: previewUrl || data.display_image_url || null,
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      setSaveStatus("saved")
    } catch (error) {
      console.error("Update error:", error)
      setSaveStatus("error")
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "container pb-4 px-0",
        isDragging && "ring-2 ring-primary ring-offset-2",
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={async (e) => {
        const base64String = await handleDrop(e)
        if (base64String) {
          form.setValue("display_image_url", base64String)
        }
      }}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <p>Drop image here to update avatar</p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Basic information</h3>
                {saveStatus && (
                  <div
                    className={cn(
                      "text-sm transition-opacity duration-300",
                      !isVisible && saveStatus === "saved" && "opacity-0",
                      saveStatus === "saving" && "text-muted-foreground",
                      saveStatus === "saved" && "text-green-500",
                      saveStatus === "error" && "text-red-500",
                    )}
                  >
                    {saveStatus === "saving" && (
                      <div className="flex items-center gap-2">
                        <LoaderCircle className="h-3 w-3 animate-spin" />
                        Saving
                      </div>
                    )}
                    {saveStatus === "saved" && (
                      <div className="flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        Saved
                      </div>
                    )}
                    {saveStatus === "error" && (
                      <div className="flex items-center gap-2">
                        <X className="h-3 w-3" />
                        Error
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pb-3">
                <UserAvatar
                  src={
                    previewUrl ||
                    form.getValues("display_image_url") ||
                    undefined
                  }
                  alt={form.getValues("display_name")}
                  size={72}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleThumbnailClick}
                    className="h-8 text-xs"
                  >
                    <ImagePlus className="mr-2 h-3.5 w-3.5" />
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Or drag and drop an image anywhere on the page
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const base64String = await handleFileChange(e)
                    if (base64String) {
                      form.setValue("display_image_url", base64String)
                    }
                  }}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        {useCustomUsername ? "Username" : "GitHub Username"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            value={
                              useCustomUsername
                                ? field.value
                                : user?.externalAccounts?.[0]?.username || ""
                            }
                            readOnly={!useCustomUsername}
                            className={cn(
                              "pr-10 h-9",
                              !useCustomUsername &&
                                "bg-muted text-muted-foreground",
                            )}
                            onChange={(e) => {
                              field.onChange(e)
                              checkUsername(e.target.value)
                            }}
                          />
                          {useCustomUsername && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              {isCheckingUsername && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                              {!isCheckingUsername &&
                                isUsernameValid === true && (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                              {!isCheckingUsername &&
                                isUsernameValid === false && (
                                  <X className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="use_custom_username"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-xs">
                          Use custom username
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={value ?? ""}
                          placeholder="Tell us about yourself"
                          className="resize-none h-20"
                          maxLength={180}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {180 - (value?.length || 0)} characters remaining
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium">Social links</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Website</FormLabel>
                      <FormControl>
                        <div className="flex rounded-lg shadow-sm shadow-black/5">
                          <span className="inline-flex items-center rounded-s-lg border border-input bg-background px-3 text-xs text-muted-foreground">
                            https://
                          </span>
                          <Input
                            {...field}
                            value={value ?? ""}
                            className="z-10 -ms-px rounded-s-none shadow-none h-9"
                            placeholder="yourwebsite.com"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="github_url"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-xs">GitHub URL</FormLabel>
                      <FormControl>
                        <div className="flex rounded-lg shadow-sm shadow-black/5">
                          <span className="inline-flex items-center rounded-s-lg border border-input bg-background px-3 text-xs text-muted-foreground">
                            https://
                          </span>
                          <Input
                            {...field}
                            value={value ?? ""}
                            className="z-10 -ms-px rounded-s-none shadow-none h-9"
                            placeholder="github.com/username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field: { value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Twitter URL</FormLabel>
                      <FormControl>
                        <div className="flex rounded-lg shadow-sm shadow-black/5">
                          <span className="inline-flex items-center rounded-s-lg border border-input bg-background px-3 text-xs text-muted-foreground">
                            https://
                          </span>
                          <Input
                            {...field}
                            value={value ?? ""}
                            className="z-10 -ms-px rounded-s-none shadow-none h-9"
                            placeholder="twitter.com/username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium">GitHub connection</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Edit your GitHub connection settings
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-8 text-xs"
                onClick={() => {
                  window.open(CLERK_ACCOUNT_URL, "_blank")
                }}
                type="button"
              >
                Manage GitHub connection
              </Button>
            </div>
            {/* Danger Zone Section */}
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="p-4">
                <h3 className="text-sm font-medium text-destructive">
                  Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>

              <div className="bg-muted p-3 rounded-b-lg flex justify-end border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setDeleteDialogOpen(true)}
                  type="button"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  )
}
