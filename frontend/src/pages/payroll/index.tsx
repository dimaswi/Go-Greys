import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator, Loader2, Users, ArrowLeft, FileText } from "lucide-react"

export default function PayrollIndex() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  const [userSearch, setUserSearch] = useState("")
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const [formData, setFormData] = useState({
    user_id: "",
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1st of month
    end_date: new Date().toISOString().split('T')[0] // today
  })

  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setUsers(res.data || [])
      } catch (err) {
        console.error("Failed to fetch users", err)
      }
    }
    fetchUsers()
  }, [])

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.user_id) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const token = localStorage.getItem("token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

      const response = await axios.get(`${apiUrl}/payroll/calculate`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          user_id: formData.user_id,
          start_date: formData.start_date,
          end_date: formData.end_date,
          _t: Date.now() // Cache buster
        }
      })

      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat menghitung gaji")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!result) return
    const token = localStorage.getItem("token")
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
    const url = `${apiUrl}/payroll/download-slip?user_id=${result.user.id}&start_date=${result.period.start}&end_date=${result.period.end}`

    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).then((response) => {
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = fileUrl
      link.setAttribute('download', `Slip_Gaji_${result.user.name.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    }).catch(err => {
      console.error("Failed to download PDF", err)
      alert("Gagal mengunduh PDF")
    })
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka)
  }

  return (
    <PageShell
      title="Kalkulator Penggajian"
      description="Hitung gaji dokter atau asisten berdasarkan tindakan medis yang dilakukan pada periode waktu tertentu."
      backButton={
        <Link to="/payroll/list">
          <Button variant="ghost" size="icon" className="h-9 w-9 border">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </Button>
        </Link>
      }
      actions={
        <Link to="/payroll/list" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-9 bg-white text-slate-700 shadow-sm w-full sm:w-auto px-2 sm:px-3">
            <Users className="w-4 h-4 sm:mr-2 text-slate-500" />
            <span className="hidden sm:inline">List Semua Pegawai</span>
          </Button>
        </Link>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Filter */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 self-start">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user_id">Pilih Pegawai / Tenaga Medis</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari nama atau peran pegawai..."
                  value={userSearch}
                  onChange={e => {
                    setUserSearch(e.target.value)
                    setFormData({ ...formData, user_id: "" }) // reset selection when typing
                    if (!userDropdownOpen) setUserDropdownOpen(true)
                  }}
                  onFocus={() => setUserDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setUserDropdownOpen(false), 200)}
                  required={!formData.user_id}
                />
                {userDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {users.filter(u => (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.role || "").toLowerCase().includes(userSearch.toLowerCase())).length > 0 ? (
                      users.filter(u => (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.role || "").toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                        <div
                          key={u.id}
                          className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center"
                          onClick={() => {
                            setFormData({ ...formData, user_id: String(u.id) })
                            setUserSearch(`${u.name} (${u.role}) ${u.apply_deductions ? "- (Deductions)" : ""}`)
                            setUserDropdownOpen(false)
                          }}
                        >
                          <span className="font-medium text-slate-800">{u.name}</span>
                          <span className="text-slate-500 text-xs">{u.role}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">Pegawai tidak ditemukan.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Dari Tanggal</Label>
              <Input id="start_date" type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Sampai Tanggal</Label>
              <Input id="end_date" type="date" required value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2 px-2 sm:px-4">
              {loading ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Calculator className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">Hitung Gaji</span>
            </Button>

            {error && <p className="text-sm text-red-500 mt-2 font-medium">{error}</p>}
          </form>
        </div>

        {/* Hasil Kalkulasi */}
        <div className="w-full lg:w-2/3">
          {result ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 border-b bg-slate-50/50 flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
                <div>
                  <h2 className="text-xl font-bold">Laporan Gaji: <span className="text-primary">{result.user.name}</span></h2>
                  <p className="text-sm text-slate-500 mt-1">Periode: {result.period.start} s/d {result.period.end}</p>
                </div>
                <div className="flex flex-col md:text-right gap-3 w-full sm:w-auto mt-4 md:mt-0">
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200 shadow-sm px-2 sm:px-3 w-full sm:w-auto">
                    <FileText className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </Button>
                </div>
              </div>

              <div className="p-6 flex flex-col h-full">
                <div className="mb-6 flex-grow">
                  <h3 className="font-semibold text-slate-800 mb-3">Daftar Tindakan</h3>
                  <div className="overflow-x-auto border border-slate-200 rounded">
                    <table className="w-full text-xs text-left min-w-[500px]">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2 border-b">Tanggal</th>
                          <th className="px-3 py-2 border-b">Tindakan</th>
                          <th className="px-3 py-2 border-b text-right">Tarif</th>
                          <th className="px-3 py-2 border-b text-right">Pot. Bahan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.logs && result.logs.length > 0 ? (
                          result.logs.map((log: any) => (
                            <tr key={log.id} className="border-b last:border-b-0 hover:bg-slate-50">
                              <td className="px-3 py-2 whitespace-nowrap">{new Date(log.date).toLocaleDateString('id-ID')}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className="font-medium text-slate-700">{log.treatment?.name}</span>
                                  {log.notes && <span className="text-[10px] text-slate-400">{log.notes}</span>}
                                  {log.treatment?.is_fixed_fee && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-100 text-red-600 font-bold">BEHEL</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right text-slate-700">{formatRupiah(log.applied_tariff)}</td>
                              <td className="px-3 py-2 text-right text-red-600">
                                {log.treatment?.is_fixed_fee ? '-' : formatRupiah(log.treatment?.material_deduction || 0)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                              Tidak ada data tindakan
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-auto border-t pt-6">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                    <Calculator className="w-4 h-4 mr-2" /> Rincian Rekapitulasi
                  </h3>
                  <div className="space-y-1 text-sm text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200">
                    <div className="flex justify-between py-1">
                      <span>ALL TARIF TINDAKAN</span>
                      <span className="font-medium text-slate-900">{formatRupiah(result.breakdown.total_all_tariff)}</span>
                    </div>

                    <div className="flex justify-between py-1 text-red-600">
                      <span>- TARIF ALL BEHEL</span>
                      <span>- {formatRupiah(result.breakdown.total_fixed_tariff)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-red-600">
                      <span>- POTONGAN BAHAN</span>
                      <span>- {formatRupiah(result.breakdown.total_material_deduction)}</span>
                    </div>

                    <div className="flex justify-between py-2 border-t border-dashed mt-2 font-semibold text-slate-800">
                      <span>TOTAL PEMBAGIAN</span>
                      <span>{formatRupiah(result.breakdown.total_pembagian)}</span>
                    </div>

                    <div className="flex justify-between py-1 mt-2">
                      <span>BAGI HASIL ({result.user.fee_percentage}%)</span>
                      <span className="font-medium text-slate-900">{formatRupiah(result.breakdown.total_pembagian * (result.user.fee_percentage / 100))}</span>
                    </div>

                    <div className="flex justify-between py-1 text-emerald-600">
                      <span>+ ALL JASA BEHEL</span>
                      <span>+ {formatRupiah(result.breakdown.total_fixed_medical_fee)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-primary text-white rounded-lg mt-4 shadow-md">
                    <span className="font-bold text-lg">TOTAL GAJI DOKTER</span>
                    <span className="font-bold text-2xl">{formatRupiah(result.total_gaji)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
              <Calculator className="w-12 h-12 mb-4 opacity-20" />
              <p>Pilih pegawai dan rentang tanggal, lalu klik Hitung Gaji</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
