import { Button } from "@/components/ui/button"
import { ArrowLeft, User as UserIcon, Shield, Stethoscope, Percent, Calculator, Edit, TrendingUp, Activity, DollarSign, BarChart3, Calendar } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import type { User } from "./columns"
import axios from "axios"
import { Skeleton } from "@/components/ui/skeleton"
import PageShell from "@/components/PageShell"

type PayrollStats = {
  total_tindakan: number
  total_tariff: number
  total_gaji: number
  total_material_deduction: number
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID", { minimumFractionDigits: 0 })
}

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

function getMonthLabel() {
  return new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

export default function UserShow() {
  const { id } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stats, setStats] = useState<PayrollStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${apiUrl}/users/${id}`)
        setUser(res.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Gagal mengambil data user")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  useEffect(() => {
    if (!user?.is_dokter) return
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const { start, end } = getCurrentMonthRange()
        const res = await axios.get(`${apiUrl}/payroll/calculate`, {
          params: { user_id: id, start_date: start, end_date: end },
        })
        const d = res.data
        setStats({
          total_tindakan: d.logs?.length ?? 0,
          total_tariff: d.breakdown?.total_all_tariff ?? 0,
          total_gaji: d.total_gaji ?? 0,
          total_material_deduction: d.breakdown?.total_material_deduction ?? 0,
        })
      } catch {
        // Non-critical
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [user])

  return (
    <PageShell
      title="Detail Pengguna"
      description="Informasi profil dan pengaturan akses."
      backButton={
        <Button variant="outline" size="icon" asChild className="rounded-full h-9 w-9">
          <Link to="/users">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
      }
      actions={
        <Button asChild>
          <Link to={`/users/${id}/edit`}>
            <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Edit User</span>
            </Link>
        </Button>
      }
      footer={
        <>
          <Button variant="outline" asChild>
            <Link to="/users">Kembali</Link>
          </Button>
          <Button asChild className="min-w-[140px]">
            <Link to={`/users/${id}/edit`}>
              <Edit className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Edit User</span>
            </Link>
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center font-medium">
          {error}
        </div>
      ) : user ? (
        <div className="space-y-4">

          {/* Stats Row – hanya dokter */}
          {user.is_dokter && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Statistik Bulan Ini — {getMonthLabel()}
                </span>
              </div>
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[88px] w-full rounded-xl" />)}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Tindakan */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-violet-100 p-2.5 rounded-lg text-violet-600 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Total Tindakan</p>
                      <p className="text-xl font-bold text-slate-900 leading-tight">{stats.total_tindakan}</p>
                      <p className="text-xs text-muted-foreground truncate">bulan ini</p>
                    </div>
                  </div>
                  {/* Total Tarif */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 shrink-0">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Total Tarif</p>
                      <p className="text-xl font-bold text-slate-900 leading-tight truncate">{formatRupiah(stats.total_tariff)}</p>
                      <p className="text-xs text-muted-foreground">akumulasi tarif</p>
                    </div>
                  </div>
                  {/* Potongan Bahan */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600 shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Potongan Bahan</p>
                      <p className="text-xl font-bold text-slate-900 leading-tight truncate">{formatRupiah(stats.total_material_deduction)}</p>
                      <p className="text-xs text-muted-foreground">{user.apply_deductions ? "diberlakukan" : "tidak berlaku"}</p>
                    </div>
                  </div>
                  {/* Estimasi Gaji */}
                  <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-4 flex items-center gap-3">
                    <div className="bg-emerald-100 p-2.5 rounded-lg text-emerald-600 shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Estimasi Gaji</p>
                      <p className="text-xl font-bold text-emerald-700 leading-tight truncate">{formatRupiah(stats.total_gaji)}</p>
                      <p className="text-xs text-muted-foreground">fee {user.fee_percentage}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-sm text-muted-foreground">
                  Belum ada tindakan di bulan ini.
                </div>
              )}
            </div>
          )}

          {/* Main Card */}
          <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">

            {/* Profil Dasar */}
            <div>
              <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2 mb-4">
                <UserIcon className="w-4 h-4 text-blue-500" />
                Profil Dasar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Nama Lengkap</p>
                  <p className="text-base font-semibold text-slate-900">{user.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="text-base text-slate-700">{user.username}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Akses & Peran */}
            <div>
              <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-emerald-500" />
                Akses &amp; Peran
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Role Sistem</p>
                  <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-sm font-semibold inline-block">
                    {user.role}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tipe Pengguna</p>
                  {user.is_dokter ? (
                    <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 w-max">
                      <Stethoscope className="w-4 h-4" /> Tenaga Medis (Dokter)
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium w-max inline-block">
                      Staf Non-Medis
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pengaturan Penggajian – hanya dokter */}
            {user.is_dokter && (
              <>
                <div className="border-t border-slate-100" />
                <div>
                  <h3 className="font-semibold text-base text-slate-800 flex items-center gap-2 mb-4">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Pengaturan Penggajian Dokter
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Persentase Bagi Hasil</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                          <Percent className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{user.fee_percentage}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Potongan jasa medis per tindakan.</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Potongan Bahan Medis</p>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${user.apply_deductions ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          <Calculator className="w-4 h-4" />
                        </div>
                        <span className={`text-base font-bold ${user.apply_deductions ? 'text-red-600' : 'text-green-600'}`}>
                          {user.apply_deductions ? "Diberlakukan" : "Tidak Diberlakukan"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Apakah gaji dikurangi modal bahan.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
