import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function TreatmentLogCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])

  const [formData, setFormData] = useState({
    user_id: "",
    treatment_id: "",
    patient_name: "",
    applied_tariff: "",
    date: new Date().toISOString().split('T')[0] // default today
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }
        
        const [usersRes, treatmentsRes] = await Promise.all([
          axios.get(`${API_URL}/users`, { headers }),
          axios.get(`${API_URL}/treatments`, { headers })
        ])
        
        setUsers(usersRes.data || [])
        setTreatments(treatmentsRes.data || [])
      } catch (err) {
        console.error("Failed to fetch dependencies", err)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/treatment-logs`, {
        ...formData,
        user_id: Number(formData.user_id),
        treatment_id: Number(formData.treatment_id),
        applied_tariff: Number(formData.applied_tariff.replace(/\./g, ""))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate("/treatment-logs")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    if (id === 'applied_tariff') {
      const num = value.replace(/\D/g, "")
      const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
      setFormData({ ...formData, [id]: formatted })
    } else {
      setFormData({ ...formData, [id]: value })
    }
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/treatment-logs">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Catat Riwayat Tindakan Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Catat tindakan yang telah dilakukan pada pasien.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          <form id="log-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal Tindakan</Label>
              <Input id="date" type="date" required value={formData.date} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id">Pilih Tenaga Medis (Dokter/Perawat)</Label>
              <Select value={formData.user_id} onValueChange={v => setFormData({ ...formData, user_id: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tenaga Medis" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment_id">Pilih Jenis Tindakan</Label>
              <Select value={formData.treatment_id} onValueChange={v => setFormData({ ...formData, treatment_id: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tindakan" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_name">Nama Pasien</Label>
              <Input id="patient_name" placeholder="Misal: Budi" required value={formData.patient_name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applied_tariff">Tarif Dikenakan (Rp)</Label>
              <Input id="applied_tariff" type="text" placeholder="Misal: 3.000.000" required value={formData.applied_tariff} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Harga riil (setelah diskon jika ada) yang dibayar pasien untuk tindakan ini.</p>
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/treatment-logs">Batal</Link>
        </Button>
        <Button type="submit" form="log-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Riwayat
        </Button>
      </div>
    </div>
  )
}
