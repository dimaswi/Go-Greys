import type { ColumnDef } from "@tanstack/react-table"
import { Edit, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import dayjs from "dayjs"

export type Patient = {
  ID: number
  name: string
  phone: string
  address: string
  gender: string
  birth_date: string
}

export const columns = (canEdit: boolean): ColumnDef<Patient>[] => [
  {
    accessorKey: "name",
    header: "Nama Pasien",
  },
  {
    accessorKey: "phone",
    header: "No. HP",
  },
  {
    accessorKey: "gender",
    header: "Jenis Kelamin",
    cell: ({ row }) => (
      <span>{row.original.gender === 'L' ? 'Laki-laki' : row.original.gender === 'P' ? 'Perempuan' : '-'}</span>
    )
  },
  {
    accessorKey: "birth_date",
    header: "Tanggal Lahir",
    cell: ({ row }) => {
      if (!row.original.birth_date || row.original.birth_date.startsWith("0001")) return <span>-</span>;
      return <span>{dayjs(row.original.birth_date).format('DD MMM YYYY')}</span>
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const patient = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/patients/${patient.ID}/edit`}>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Edit Pasien</span>
              </Link>
            </Button>
          )}
          {/* We assume if they can view patients, they might want to register them. Ideally we check visits.create */}
          <Button variant="outline" size="sm" asChild className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <Link to={`/visits/create?patient_id=${patient.ID}`}>
              <CalendarPlus className="h-4 w-4 mr-1" />
              Daftar Antrean
            </Link>
          </Button>
        </div>
      )
    },
  },
]
