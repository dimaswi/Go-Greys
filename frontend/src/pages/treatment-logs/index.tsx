import { useEffect, useState } from "react"
import axios from "axios"
import { columns } from "./columns"
import type { TreatmentLog } from "./columns"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X } from "lucide-react"
import { Link } from "react-router-dom"

export default function TreatmentLogsIndex() {
  const [data, setData] = useState<TreatmentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
        const token = localStorage.getItem("token")
        const response = await axios.get(`${apiUrl}/treatment-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch treatment logs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filtered = data.filter((u) => 
    u.patient_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.user && u.user.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageShell
      title="Riwayat Tindakan Pasien"
      description="Kelola pencatatan tindakan medis yang dilakukan oleh pegawai."
      actions={
        <Button asChild>
          <Link to="/treatment-logs/create">
            <Plus className="mr-2 h-4 w-4" /> Catat Tindakan Baru
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama pasien atau dokter..." 
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
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{filtered.length} riwayat tindakan</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading...</div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>
    </PageShell>
  )
}
