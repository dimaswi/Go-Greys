import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calculator, Loader2, ChevronDown, ChevronRight, FileText } from "lucide-react"
import { DataTable } from "@/components/DataTable"
import type { ColumnDef } from "@tanstack/react-table"

export default function PayrollList() {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1st of month
    end_date: new Date().toISOString().split('T')[0] // today
  })

  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const token = localStorage.getItem("token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

      const response = await axios.get(`${apiUrl}/payroll/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: formData.start_date,
          end_date: formData.end_date,
          _t: Date.now() // Cache buster
        }
      })

      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat mengambil list gaji")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka)
  }

  const handleDownloadPDF = (userId: string, userName: string) => {
    const token = localStorage.getItem("token")
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
    const url = `${apiUrl}/payroll/download-slip?user_id=${userId}&start_date=${formData.start_date}&end_date=${formData.end_date}`
    
    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).then((response) => {
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = fileUrl
      link.setAttribute('download', `Slip_Gaji_${userName.replace(/\s+/g, '_')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    }).catch(err => {
      console.error("Failed to download PDF", err)
      alert("Gagal mengunduh PDF")
    })
  }

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "expander",
      header: () => null,
      meta: { className: "w-[40px]" },
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.preventDefault()
              row.toggleExpanded()
            }}
          >
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </Button>
        )
      },
    },
    {
      accessorKey: "user.name",
      header: "Nama Pegawai",
      meta: { className: "min-w-[200px]" },
      cell: ({ row }) => <span className="font-medium">{row.original.user.name}</span>,
    },
    {
      accessorKey: "user.role",
      header: "Role",
      meta: { className: "hidden sm:table-cell w-[150px]" },
      cell: ({ row }) => row.original.user.role,
    },
    {
      id: "total_tindakan",
      header: () => <div className="text-right">Total Tindakan</div>,
      meta: { className: "hidden sm:table-cell w-[150px] text-right" },
      cell: ({ row }) => <div className="text-right">{row.original.logs.length}</div>,
    },
    {
      accessorKey: "total_gaji",
      header: () => <div className="text-right">Gaji Bersih</div>,
      meta: { className: "w-[180px] text-right" },
      cell: ({ row }) => (
        <div className="text-right font-bold text-emerald-600">
          {formatCurrency(row.original.total_gaji)}
        </div>
      ),
    }
  ], [])

  const renderSubComponent = ({ row }: any) => {
    const item = row.original
    return (
      <div className="py-4 pl-4 sm:pl-[68px] pr-4 animate-in slide-in-from-top-2 duration-200 bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* List Tindakan */}
          <div>
            <h4 className="text-sm font-semibold mb-3 text-slate-800 border-b pb-2">Rincian Tindakan</h4>
            {item.logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="pb-2 font-medium w-[100px]">Tanggal</th>
                      <th className="pb-2 font-medium">Tindakan</th>
                      <th className="pb-2 font-medium text-right">Tarif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {item.logs.map((log: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 text-slate-600 align-top">{new Date(log.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 text-slate-800 align-top whitespace-normal">
                          {log.treatment?.name || log.Treatment?.name || '-'}
                          {log.notes && <span className="text-slate-400 ml-1.5 block sm:inline">({log.notes})</span>}
                        </td>
                        <td className="py-2 text-right font-medium align-top">{formatCurrency(log.applied_tariff)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Tidak ada tindakan di periode ini.</p>
            )}
          </div>

          {/* Breakdown Section */}
          <div>
            <div className="flex justify-between items-end mb-3 border-b pb-2">
              <h4 className="text-sm font-semibold text-slate-800">Rumus Perhitungan</h4>
              <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(item.user.id, item.user.name)} className="h-7 text-xs bg-white text-indigo-600 border-indigo-200 px-2 sm:px-3">
                <FileText className="w-3 h-3 sm:mr-1.5" /> <span className="hidden sm:inline">Download PDF</span>
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tarif Semua Tindakan:</span>
                <span className="font-medium">{formatCurrency(item.breakdown.total_all_tariff)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif Tetap (Fixed Fee):</span>
                <span className="font-medium text-red-500">- {formatCurrency(item.breakdown.total_fixed_tariff)}</span>
              </div>
              {item.user.apply_deductions && (
                <div className="flex justify-between border-b pb-2 border-slate-200">
                  <span className="text-slate-500">Potongan Bahan:</span>
                  <span className="font-medium text-red-500">- {formatCurrency(item.breakdown.total_material_deduction)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Dasar Pembagian (Persentase):</span>
                <span className="font-medium text-blue-600">{formatCurrency(item.breakdown.total_pembagian)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Medis ({item.user.fee_percentage}%):</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(item.breakdown.total_pembagian * (item.user.fee_percentage / 100))}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-200">
                <span className="text-slate-500">Tambahan Jasa Medis Tetap:</span>
                <span className="font-medium text-emerald-600">+ {formatCurrency(item.breakdown.total_fixed_medical_fee)}</span>
              </div>
              <div className="flex justify-between pt-2 font-bold text-base">
                <span className="text-slate-800">Total Gaji Diterima:</span>
                <span className="text-emerald-600">{formatCurrency(item.total_gaji)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredData = useMemo(() => {
    if (!result?.data) return []
    if (!search) return result.data

    const lowerSearch = search.toLowerCase()
    return result.data.filter((item: any) =>
      item.user?.name?.toLowerCase().includes(lowerSearch)
    )
  }, [result, search])

  return (
    <PageShell
      title="List Gaji Pegawai"
      description="Lihat rekapitulasi gaji untuk semua tenaga medis dalam periode tertentu."
      actions={
        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
          <form onSubmit={handleCalculate} className="flex items-center gap-2 bg-white p-1 rounded-md border shadow-sm w-auto">
            <div className="flex items-center gap-2">
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-[120px] sm:w-[130px] h-8 text-xs border-transparent focus-visible:ring-0 shadow-none bg-slate-50"
              />
              <span className="text-muted-foreground text-xs font-medium shrink-0">s/d</span>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="w-[120px] sm:w-[130px] h-8 text-xs border-transparent focus-visible:ring-0 shadow-none bg-slate-50"
              />
            </div>
            <Button type="submit" disabled={loading} size="sm" className="h-8 px-2 sm:px-3 w-auto shrink-0">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5 sm:mr-1" />}
              {!loading && <span className="hidden sm:inline">Hitung</span>}
            </Button>
          </form>
          <Link to="/payroll" className="w-auto shrink-0">
            <Button variant="outline" size="sm" className="h-9 bg-white text-slate-700 shadow-sm w-auto px-2 sm:px-3">
              <Calculator className="w-4 h-4 sm:mr-2 text-slate-500" />
              <span className="hidden sm:inline">Kalkulator Personal</span>
            </Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Results */}
        {result && result.data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DataTable
              columns={columns}
              data={filteredData}
              renderSubComponent={renderSubComponent}
              getRowCanExpand={() => true}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Cari nama pegawai..."
            />
          </div>
        )}
      </div>
    </PageShell>
  )
}
