"use client"

import { useState } from "react"
import { Header } from "@/components/ui/header.client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Tables } from "@/types/supabase"

type Component = Tables<"components">

interface StudioClientProps {
  initialComponents: Component[]
}

export function StudioClient({ initialComponents }: StudioClientProps) {
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [componentCode, setComponentCode] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const supabase = useClerkSupabaseClient()
  const router = useRouter()

  const handlePublish = async () => {
    if (!componentCode.trim()) {
      toast.error("Please enter component code")
      return
    }

    setIsPublishing(true)
    try {
      // Here you would add the logic to parse and validate the component code
      // Then save it to the database
      const { error } = await supabase.from("components").insert({
        code: componentCode,
        name: "New Component", // Required field
        component_names: {}, // Required field
        component_slug: "new-component", // Required field
        preview_url: "https://placeholder.com", // Required field
        user_id: "user_id", // Will be set by RLS
        direct_registry_dependencies: {}, // Required field
        demo_direct_registry_dependencies: {}, // Required field
      })

      if (error) throw error

      toast.success("Component published successfully")
      setIsPublishOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to publish component")
      console.error("Error publishing component:", error)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Studio</h1>
          <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Publish Component
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
              <DialogHeader>
                <DialogTitle>Publish New Component</DialogTitle>
                <DialogDescription>
                  Paste your component code below. Make sure it follows our
                  guidelines and includes all necessary imports.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Paste your component code here..."
                  value={componentCode}
                  onChange={(e) => setComponentCode(e.target.value)}
                  className="h-[400px] font-mono"
                />
                <Button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full"
                >
                  {isPublishing ? "Publishing..." : "Publish Component"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialComponents.map((component) => (
                <TableRow key={component.id}>
                  <TableCell className="font-medium">
                    {component.name}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(component.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {component.downloads_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {component.likes_count}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {initialComponents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No components published yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
