"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

interface Sandbox {
  id: string
  name: string
  status: string
  updated_at?: string
  created_at?: string
}

interface SandboxesTableProps {
  sandboxes: Sandbox[]
  onOpen?: (sandbox: Sandbox) => void
}

export function SandboxesTable({
  sandboxes = [],
  onOpen,
}: SandboxesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "created_at",
      desc: true,
    },
  ])

  const columns: ColumnDef<Sandbox>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="font-medium truncate">
          {row.getValue("name") || "Untitled"}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <div>
            <span
              className={cn(
                "px-2 py-1 text-xs rounded",
                status === "on_review" && "bg-yellow-100 text-yellow-700",
                status === "draft" && "bg-gray-100 text-gray-700",
              )}
            >
              {status === "on_review"
                ? "On Review"
                : status === "draft"
                  ? "Draft"
                  : status}
            </span>
          </div>
        )
      },
    },
    {
      header: "Created",
      id: "created_at",
      accessorFn: (row) => row.updated_at || row.created_at || "",
      cell: ({ row }) => {
        const dateValue = row.original.created_at || row.original.updated_at

        try {
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
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen?.(row.original)}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        )
      },
    },
  ]

  const safeData = Array.isArray(sandboxes) ? sandboxes : []

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    state: {
      sorting,
    },
  })

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No sandboxes found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
