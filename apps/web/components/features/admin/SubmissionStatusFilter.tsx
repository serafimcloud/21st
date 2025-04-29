import { FC } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface SubmissionStatusFilterProps {
  value: string
  onChange: (value: string) => void
  onRefresh: () => void
}

const SubmissionStatusFilter: FC<SubmissionStatusFilterProps> = ({
  value,
  onChange,
  onRefresh,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <Select value={value} onValueChange={onChange}>
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
      <Button onClick={onRefresh}>Refresh</Button>
    </div>
  )
}

export default SubmissionStatusFilter
