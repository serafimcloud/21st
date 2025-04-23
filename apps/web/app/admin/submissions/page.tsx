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

const SubmissionsAdminPage: FC = () => {
  const isAdmin = useIsAdmin()
  const supabase = useClerkSupabaseClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("on_review")
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")

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
      const response = (await supabase.rpc("update_submission_as_admin", {
        p_component_id: componentId,
        p_status: status,
        p_feedback: feedback || "", // Use empty string instead of null
      })) as PostgrestSingleResponse<AdminRpcResponse>

      const { data, error } = response

      if (error) {
        throw error
      }

      if (data && !data.success) {
        throw new Error(data.error || "Failed to update submission")
      }

      toast.success(`Submission status updated to ${status}`)
      await fetchSubmissions()
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

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission)
    setFeedback(submission.moderators_feedback || "")
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

                      <div className="text-sm text-gray-500">
                        <p>
                          By:{" "}
                          {submission.user_data.display_name ||
                            submission.user_data.username}
                        </p>
                        <p>Component ID: {submission.component_data.id}</p>
                        <p>
                          Submitted:{" "}
                          {new Date(submission.updated_at).toLocaleDateString()}
                        </p>
                      </div>

                      {submission.moderators_feedback && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium">Feedback:</p>
                          <p className="text-sm text-gray-600">
                            {submission.moderators_feedback}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-4 pt-4">
                        <Link
                          href={`/${submission.user_data.username}/${submission.component_data.component_slug}/${submission.demo_slug}`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                        >
                          View Component
                        </Link>

                        <button
                          onClick={() => handleSelectSubmission(submission)}
                          className="text-purple-600 hover:underline"
                        >
                          Manage Submission
                        </button>
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
      </motion.div>
    </div>
  )
}

export default SubmissionsAdminPage
