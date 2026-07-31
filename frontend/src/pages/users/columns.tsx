import type { ColumnDef } from "@tanstack/react-table"
import { Eye, Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export type User = {
  id: string
  name: string
  username: string
  role: string
  fee_percentage: number
  apply_deductions: boolean
  is_dokter: boolean
  hide_treatments: boolean
}

export const columns = (canView: boolean, canEdit: boolean, canDelete: boolean): ColumnDef<User>[] => [
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
    accessorKey: "fee_percentage",
    header: "Fee (%)",
  },
  {
    accessorKey: "apply_deductions",
    header: "Deductions?",
    cell: ({ row }) => (
      row.original.apply_deductions ? 
        <span className="text-green-600 font-medium">Yes</span> : 
        <span className="text-gray-500">No</span>
    )
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      const user = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          {canView && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/users/${user.id}`}>
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">View Details</span>
              </Link>
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/users/${user.id}/edit`}>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Edit User</span>
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      )
    },
  },
]
