import { useState, useEffect } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { Submission, SubmissionStatus, AdminRpcResponse } from "../types"
import type { PostgrestSingleResponse } from "@supabase/supabase-js"

export const useSubmissions = (isAdmin: boolean) => {
  const supabase = useClerkSupabaseClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("on_review")
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
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

  const sendStatusNotification = async (
    submission: Submission,
    status: SubmissionStatus,
    feedback?: string,
  ) => {
    try {
      const response = await fetch("/api/emails/submission-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submission,
          status,
          feedback,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send notification")
      }

      console.log(`✅ Notification sent successfully for status: ${status}`)
      return true
    } catch (error) {
      console.error("Error sending notification:", error)
      // Не показываем ошибку пользователю, просто логируем
      return false
    }
  }

  const updateSubmissionStatus = async (
    componentId: number,
    status: SubmissionStatus,
  ) => {
    try {
      const params = {
        p_component_id: componentId,
        p_status: status,
        p_feedback: feedback || "",
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

      // Find the submission that was updated
      const updatedSubmission = submissions.find(
        (sub) => sub.component_data.id === componentId,
      )

      // Update local state
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

      // Send email notification if we found the submission
      if (updatedSubmission) {
        // Вызываем серверный API для отправки уведомления
        sendStatusNotification(
          updatedSubmission,
          status,
          feedback || undefined,
        ).catch((emailError) => {
          console.error("Error sending status update email:", emailError)
        })
      }

      toast.success(`Submission status updated to ${status}`)
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

  const updateDemoInfo = async () => {
    if (!editingDemo) return

    try {
      const demoParams = {
        p_component_id: editingDemo.component_data.id,
        p_demo_name: editDemoName,
        p_demo_slug: editDemoSlug,
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

      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.component_data.id === editingDemo.component_data.id
            ? {
                ...sub,
                name: editDemoName,
                demo_slug: editDemoSlug,
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

  const handleEditDemo = (submission: Submission) => {
    setEditingDemo(submission)
    setEditDemoName(submission.name || "")
    setEditDemoSlug(submission.demo_slug || "")
  }

  const handleSetDefaultDemo = (submission: Submission) => {
    const defaultName = "Default"
    const defaultSlug = "default"
    updateDemoInfoDirect(submission.component_data.id, defaultName, defaultSlug)
  }

  const getStatusAsEnum = (status: string | null): SubmissionStatus => {
    if (!status) return "on_review"
    return status as SubmissionStatus
  }

  return {
    submissions,
    loading,
    filter,
    selectedSubmission,
    feedback,
    editingDemo,
    editDemoName,
    editDemoSlug,
    setFilter,
    setFeedback,
    setSelectedSubmission,
    setEditDemoName,
    setEditDemoSlug,
    setEditingDemo,
    fetchSubmissions,
    updateSubmissionStatus,
    updateDemoInfo,
    handleSelectSubmission,
    handleEditDemo,
    handleSetDefaultDemo,
    getStatusAsEnum,
  }
}

export default useSubmissions
