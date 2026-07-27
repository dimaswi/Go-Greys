import type { ColumnDef } from "@tanstack/react-table"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import dayjs from "dayjs"

export type Visit = {
  ID: number
  patient: { name: string, phone: string }
  doctor: { name: string } | null
  status: string
  date: string
  notes: string
}

export const columns = (canEdit: boolean, canView: boolean): ColumnDef<Visit>[] => [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => (
      <span>{dayjs(row.original.date).format('DD MMM YYYY HH:mm')}</span>
    )
  },
  {
    accessorKey: "patient.name",
    header: "Nama Pasien",
  },
  {
    accessorKey: "doctor.name",
    header: "Dokter/Perawat",
    cell: ({ row }) => (
      <span>{row.original.doctor ? row.original.doctor.name : <span className="text-gray-400 italic">Belum di-assign</span>}</span>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status
      if (s === 'menunggu') return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">Menunggu</span>
      if (s === 'di_ruangan') return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">Di Ruangan</span>
      if (s === 'selesai') return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">Selesai</span>
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium uppercase tracking-wide">{s}</span>
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const visit = row.original
      // If status is not selesai, button says "Masuk Ruangan" or "Proses"
      return (
        <div className="flex items-center gap-2 justify-end">
          {(visit.status === 'selesai' ? canView : canEdit) && (
            <Button variant={visit.status === 'selesai' ? "outline" : "default"} size="sm" asChild>
              <Link to={`/visits/${visit.ID}/room`}>
                {visit.status === 'selesai' ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" /> Detail
                  </>
                ) : (
                  "Proses Pasien"
                )}
              </Link>
            </Button>
          )}
        </div>
      )
    },
  },
]
