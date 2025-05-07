import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FC } from "react"
import { Submission } from "./types"
import { ExternalLink } from "lucide-react"

interface SubmissionCardProps {
  submission: Submission
  onManage: (submission: Submission) => void
  onEditDemo: (submission: Submission) => void
  onSetDefaultDemo: (submission: Submission) => void
}

const SubmissionCard: FC<SubmissionCardProps> = ({
  submission,
  onManage,
  onEditDemo,
  onSetDefaultDemo,
}) => {
  // Supabase URLs
  const componentSupabaseUrl = `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/29179?sort=created_at%3Adesc&filter=id%3Aeq%3A${submission.component_data.id}`
  const demoSupabaseUrl = `https://supabase.com/dashboard/project/vucvdpamtrjkzmubwlts/editor/229472?sort=created_at:desc&filter=component_id:eq:${submission.component_data.id}`

  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
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
              {submission.component_data.name}{" "}
              {submission.name && `| ${submission.name}`}
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
                        : submission.submission_status === "rejected"
                          ? "bg-red-200 text-red-800"
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
                {new Date(submission.updated_at).toLocaleDateString()}
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
            <div className="mt-4 p-3 rounded-lg border">
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
              onClick={() => onManage(submission)}
            >
              Manage Submission
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditDemo(submission)}
            >
              Edit Demo Info
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSetDefaultDemo(submission)}
            >
              Set Default Demo
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link
                href={componentSupabaseUrl}
                target="_blank"
                className="flex items-center gap-1"
              >
                <ExternalLink size={14} />
                Open Component in Supabase
              </Link>
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link
                href={demoSupabaseUrl}
                target="_blank"
                className="flex items-center gap-1"
              >
                <ExternalLink size={14} />
                Open Demo in Supabase
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmissionCard
