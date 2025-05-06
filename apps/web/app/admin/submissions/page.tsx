"use client"

import AdminHeader from "@/components/features/admin/AdminHeader"
import EditDemoModal from "@/components/features/admin/EditDemoModal"
import ManageSubmissionModal from "@/components/features/admin/ManageSubmissionModal"
import NonAdminPlaceholder from "@/components/features/admin/NonAdminPlaceholder"
import SubmissionCard from "@/components/features/admin/SubmissionCard"
import SubmissionStatusFilter from "@/components/features/admin/SubmissionStatusFilter"
import useSubmissions from "@/components/features/admin/hooks/useSubmissions"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { motion } from "motion/react"
import { FC } from "react"

const SubmissionsAdminPage: FC = () => {
  const isAdmin = useIsAdmin()
  const {
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
  } = useSubmissions(isAdmin)

  // Non-admin placeholder
  if (!isAdmin) {
    return <NonAdminPlaceholder />
  }

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AdminHeader
          title="Component Submissions"
          subtitle="Manage submitted components from users"
        />

        <div className="flex justify-end mb-4">
          <SubmissionStatusFilter
            value={filter}
            onChange={setFilter}
            onRefresh={fetchSubmissions}
          />
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
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onManage={handleSelectSubmission}
                  onEditDemo={handleEditDemo}
                  onSetDefaultDemo={handleSetDefaultDemo}
                />
              ))
            )}
          </div>
        )}

        {/* Modals */}
        {selectedSubmission && (
          <ManageSubmissionModal
            submission={selectedSubmission}
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onStatusChange={(status) => {
              setSelectedSubmission({
                ...selectedSubmission,
                submission_status: status,
              })
            }}
            onClose={() => {
              setSelectedSubmission(null)
              setFeedback("")
            }}
            onSave={() =>
              updateSubmissionStatus(
                selectedSubmission.component_data.id,
                getStatusAsEnum(selectedSubmission.submission_status),
              )
            }
          />
        )}

        {editingDemo && (
          <EditDemoModal
            submission={editingDemo}
            demoName={editDemoName}
            demoSlug={editDemoSlug}
            onDemoNameChange={setEditDemoName}
            onDemoSlugChange={setEditDemoSlug}
            onClose={() => {
              setEditingDemo(null)
              setEditDemoName("")
              setEditDemoSlug("")
            }}
            onSave={updateDemoInfo}
          />
        )}
      </motion.div>
    </div>
  )
}

export default SubmissionsAdminPage
