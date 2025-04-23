"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const supabase = useClerkSupabaseClient()
  const router = useRouter()
  const [stats, setStats] = useState({
    pendingSubmissions: 0,
    totalComponents: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get pending submissions count
        const { count: pendingCount, error: pendingError } = await supabase
          .from("submissions")
          .select("*", { count: "exact" })
          .eq("status", "on_review")

        if (pendingError) throw pendingError

        // Get total components count
        const { count: componentsCount, error: componentsError } =
          await supabase.from("components").select("*", { count: "exact" })

        if (componentsError) throw componentsError

        // Get total users count
        const { count: usersCount, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact" })

        if (usersError) throw usersError

        setStats({
          pendingSubmissions: pendingCount || 0,
          totalComponents: componentsCount || 0,
          totalUsers: usersCount || 0,
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage components, submissions, and users.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">
                Pending Submissions
              </h2>
              <p className="text-3xl font-bold text-blue-600">
                {stats.pendingSubmissions}
              </p>
              <Link
                href="/admin/submissions"
                className="mt-4 inline-block text-sm text-blue-600 hover:underline"
              >
                Manage Submissions →
              </Link>
            </div>

            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Total Components</h2>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalComponents}
              </p>
            </div>

            <div className="bg-white border rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Total Users</h2>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/submissions"
              className="block p-4 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium mb-1">Review Submissions</h3>
              <p className="text-sm text-gray-600">
                Review and manage component submissions
              </p>
            </Link>

            {/* Add more quick action links as needed */}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
