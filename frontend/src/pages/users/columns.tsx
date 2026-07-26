import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export type User = {
  id: string
  name: string
  username: string
  role: string
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/users/${user.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">View Details</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Edit User</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )
    },
  },
]
