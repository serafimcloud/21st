"use client"

import { FC, useState, useEffect } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import type { PostgrestSingleResponse } from "@supabase/supabase-js"
import { Input } from "@/components/ui/input"

type SubmissionStatus = "on_review" | "featured" | "posted"

type Submission = {
  id: number
  name: string
  preview_url: string
  video_url: string
  updated_at: string
  demo_slug: string
  component_data: {
    id: number
    name: string
    component_slug: string
    downloads_count: number
    likes_count: number
    license: string
    registry: string
    is_paid: boolean
    price: number
  }
  user_data: {
    id: string
    username: string
    display_name: string
    display_username: string
  }
  component_user_data: any
  total_count: number
  view_count: number
  bookmarks_count: number
  bundle_url: {
    html: string
  } | null
  submission_status: string | null
  moderators_feedback: string | null
}

interface AdminRpcResponse {
  success: boolean
  error?: string
}

// Adding interface for RPC parameters
interface UpdateSubmissionParams {
  p_component_id: number
  p_status: SubmissionStatus
  p_feedback: string
  p_demo_name: string
  p_demo_slug: string
}

// Adding interface for demo edit parameters
interface UpdateDemoParams {
  p_component_id: number
  p_demo_name: string
  p_demo_slug: string
}

const SubmissionsAdminPage: FC = () => {
  const isAdmin = useIsAdmin()
  const supabase = useClerkSupabaseClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("on_review")
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
  // Remove from main modal state
  // const [demoName, setDemoName] = useState("")
  // const [demoSlug, setDemoSlug] = useState("")

  // Add edit demo modal state
  const [editingDemo, setEditingDemo] = useState<Submission | null>(null)
  const [editDemoName, setEditDemoName] = useState("")
  const [editDemoSlug, setEditDemoSlug] = useState("")

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions()
    } else {
      setLoading(false)
    }
  }, [filter, isAdmin])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      let query = supabase.rpc("get_demos_submissions", {
        p_sort_by: "date",
        p_offset: 0,
        p_limit: 100,
        p_include_private: true,
      })

      const { data, error } = await query

      if (error) {
        throw error
      }

      let filteredData = data
      if (filter !== "all") {
        filteredData = data.filter((item: any) =>
          filter === "null"
            ? !item.submission_status
            : item.submission_status === filter,
        )
      }

      setSubmissions(filteredData as Submission[])
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (
    componentId: number,
    status: SubmissionStatus,
  ) => {
    try {
      // Используем только параметры для статуса и фидбека, без демо
      const params = {
        p_component_id: componentId,
        p_status: status,
        p_feedback: feedback || "", // Use empty string instead of null
      }

      const response = (await supabase.rpc(
        "update_submission_as_admin",
        params,
      )) as PostgrestSingleResponse<AdminRpcResponse>

      const { data, error } = response

      if (error) {
        throw error
      }

      if (data && !data.success) {
        throw new Error(data.error || "Failed to update submission")
      }

      toast.success(`Submission status updated to ${status}`)

      // Обновляем локальное состояние вместо полной перезагрузки
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.component_data.id === componentId
            ? {
                ...sub,
                submission_status: status,
                moderators_feedback: feedback || "",
              }
            : sub,
        ),
      )

      setSelectedSubmission(null)
      setFeedback("")
    } catch (error: unknown) {
      console.error("Error updating submission:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update submission status"
      toast.error(errorMessage)
    }
  }

  // Add new function for updating demo info
  const updateDemoInfo = async (
    componentId?: number,
    name?: string,
    slug?: string,
  ) => {
    if (!editingDemo && !componentId) return

    try {
      // Используем только необходимые параметры без статуса и фидбека
      const demoParams = {
        p_component_id: componentId || editingDemo!.component_data.id,
        p_demo_name: name || editDemoName,
        p_demo_slug: slug || editDemoSlug,
      }

      const response = (await supabase.rpc(
        "update_demo_info_as_admin",
        demoParams,
      )) as PostgrestSingleResponse<AdminRpcResponse>

      const { data, error } = response

      if (error) {
        throw error
      }

      if (data && !data.success) {
        throw new Error(data.error || "Failed to update demo information")
      }

      toast.success("Demo information updated successfully")

      // Обновляем локальное состояние вместо полной перезагрузки
      const updatedName = name || editDemoName
      const updatedSlug = slug || editDemoSlug
      const targetId = componentId || editingDemo!.component_data.id

      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.component_data.id === targetId
            ? {
                ...sub,
                name: updatedName,
                demo_slug: updatedSlug,
              }
            : sub,
        ),
      )

      setEditingDemo(null)
      setEditDemoName("")
      setEditDemoSlug("")
    } catch (error: unknown) {
      console.error("Error updating demo information:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update demo information"
      toast.error(errorMessage)
    }
  }

  // Add a direct update function that doesn't require the dialog to be open
  const updateDemoInfoDirect = async (
    componentId: number,
    name: string,
    slug: string,
  ) => {
    try {
      const demoParams = {
        p_component_id: componentId,
        p_demo_name: name,
        p_demo_slug: slug,
      }

      const response = (await supabase.rpc(
        "update_demo_info_as_admin",
        demoParams,
      )) as PostgrestSingleResponse<AdminRpcResponse>

      const { data, error } = response

      if (error) {
        throw error
      }

      if (data && !data.success) {
        throw new Error(data.error || "Failed to update demo information")
      }

      toast.success("Demo information updated to defaults")

      // Обновляем локальное состояние вместо полной перезагрузки
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.component_data.id === componentId
            ? {
                ...sub,
                name: name,
                demo_slug: slug,
              }
            : sub,
        ),
      )
    } catch (error: unknown) {
      console.error("Error updating demo information:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update demo information"
      toast.error(errorMessage)
    }
  }

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.moderators_feedback || "")
  }

  // Add handler for edit demo button
  const handleEditDemo = (submission: Submission) => {
    setEditingDemo(submission)
    setEditDemoName(submission.name || "")
    setEditDemoSlug(submission.demo_slug || "")
  }

  // Add handler for setting default demo values
  const handleSetDefaultDemo = (submission: Submission) => {
    // Don't set editingDemo to prevent dialog from opening
    // Instead, directly call the update function with parameters

    // Устанавливаем фиксированные значения "Default" и "default"
    // вместо значений из компонента
    const defaultName = "Default"
    const defaultSlug = "default"

    // Auto-save immediately without opening dialog
    updateDemoInfoDirect(submission.component_data.id, defaultName, defaultSlug)
  }

  const getStatusAsEnum = (status: string | null): SubmissionStatus => {
    if (!status) return "on_review"
    return status as SubmissionStatus
  }

  // Non-admin placeholder
  if (!isAdmin) {
    return (
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center text-center space-y-6 py-12"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-12a3 3 0 00-3 3v12a3 3 0 003 3h6a3 3 0 003-3V6a3 3 0 00-3-3h-6z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-gray-500 max-w-md">
            You don't have access to this page. Please contact an administrator
            if you believe this is an error.
          </p>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Component Submissions</h1>
          <div className="flex items-center space-x-4">
            <Select value={filter} onValueChange={(value) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="null">No Status</SelectItem>
                <SelectItem value="on_review">On Review</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchSubmissions}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {submissions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No submissions found</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4">
                      {submission.preview_url && (
                        <div className="aspect-video rounded-md overflow-hidden">
                          <img
                            src={submission.preview_url}
                            alt={submission.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <div className="md:w-3/4 space-y-4">
                      <div className="flex justify-between">
                        <h2 className="text-xl font-semibold">
                          {submission.name || submission.component_data.name}
                        </h2>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              !submission.submission_status
                                ? "bg-gray-200 text-gray-800"
                                : submission.submission_status === "on_review"
                                  ? "bg-yellow-200 text-yellow-800"
                                  : submission.submission_status === "posted"
                                    ? "bg-green-200 text-green-800"
                                    : "bg-blue-200 text-blue-800"
                            }`}
                          >
                            {submission.submission_status || "No Status"}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p>
                            By:{" "}
                            {submission.user_data.display_name ||
                              submission.user_data.username}
                          </p>
                          <p>Component ID: {submission.component_data.id}</p>
                          <p>
                            Submitted:{" "}
                            {new Date(
                              submission.updated_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Component:</span>{" "}
                            {submission.component_data.name}
                          </p>
                          <p>
                            <span className="font-medium">Component Slug:</span>{" "}
                            <span className="font-mono text-xs">
                              {submission.component_data.component_slug}
                            </span>
                          </p>
                          <p>
                            <span className="font-medium">Demo Name:</span>{" "}
                            {submission.name || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Demo Slug:</span>{" "}
                            <span className="font-mono text-xs">
                              {submission.demo_slug || "—"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {submission.moderators_feedback && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium">Feedback:</p>
                          <p className="text-sm text-gray-600">
                            {submission.moderators_feedback}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 pt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/${submission.user_data.username}/${submission.component_data.component_slug}/${submission.demo_slug}`}
                            target="_blank"
                          >
                            View Component
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectSubmission(submission)}
                        >
                          Manage Submission
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDemo(submission)}
                        >
                          Edit Demo Info
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetDefaultDemo(submission)}
                        >
                          Set Default Demo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal for managing submission */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                Manage Submission:{" "}
                {selectedSubmission.name ||
                  selectedSubmission.component_data.name}
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={selectedSubmission.submission_status || "on_review"}
                  onValueChange={(value: any) => {
                    setSelectedSubmission({
                      ...selectedSubmission,
                      submission_status: value,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_review">On Review</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">
                  Feedback to Author
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the author"
                  className="h-32"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSubmission(null)
                    setFeedback("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateSubmissionStatus(
                      selectedSubmission.component_data.id,
                      getStatusAsEnum(selectedSubmission.submission_status),
                    )
                  }
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Separate modal for editing demo info */}
        {editingDemo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Edit Demo Information</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Demo Name
                </label>
                <Input
                  value={editDemoName}
                  onChange={(e) => setEditDemoName(e.target.value)}
                  placeholder="Demo name"
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Demo Slug
                </label>
                <Input
                  value={editDemoSlug}
                  onChange={(e) => setEditDemoSlug(e.target.value)}
                  placeholder="demo-slug"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL will be: /{editingDemo.user_data.username}/
                  {editingDemo.component_data.component_slug}/{editDemoSlug}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingDemo(null)
                    setEditDemoName("")
                    setEditDemoSlug("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => updateDemoInfo()}>Save Changes</Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default SubmissionsAdminPage
