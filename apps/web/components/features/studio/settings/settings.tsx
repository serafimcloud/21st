"use client"

import { useState } from "react"
import { User } from "@/types/global"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  Globe,
  BellRing,
  Shield,
  Key,
  Trash2,
  Upload,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface StudioSettingsProps {
  user: User
}

export function StudioSettings({ user }: StudioSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user.display_name || user.name || "",
    displayUsername: user.display_username || user.username || "",
    bio: user.bio || "",
    website: user.website || "",
    email: user.email || "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Save profile changes
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your author profile and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Author Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your author profile information visible to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      src={
                        user.display_image_url ||
                        user.image_url ||
                        "/placeholder.svg"
                      }
                      alt={user.display_name || user.name || ""}
                      size={80}
                    />
                    <div>
                      <h3 className="font-medium text-lg">
                        {formData.displayName}
                      </h3>
                      <p className="text-muted-foreground">
                        @{formData.displayUsername}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Bio</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.bio || "No bio provided."}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Website</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.website || "No website provided."}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Contact Email</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.email || "No contact email provided."}
                    </p>
                  </div>

                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      src={
                        user.display_image_url ||
                        user.image_url ||
                        "/placeholder.svg"
                      }
                      alt={user.display_name || user.name || ""}
                      size={80}
                    />
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Change Avatar
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF. 1MB max.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayUsername">Display Username</Label>
                      <Input
                        id="displayUsername"
                        name="displayUsername"
                        value={formData.displayUsername}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell others about yourself and your components"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="public@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      This email will be visible to users. Use a different email
                      than your login email if needed.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Author Verification</CardTitle>
              <CardDescription>
                Get verified as an authentic component author
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert
                variant="default"
                className="bg-primary/10 border-primary/20"
              >
                <Shield className="h-4 w-4" />
                <AlertTitle>Verified Status</AlertTitle>
                <AlertDescription>
                  You are not verified yet. Verified authors get priority
                  placement and increased visibility.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">
                  Requirements for verification:
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>At least 5 published components</li>
                  <li>Components with high quality ratings</li>
                  <li>Consistent activity over 3+ months</li>
                  <li>Complete profile information</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled>
                Apply for Verification
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-email">Account Email</Label>
                <Input id="account-email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground">
                  This is the email associated with your account login.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Connected Accounts</Label>
                <div className="rounded-md border p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src="/github.svg" alt="GitHub" className="h-5 w-5" />
                      <div>
                        <p className="font-medium">GitHub</p>
                        <p className="text-xs text-muted-foreground">
                          Connect your GitHub account to showcase your
                          repositories
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your account will remove all your components,
                  earnings history, and account data. This action cannot be
                  undone.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-2">
                  Email Notifications
                </h4>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="comments">Comments on Components</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when someone comments on your components
                    </p>
                  </div>
                  <Switch id="comments" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="downloads">Component Downloads</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails for significant download milestones
                    </p>
                  </div>
                  <Switch id="downloads" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="earnings">Earnings Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about your earnings and payouts
                    </p>
                  </div>
                  <Switch id="earnings" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">Marketing & Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      News, updates, and marketing communications about 21st.dev
                    </p>
                  </div>
                  <Switch id="marketing" />
                </div>

                <Separator />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-2">
                  In-App Notifications
                </h4>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="in-app-comments">Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when someone comments on your components
                    </p>
                  </div>
                  <Switch id="in-app-comments" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="in-app-downloads">Downloads</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify for component download milestones
                    </p>
                  </div>
                  <Switch id="in-app-downloads" defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="in-app-earnings">Earnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about earnings and payouts
                    </p>
                  </div>
                  <Switch id="in-app-earnings" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">
                  Password is managed through your authentication provider.
                </p>
                <Button variant="outline" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">
                  Two-Factor Authentication
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">
                      Enable two-factor authentication for added security
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with an additional security layer
                    </p>
                  </div>
                  <Switch id="2fa" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Session Management</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your active sessions and sign out from other devices.
                </p>
                <Button variant="outline">Manage Sessions</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to your components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                API access will be available soon for Pro and Enterprise
                authors.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled>
                Generate API Key
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
