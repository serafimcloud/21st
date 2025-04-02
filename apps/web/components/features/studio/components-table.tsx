import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Tables } from "@/types/supabase"

type Component = Tables<"components">

interface ComponentsTableProps {
  components: Component[]
  onEdit?: (component: Component) => void
}

export function ComponentsTable({ components, onEdit }: ComponentsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">Likes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {components.map((component) => (
            <TableRow key={component.id}>
              <TableCell className="font-medium">{component.name}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(component.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell className="text-right">
                {component.downloads_count}
              </TableCell>
              <TableCell className="text-right">
                {component.likes_count}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit && onEdit(component)}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {components.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No components published yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
