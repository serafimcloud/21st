"use client"

import { useState } from "react"
import { User } from "@/types/global"
import { Component } from "@/types/component"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ComponentPublishFormProps {
  user: User
  existingComponent?: Component
  onSuccess?: () => void
}

export function ComponentPublishForm({
  user,
  existingComponent,
  onSuccess,
}: ComponentPublishFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: existingComponent?.name || "",
    description: existingComponent?.description || "",
    code: existingComponent?.code || "",
    tags: existingComponent?.tags?.join(", ") || "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code) {
      toast({
        title: "Missing required fields",
        description: "Please provide a name and code for your component.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Call API to publish/update component
      toast({
        title: "Success!",
        description: existingComponent
          ? "Your component has been updated."
          : "Your component has been published.",
      })

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Component Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Animated Button"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your component and its usage"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g., button, animation, ui"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Component Code</Label>
        <Textarea
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="Paste your component code here"
          rows={12}
          className="font-mono text-sm"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Processing..."
            : existingComponent
              ? "Update Component"
              : "Publish Component"}
        </Button>
      </div>
    </form>
  )
}
