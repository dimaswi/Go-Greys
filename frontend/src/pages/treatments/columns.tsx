import type { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"

export type Treatment = {
  ID: number
  name: string
  base_price: number
  is_fixed_fee: boolean
  material_deduction: number
  fixed_medical_fee: number
  hide_in_pdf: boolean
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka)
}

export const columns = (canEdit: boolean, canDelete: boolean): ColumnDef<Treatment>[] => [
  {
    accessorKey: "name",
    header: "Nama Tindakan",
  },
  {
    accessorKey: "base_price",
    header: "Tarif Dasar (Rp)",
    cell: ({ row }) => (
      <span>{row.original.base_price ? formatRupiah(row.original.base_price) : '-'}</span>
    )
  },
  {
    accessorKey: "is_fixed_fee",
    header: "Tindakan Khusus (Behel)?",
    cell: ({ row }) => (
      row.original.is_fixed_fee ?
        <span className="text-green-600 font-medium">Ya</span> :
        <span className="text-gray-500">Tidak</span>
    )
  },
  {
    accessorKey: "material_deduction",
    header: "Potongan Bahan",
    cell: ({ row }) => (
      <span>{formatRupiah(row.original.material_deduction)}</span>
    )
  },
  {
    accessorKey: "hide_in_pdf",
    header: "Di PDF",
    cell: ({ row }) => (
      row.original.hide_in_pdf
        ? <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-xs font-medium px-2 py-0.5 rounded-full">Disembunyikan</span>
        : <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2 py-0.5 rounded-full">Tampil</span>
    )
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const treatment = row.original

      return (
        <div className="flex items-center gap-2 justify-end">
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/treatments/${treatment.ID}/edit`}>
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Edit Tindakan</span>
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={async () => {
                if (window.confirm('Yakin ingin menghapus tindakan ini?')) {
                  try {
                    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
                    const token = localStorage.getItem("token")
                    await axios.delete(`${API_URL}/treatments/${treatment.ID}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    window.location.reload()
                  } catch (error) {
                    console.error("Gagal menghapus", error)
                    toast.error('Gagal menghapus tindakan')
                  }
                }
              }}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      )
    },
  },
]
