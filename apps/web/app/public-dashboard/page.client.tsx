"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface AuthorPayout {
  id: string
  username: string
  display_name: string
  avatar_url: string
  published_components: number
  total_usage: number
  free_plan_usage: number
  paid_plan_usage: number
  total_amount: number
  potential_earnings: number
  last_payout_date: string
  last_payout_status: string
  last_payout_amount: number
  paypal_email: string
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchAuthorPayouts(
  page: number = 1,
  pageSize: number = 10,
  period: string | null = null,
  minAmount: number | null = null,
  maxAmount: number | null = null,
  status: string | null = null,
  sortBy: string = "total_usage",
  sortOrder: string = "desc",
): Promise<{ data: AuthorPayout[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams()
  params.append("page", page.toString())
  params.append("pageSize", pageSize.toString())
  params.append("sortBy", sortBy)
  params.append("sortOrder", sortOrder)

  if (period) params.append("period", period)
  if (minAmount !== null) params.append("minAmount", minAmount.toString())
  if (maxAmount !== null) params.append("maxAmount", maxAmount.toString())
  if (status) params.append("status", status)

  const response = await fetch(`/api/public-dashboard?${params.toString()}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to load author payouts")
  }

  return await response.json()
}

export function PublicDashboardClient() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState("total_usage")
  const [sortOrder, setSortOrder] = useState("desc")
  const [searchTerm, setSearchTerm] = useState("")

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["authorPayouts", page, pageSize, sortBy, sortOrder],
    queryFn: () =>
      fetchAuthorPayouts(
        page,
        pageSize,
        null,
        null,
        null,
        null,
        sortBy,
        sortOrder,
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  const handleClearSearch = () => {
    setSearchTerm("")
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setPage(1) // Reset to first page when changing page size
  }

  const filteredData =
    data?.data.filter(
      (author) =>
        author.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.display_name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || []

  // Calculate totals for the footer
  const totalComponents = filteredData.reduce(
    (sum, author) => sum + author.published_components,
    0,
  )
  const totalUsage = filteredData.reduce(
    (sum, author) => sum + author.total_usage,
    0,
  )
  const totalPotentialEarnings = filteredData.reduce(
    (sum, author) => sum + author.potential_earnings,
    0,
  )

  return (
    <div className="container mx-auto py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold">Public Payouts Dashboard</h1>
        <p className="text-muted-foreground">
          View all authors receiving payouts in 21st.dev
        </p>
      </motion.div>

      <div className="bg-background rounded-lg border border-border overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search by username or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 rows</SelectItem>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
                <SelectItem value="50">50 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("username")}
                >
                  <div className="flex items-center">
                    Author
                    {sortBy === "username" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("published_components")}
                >
                  <div className="flex items-center justify-end">
                    Components
                    {sortBy === "published_components" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("total_usage")}
                >
                  <div className="flex items-center justify-end">
                    Total Usage
                    {sortBy === "total_usage" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("potential_earnings")}
                >
                  <div className="flex items-center justify-end">
                    Potential Earnings
                    {sortBy === "potential_earnings" &&
                      (sortOrder === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-red-500"
                  >
                    Error loading data:{" "}
                    {error instanceof Error ? error.message : "Unknown error"}
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No authors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((author) => (
                  <TableRow key={author.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            author.avatar_url || "https://github.com/shadcn.png"
                          }
                          alt={author.display_name}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">
                            {author.display_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{author.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {author.published_components}
                    </TableCell>
                    <TableCell className="text-right">
                      {author.total_usage}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${author.potential_earnings.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter className="bg-muted/50 font-medium">
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{totalComponents}</TableCell>
                <TableCell className="text-right">{totalUsage}</TableCell>
                <TableCell className="text-right">
                  ${totalPotentialEarnings.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {data && data.pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, data.pagination.total)} of{" "}
              {data.pagination.total} authors
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.pagination.totalPages)}
                disabled={page === data.pagination.totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
