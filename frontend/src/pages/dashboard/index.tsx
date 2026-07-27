import { useState, useEffect } from "react"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { useAuth } from "@/context/AuthContext"
import { Users, Activity, ClipboardList, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ 
    total_patients: 0, 
    visits_today: 0,
    treatments_month: 0,
    revenue_month: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token")
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
        const res = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStats(res.data.stats)
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0)
  }

  return (
    <PageShell
      title={`Selamat Datang, ${user?.name || user?.identifier || 'Pegawai'}!`}
      description="Berikut adalah ringkasan operasional klinik hari ini."
    >
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg border-0 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 opacity-10">
              <Users className="w-32 h-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-100">Total Pasien</CardTitle>
              <Users className="h-5 w-5 text-blue-100" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{loading ? "..." : stats.total_patients}</div>
              <p className="text-xs text-blue-100 mt-2 opacity-90">
                Terdaftar di sistem klinik
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg border-0 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-100">Kunjungan Hari Ini</CardTitle>
              <Activity className="h-5 w-5 text-emerald-100" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{loading ? "..." : stats.visits_today}</div>
              <p className="text-xs text-emerald-100 mt-2 opacity-90">
                Pasien datang pada hari ini
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg border-0 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 opacity-10">
              <ClipboardList className="w-32 h-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-violet-100">Tindakan Bulan Ini</CardTitle>
              <ClipboardList className="h-5 w-5 text-violet-100" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{loading ? "..." : stats.treatments_month}</div>
              <p className="text-xs text-violet-100 mt-2 opacity-90">
                Tindakan medis diselesaikan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg border-0 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-100">Omzet Bulan Ini</CardTitle>
              <Wallet className="h-5 w-5 text-amber-100" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold">{loading ? "..." : formatRupiah(stats.revenue_month)}</div>
              <p className="text-xs text-amber-100 mt-2 opacity-90">
                Total bruto belum dipotong
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </PageShell>
  )
}
