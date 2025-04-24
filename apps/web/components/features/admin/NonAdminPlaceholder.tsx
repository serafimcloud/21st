import { FC } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const NonAdminPlaceholder: FC = () => {
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
          You don't have access to this page. Please contact an administrator if
          you believe this is an error.
        </p>
        <Button asChild>
          <Link href="/">Return to Homepage</Link>
        </Button>
      </motion.div>
    </div>
  )
}

export default NonAdminPlaceholder
