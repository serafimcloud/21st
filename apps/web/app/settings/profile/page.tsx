"use client"

import { useState, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null)
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
    }
  }, [isUserLoading, dbUser, user, form])

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

      toast.success("Profile updated successfully")

      // Reload page to show changes
      window.location.reload()
    } catch (error) {
      console.error("Update error:", error)
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <div className="flex justify-between mb-4 gap-4">
              <div>
                <h2 className="text-sm font-medium">Profile</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage how others see you on the platform
                </p>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-8 relative transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading && (
                    <LoaderCircle
                      className="animate-spin"
                      aria-hidden="true"
                      size={14}
                    />
                  )}
                  Save changes
                </div>
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Basic information</h3>

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
          </div>
        </form>
      </Form>
    </div>
  )
}
