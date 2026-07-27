import { useEffect, useState } from "react"
import axios from "axios"
import { columns, type Visit } from "./columns"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function VisitsIndex() {
  const [data, setData] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const { user } = useAuth()
  const isAdmin = user?.role?.toLowerCase() === "admin"
  const canCreate = isAdmin || !!user?.permissions?.includes("visits.create")
  const canEdit = isAdmin || !!user?.permissions?.includes("visits.edit")
  const canView = isAdmin || !!user?.permissions?.includes("visits.view")

  // Filter Date (default today)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchVisits = async () => {
      setLoading(true)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
        const token = localStorage.getItem("token")
        const response = await axios.get(`${apiUrl}/visits?date=${filterDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(response.data || [])
      } catch (error) {
        console.error("Failed to fetch visits:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVisits()
  }, [filterDate])

  const filtered = data.filter((v) =>
    v.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (v.doctor && v.doctor.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell
      title="Antrean & Kunjungan"
      description="Kelola daftar antrean pasien hari ini dan alokasikan ke ruang periksa."
      actions={
        canCreate && (
          <Button asChild>
            <Link to="/visits/create">
              <Plus className="mr-2 h-4 w-4" /> Daftar Kunjungan Baru
            </Link>
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium">Tanggal Kunjungan:</span>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-[160px] h-9"
            />
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama pasien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-9 shadow-xs bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{filtered.length} antrean</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <DataTable columns={columns(canEdit, canView)} data={filtered} />
        )}
      </div>
    </PageShell>
  )
}
