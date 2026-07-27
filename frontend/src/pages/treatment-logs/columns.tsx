import type { ColumnDef } from "@tanstack/react-table"
import { Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import axios from "axios"
import dayjs from "dayjs"
import { toast } from "sonner"

export type TreatmentLog = {
  ID: number
  user: { name: string }
  treatment: { name: string }
  patient_name: string
  applied_tariff: number
  date: string
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka)
}

export const columns: ColumnDef<TreatmentLog>[] = [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => (
      <span>{dayjs(row.original.date).format('DD MMM YYYY')}</span>
    )
  },
  {
    accessorKey: "user.name",
    header: "Pegawai/Dokter",
  },
  {
    accessorKey: "patient_name",
    header: "Nama Pasien",
  },
  {
    accessorKey: "treatment.name",
    header: "Tindakan",
  },
  {
    accessorKey: "applied_tariff",
    header: "Tarif Riil",
    cell: ({ row }) => (
      <span>{formatRupiah(row.original.applied_tariff)}</span>
    )
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const log = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (window.confirm('Yakin ingin membatalkan/menghapus riwayat ini?')) {
                try {
                  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
                  const token = localStorage.getItem("token")
                  await axios.delete(`${API_URL}/treatment-logs/${log.ID}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  window.location.reload()
                } catch (error) {
                  console.error(error)
                  toast.error('Gagal menghapus riwayat')
                }
              }
            }}
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Hapus</span>
          </Button>
        </div>
      )
    },
  },
]
