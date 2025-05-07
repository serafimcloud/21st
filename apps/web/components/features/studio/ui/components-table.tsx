"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ColumnDef,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { ExtendedDemoWithComponent } from "@/lib/utils/transformData"

interface DemosTableProps {
  demos: ExtendedDemoWithComponent[]
  onEdit?: (demo: ExtendedDemoWithComponent) => void
  onOpenSandbox?: (shortSandboxId: string) => void
}

export function DemosTable({
  demos = [],
  onEdit,
  onOpenSandbox,
}: DemosTableProps) {
  const id = useId()
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })
  const [imageLoadStatus, setImageLoadStatus] = useState<
    Record<string, { loaded: boolean; error?: string; fixedUrl?: string }>
  >({})

  // Format numbers with thousand separators (spaces)
  const formatNumberWithSpaces = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  // Format numbers the same way as in the card component
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  useEffect(() => {
    // Process all preview images at once instead of in each cell
    demos.forEach((demo) => {
      if (demo.preview_url) {
        // Fix URL if it's a relative path without http(s)
        const previewUrl = demo.preview_url.startsWith("http")
          ? demo.preview_url
          : `https://cdn.21st.dev${demo.preview_url.startsWith("/") ? "" : "/"}${demo.preview_url}`

        const img = new Image()
        img.onload = () => {
          setImageLoadStatus((prev) => ({
            ...prev,
            [demo.id]: { loaded: true, fixedUrl: previewUrl },
          }))
        }
        img.onerror = () => {
          setImageLoadStatus((prev) => ({
            ...prev,
            [demo.id]: {
              loaded: false,
              error: "Failed to load image",
              fixedUrl: previewUrl,
            },
          }))
        }
        img.src = previewUrl
      } else {
        setImageLoadStatus((prev) => ({
          ...prev,
          [demo.id]: { loaded: false, error: "No preview URL" },
        }))
      }
    })
  }, [demos])

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ])

  const columns: ColumnDef<ExtendedDemoWithComponent>[] = [
    {
      header: "Component",
      accessorKey: "name",
      cell: ({ row }) => {
        const isDraft = row.original.submission_status === "draft"
        const shouldOpenSandbox =
          // if component has sandbox_id (short), use that
          row.original.component?.sandbox_id ||
          // if it's sandbox (no component) use the sandbox short id
          (!row.original.component && row.original.id && onOpenSandbox)

        const handleRowClick = () => {
          if (shouldOpenSandbox) {
            // @ts-ignore
            onOpenSandbox(row.original.component?.sandbox_id || row.original.id)
          }
          // Optionally, add navigation for non-draft items here if needed
          // else { router.push(`/component/${row.original.demo_slug}`) }
        }

        return (
          <div
            className={cn(
              "flex items-center gap-3",
              shouldOpenSandbox && "cursor-pointer", // Add cursor pointer for drafts
            )}
            onClick={handleRowClick}
            onKeyDown={(e) => {
              if (shouldOpenSandbox && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                handleRowClick()
              }
            }}
            role={shouldOpenSandbox ? "button" : undefined}
            tabIndex={shouldOpenSandbox ? 0 : undefined}
          >
            <div className="h-12 w-20 overflow-hidden rounded-md border bg-muted shrink-0">
              {row.original.preview_url ? (
                <div
                  className="h-12 w-20 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${row.original.preview_url})`,
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {isDraft ? "Draft" : "No preview"}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="font-medium truncate">{row.getValue("name")}</div>
              <div className="text-sm text-muted-foreground truncate">
                {row.original.component?.name || "Unknown component"}
              </div>
            </div>
          </div>
        )
      },
      size: 300,
      sortingFn: "alphanumeric",
    },
    {
      header: "Status",
      id: "submission_status",
      accessorFn: (row) => row.submission_status || "featured",
      cell: ({ row }) => {
        const status = row.original.submission_status || "featured"
        return (
          <div>
            <span
              className={cn(
                "px-2 py-1 text-xs rounded",
                status === "on_review" && "bg-yellow-100 text-yellow-700",
                status === "featured" && "bg-green-100 text-green-700",
                status === "posted" && "bg-blue-100 text-blue-700",
                status === "draft" && "bg-gray-100 text-gray-700",
                !status && "bg-gray-100 text-gray-700",
              )}
              title={
                row.original.moderators_feedback
                  ? `Feedback: ${row.original.moderators_feedback}`
                  : undefined
              }
            >
              {status === "on_review"
                ? "On Review"
                : status === "featured"
                  ? "Featured"
                  : status === "posted"
                    ? "Posted"
                    : status === "draft"
                      ? "Draft"
                      : "None"}
            </span>
          </div>
        )
      },
      size: 100,
      sortingFn: "alphanumeric",
    },
    {
      header: "Visibility",
      id: "is_private",
      accessorFn: (row) => (row.is_private ? "private" : "public"),
      cell: ({ row }) => {
        const isPrivate = row.original.is_private
        return (
          <div>
            <span
              className={cn(
                "px-2 py-1 text-xs rounded",
                isPrivate
                  ? "bg-muted text-muted-foreground"
                  : "bg-green-100 text-green-700",
              )}
            >
              {isPrivate ? "Private" : "Public"}
            </span>
          </div>
        )
      },
      size: 100,
      sortingFn: "alphanumeric",
    },
    {
      header: "Created",
      id: "created_at",
      accessorFn: (row) => row.updated_at || row.created_at || "",
      cell: ({ row }) => {
        // Use updated_at if created_at is not available
        const dateValue = row.original.created_at || row.original.updated_at

        try {
          // Format as actual date instead of relative time
          const date = new Date(dateValue || "")
          return (
            <div>
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          )
        } catch (e) {
          return <div>Unknown</div>
        }
      },
      size: 150,
      sortingFn: "alphanumeric",
    },
    {
      header: "Views",
      id: "view_count",
      accessorFn: (row) => {
        return row.view_count || 0
      },
      cell: ({ row }) => {
        const viewCount = row.original.view_count || 0
        return (
          <div className="text-right">{formatNumberWithSpaces(viewCount)}</div>
        )
      },
      size: 80,
      sortingFn: "alphanumeric",
    },
    {
      header: "Likes",
      id: "bookmarks_count",
      accessorFn: (row) => {
        return row.bookmarks_count || 0
      },
      cell: ({ row }) => {
        const bookmarksCount = row.original.bookmarks_count || 0
        return (
          <div className="text-right">
            {formatNumberWithSpaces(bookmarksCount)}
          </div>
        )
      },
      size: 80,
      sortingFn: "alphanumeric",
    },
  ]

  // Adjust colSpan for the empty state
  const columnCount = columns.length

  // Ensure demos is always an array
  const safeData = Array.isArray(demos) ? demos : []

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    sortingFns: {
      "updated-at": (rowA, rowB, columnId) => {
        const a = rowA.original.updated_at || rowA.original.created_at || ""
        const b = rowB.original.updated_at || rowB.original.created_at || ""

        // Convert to dates for comparison
        const dateA = a ? new Date(a).getTime() : 0
        const dateB = b ? new Date(b).getTime() : 0

        return dateA > dateB ? 1 : dateA < dateB ? -1 : 0
      },
      "view-count": (rowA, rowB, columnId) => {
        const a = rowA.original.view_count || 0
        const b = rowB.original.view_count || 0
        return a > b ? 1 : a < b ? -1 : 0
      },
      "bookmarks-count": (rowA, rowB, columnId) => {
        const a = rowA.original.bookmarks_count || 0
        const b = rowB.original.bookmarks_count || 0
        return a > b ? 1 : a < b ? -1 : 0
      },
      status: (rowA, rowB, columnId) => {
        // Status priority: featured > posted > on_review > null
        const statusPriority = {
          featured: 4,
          posted: 3,
          on_review: 2,
          draft: 1,
          null: 1,
        }

        const statusA = rowA.original.submission_status || "draft"
        const statusB = rowB.original.submission_status || "draft"

        const priorityA =
          statusPriority[statusA as keyof typeof statusPriority] || 0
        const priorityB =
          statusPriority[statusB as keyof typeof statusPriority] || 0

        return priorityA > priorityB ? 1 : priorityA < priorityB ? -1 : 0
      },
      visibility: (rowA, rowB, columnId) => {
        // Public first, then private
        const a = rowA.original.is_private ? 0 : 1
        const b = rowB.original.is_private ? 0 : 1
        return a > b ? 1 : a < b ? -1 : 0
      },
    },
  })

  // Safely get page count
  const pageCount = table ? table.getPageCount() : 0
  const currentPage = table ? table.getState().pagination.pageIndex + 1 : 1

  // Create an array of page numbers to render
  const pageNumbers: (number | "ellipsis")[] = []
  if (pageCount <= 5) {
    // If 5 or fewer pages, show all
    for (let i = 1; i <= pageCount; i++) {
      pageNumbers.push(i)
    }
  } else {
    // Always show first page
    pageNumbers.push(1)

    // Calculate range to show around current page
    if (currentPage <= 3) {
      // Near start
      pageNumbers.push(2, 3, 4)
      pageNumbers.push("ellipsis")
    } else if (currentPage >= pageCount - 2) {
      // Near end
      pageNumbers.push("ellipsis")
      pageNumbers.push(pageCount - 3, pageCount - 2, pageCount - 1)
    } else {
      // Middle
      pageNumbers.push("ellipsis")
      pageNumbers.push(currentPage - 1, currentPage, currentPage + 1)
      pageNumbers.push("ellipsis")
    }

    // Always show last page
    pageNumbers.push(pageCount)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background overflow-auto">
        <Table className="table-fixed min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header, index) => {
                  const isLastColumn = index === headerGroup.headers.length - 1
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className={cn("h-11", isLastColumn && "pr-6")}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full cursor-pointer select-none items-center gap-2",
                            header.id === "view_count" ||
                              header.id === "bookmarks_count"
                              ? "justify-end"
                              : "justify-between",
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: (
                              <ChevronUp
                                className="shrink-0 opacity-60"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDown
                                className="shrink-0 opacity-60"
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, index) => {
                    const isLastColumn =
                      index === row.getVisibleCells().length - 1
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === "actions" && "pr-4",
                          isLastColumn && "pr-6",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnCount} // Use dynamic column count
                  className="h-24 text-center text-muted-foreground"
                >
                  No demos published yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {demos.length > 0 && (
        <div className="flex items-center justify-between gap-8">
          {/* Results per page */}
          <div className="flex items-center gap-3">
            <Label htmlFor={id} className="max-sm:sr-only whitespace-nowrap">
              Rows per page
            </Label>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger id={id} className="w-fit whitespace-nowrap">
                <SelectValue placeholder="Select rows" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page number information */}
          <div className="hidden md:flex grow whitespace-nowrap text-sm text-muted-foreground">
            <p
              className="whitespace-nowrap text-sm text-muted-foreground"
              aria-live="polite"
            >
              <span className="text-foreground">
                {Math.min(table.getRowCount(), 1) > 0
                  ? table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1
                  : 0}
                -
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getRowCount(),
                )}
              </span>{" "}
              of{" "}
              <span className="text-foreground">
                {table.getRowCount().toString()}
              </span>
            </p>
          </div>

          {/* Pagination UI */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    table.previousPage()
                  }}
                  aria-disabled={!table.getCanPreviousPage()}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>

              {pageNumbers.map((page, i) =>
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault()
                        table.setPageIndex(page - 1)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    table.nextPage()
                  }}
                  aria-disabled={!table.getCanNextPage()}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

// Backward compatibility export for existing imports
export const ComponentsTable = DemosTable
