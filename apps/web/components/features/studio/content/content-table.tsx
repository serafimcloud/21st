"use client"

import { useState } from "react"
import { User } from "@/types/global"
import { Component } from "@/types/component"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  MoreVertical,
  Search,
  Edit,
  Eye,
  Trash2,
  ArrowUpDown,
  BarChart2,
  Code2,
  Link as LinkIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ComponentPublishForm } from "./component-publish-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface StudioContentTableProps {
  user: User
  components: Component[]
}

export function StudioContentTable({
  user,
  components = [],
}: StudioContentTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "name" | "popularity">("date")
  const [editComponent, setEditComponent] = useState<Component | null>(null)

  // Filter components based on search
  const filteredComponents = components.filter(
    (component) =>
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Sort components
  const sortedComponents = [...filteredComponents].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name)
    } else {
      // Sort by popularity (views or downloads)
      return (b.views || 0) - (a.views || 0)
    }
  })

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            Published
          </Badge>
        )
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "review":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            In Review
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const copyComponentUrl = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/component/${slug}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search components..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as any)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {components.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No components yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't published any components yet. Get started by creating
            your first component.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Publish Your First Component</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px]">
              <DialogHeader>
                <DialogTitle>Publish Component</DialogTitle>
                <DialogDescription>
                  Paste your component code below. Make sure it follows our
                  guidelines and includes all necessary imports.
                </DialogDescription>
              </DialogHeader>
              <ComponentPublishForm user={user} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <div className="flex items-center space-x-1">
                    <span>Component</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedComponents.map((component) => (
                <TableRow key={component.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{component.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[230px]">
                        {component.description || "No description"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(component.status || "published")}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(component.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {component.views || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {component.downloads || 0}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/component/${component.slug}`}
                            className="flex items-center cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Component
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Dialog>
                            <DialogTrigger className="flex items-center w-full cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Component
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[725px]">
                              <DialogHeader>
                                <DialogTitle>Edit Component</DialogTitle>
                                <DialogDescription>
                                  Update your component details and code.
                                </DialogDescription>
                              </DialogHeader>
                              <ComponentPublishForm
                                user={user}
                                existingComponent={component}
                              />
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Code2 className="mr-2 h-4 w-4" />
                          View Source
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart2 className="mr-2 h-4 w-4" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => copyComponentUrl(component.slug)}
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
