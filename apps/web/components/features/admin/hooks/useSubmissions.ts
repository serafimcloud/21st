import { useState, useEffect, useCallback } from "react"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { toast } from "sonner"
import { Submission, SubmissionStatus, AdminRpcResponse } from "../types"
import type { PostgrestSingleResponse } from "@supabase/supabase-js"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export interface ContestRound {
  id: number
  week_number: number
  start_at: string
  end_at: string
  seasonal_tag_id: number | null
  created_at: string | null
}

export type DeleteMode = "submission" | "component" | null

export const useSubmissions = (isAdmin: boolean) => {
  const supabase = useClerkSupabaseClient()
  const queryClient = useQueryClient()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("on_review")
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
  const [editingDemo, setEditingDemo] = useState<Submission | null>(null)
  const [editDemoName, setEditDemoName] = useState("")
  const [editDemoSlug, setEditDemoSlug] = useState("")
  const [contestRoundLoading, setContestRoundLoading] = useState(false)
  const [isDeletingComponent, setIsDeletingComponent] = useState(false)
  const [componentToDelete, setComponentToDelete] = useState<Submission | null>(
    null,
  )

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Get current active round
  const { data: currentRound, isLoading: isCurrentRoundLoading } = useQuery({
    queryKey: ["current-contest-round"],
    queryFn: async () => {
      const now = new Date().toISOString()
      // First try to get active round
      const { data: activeRound } = await supabase
        .from("component_hunt_rounds")
        .select("*")
        .lte("start_at", now)
        .gte("end_at", now)
        .single()

      if (activeRound) return activeRound as ContestRound

      // If no active round, get the most recent past round
      const { data: pastRound } = await supabase
        .from("component_hunt_rounds")
        .select("*")
        .lte("start_at", now)
        .order("start_at", { ascending: false })
        .limit(1)
        .single()

      return pastRound as ContestRound
    },
    enabled: isAdmin,
  })

  // Get all contest rounds
  const { data: allRounds = [], isLoading: isAllRoundsLoading } = useQuery({
    queryKey: ["all-contest-rounds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("component_hunt_rounds")
        .select("*")
        .order("start_at", { ascending: false })

      if (error) {
        throw error
      }

      return data as ContestRound[]
    },
    enabled: isAdmin,
  })

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions()
    } else {
      setLoading(false)
    }
  }, [filter, isAdmin, currentPage, itemsPerPage])

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      // Fetch a large batch to ensure we get all submissions for filtering
      // In production, this should be handled server-side
      const largeBatch = 1000 // Fetch a large number to get all submissions

      let query = supabase.rpc("get_demos_submissions", {
        p_sort_by: "date",
        p_offset: 0,
        p_limit: largeBatch,
        p_include_private: true,
      })

      const { data, error } = await query

      if (error) {
        throw error
      }

      let filteredData = data

      // Apply status filter
      if (filter !== "all") {
        filteredData = data.filter((item: any) =>
          filter === "null"
            ? !item.submission_status
            : item.submission_status === filter,
        )
      }

      // Calculate total count for the current filter
      const totalFilteredCount = filteredData.length
      setTotalCount(totalFilteredCount)
      setTotalPages(Math.ceil(totalFilteredCount / itemsPerPage))

      // Apply pagination to filtered data
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = filteredData.slice(startIndex, endIndex)

      // Check contest participation status for each submission
      const enhancedData = await Promise.all(
        paginatedData.map(async (submission: any) => {
          const roundId = await checkContestParticipation(submission.id)
          const isPublic =
            submission.component_data &&
            typeof submission.component_data === "object"
              ? await checkIsPublic(submission.component_data.id)
              : false
          return {
            ...submission,
            contest_round_id: roundId,
            is_public: isPublic,
          }
        }),
      )

      setSubmissions(enhancedData as unknown as Submission[])
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const changeItemsPerPage = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Check if a demo is part of a contest round
  const checkContestParticipation = async (
    demoId: number,
  ): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from("demo_hunt_scores")
        .select("round_id")
        .eq("demo_id", demoId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No data found, not participating in any contest
          return null
        }
        throw error
      }

      return data?.round_id || null
    } catch (error) {
      console.error("Error checking contest participation:", error)
      return null
    }
  }

  // Get contest round details by ID
  const getRoundById = (roundId: number | null): ContestRound | null => {
    if (!roundId) return null
    return allRounds.find((round) => round.id === roundId) || null
  }

  // Add a demo to a specific contest round
  const addToContest = useCallback(
    async (demoId: number, roundId: number) => {
      if (!roundId) {
        toast.error("No contest round selected")
        return false
      }

      // Find round details
      const round = getRoundById(roundId)
      if (!round) {
        toast.error("Selected contest round not found")
        return false
      }

      setContestRoundLoading(true)
      try {
        // First check if it's already in any contest
        const existingRoundId = await checkContestParticipation(demoId)

        // If demo is already in the same round, just return
        if (existingRoundId === roundId) {
          toast.info("This demo is already in this contest round")
          return true
        }

        // If demo is in a different round, update its round_id instead of deleting and recreating
        if (existingRoundId) {
          const { error: updateError } = await supabase
            .from("demo_hunt_scores")
            .update({ round_id: roundId })
            .eq("demo_id", demoId)

          if (updateError) {
            throw updateError
          }

          console.log(
            `Changed demo ${demoId} round from ${existingRoundId} to ${roundId}`,
          )
        } else {
          // Demo is not in any contest yet, add a new record
          const { error } = await supabase.from("demo_hunt_scores").insert({
            demo_id: demoId,
            round_id: roundId,
            final_score: 0,
            installs: 0,
            views: 0,
            votes: 0,
          })

          if (error) {
            throw error
          }
        }

        // Update the local state
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((sub) =>
            sub.id === demoId ? { ...sub, contest_round_id: roundId } : sub,
          ),
        )

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["demo-hunt-submissions"] })

        // Show appropriate success message based on whether it was a move or a new addition
        if (existingRoundId) {
          toast.success(`Moved to Week #${round.week_number} contest round`)
        } else {
          toast.success(`Added to Week #${round.week_number} contest round`)
        }

        return true
      } catch (error) {
        console.error("Error managing contest participation:", error)
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to manage contest participation"
        toast.error(errorMessage)
        return false
      } finally {
        setContestRoundLoading(false)
      }
    },
    [allRounds, supabase, queryClient],
  )

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

      const updatedSubmission = submissions.find(
        (sub) => sub.component_data.id === componentId,
      )

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

      if (updatedSubmission) {
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

  // Check if a component is public
  const checkIsPublic = async (componentId: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("components")
        .select("is_public")
        .eq("id", componentId)
        .single()

      if (error) {
        throw error
      }

      return data?.is_public ?? false
    } catch (error) {
      console.error("Error checking if component is public:", error)
      return false
    }
  }

  // Toggle component public status
  const toggleComponentPublicStatus = async (
    componentId: number,
    currentStatus: boolean,
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("components")
        .update({ is_public: !currentStatus })
        .eq("id", componentId)

      if (error) {
        throw error
      }

      // Update local state
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.component_data.id === componentId
            ? { ...sub, is_public: !currentStatus }
            : sub,
        ),
      )

      toast.success(`Component is now ${!currentStatus ? "public" : "private"}`)
      return true
    } catch (error) {
      console.error("Error toggling component public status:", error)
      toast.error("Failed to update component visibility")
      return false
    }
  }

  // Delete component functionality
  const deleteComponent = async (
    submission: Submission,
    mode: DeleteMode,
  ): Promise<boolean> => {
    if (!mode) return false

    setIsDeletingComponent(true)
    try {
      if (mode === "submission") {
        // Remove only from submissions
        const { error } = await supabase
          .from("submissions")
          .delete()
          .eq("component_id", submission.component_data.id)

        if (error) throw error

        toast.success("Removed from submissions successfully")
      } else if (mode === "component") {
        // Delete component completely - cascade delete will handle demos, etc.
        const { error } = await supabase
          .from("components")
          .delete()
          .eq("id", submission.component_data.id)

        if (error) throw error

        toast.success("Component deleted completely")
      }

      // Update local state
      setSubmissions((prev) =>
        prev.filter(
          (s) => s.component_data.id !== submission.component_data.id,
        ),
      )

      return true
    } catch (error) {
      console.error("Error deleting component:", error)
      toast.error("Failed to delete component")
      return false
    } finally {
      setIsDeletingComponent(false)
      setComponentToDelete(null)
    }
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
    currentRound,
    allRounds,
    isCurrentRoundLoading,
    isAllRoundsLoading,
    contestRoundLoading,
    isDeletingComponent,
    componentToDelete,
    // Pagination state
    currentPage,
    itemsPerPage,
    totalCount,
    totalPages,
    // State setters
    setFilter,
    setFeedback,
    setSelectedSubmission,
    setEditDemoName,
    setEditDemoSlug,
    setEditingDemo,
    setComponentToDelete,
    // Functions
    fetchSubmissions,
    updateSubmissionStatus,
    updateDemoInfo,
    handleSelectSubmission,
    handleEditDemo,
    handleSetDefaultDemo,
    getStatusAsEnum,
    addToContest,
    checkContestParticipation,
    getRoundById,
    checkIsPublic,
    toggleComponentPublicStatus,
    deleteComponent,
    // Pagination handlers
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changeItemsPerPage,
  }
}

export default useSubmissions
