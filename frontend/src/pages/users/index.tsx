import { useEffect, useState } from "react"
import axios from "axios"
import { columns } from "./columns"
import type { User } from "./columns"
import { DataTable } from "@/components/DataTable"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, X } from "lucide-react"
import { Link } from "react-router-dom"

export default function UsersIndex() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
        const response = await axios.get(`${apiUrl}/users`)
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filtered = data.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell
      title="Manajemen User"
      description="Kelola daftar pengguna sistem dan hak akses mereka."
      actions={
        <Button asChild>
          <Link to="/users/create">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama atau username..." 
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
          <p className="text-sm text-muted-foreground ml-auto hidden sm:block">{filtered.length} total data</p>
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
