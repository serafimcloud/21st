import { FC } from "react"
import { motion } from "motion/react"

interface AdminHeaderProps {
  title: string
  subtitle?: string
}

const AdminHeader: FC<AdminHeaderProps> = ({ title, subtitle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b pb-4 mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  )
}

export default AdminHeader
