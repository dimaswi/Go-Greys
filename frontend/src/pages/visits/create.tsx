import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2, PlusCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import axios from "axios"
import { toast } from "sonner"
import { SearchableSelect, type Option } from "@/components/ui/searchable-select"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function VisitCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])

  const [searchParams] = useSearchParams()
  const initialPatientId = searchParams.get("patient_id") || ""

  const [formData, setFormData] = useState({
    patient_id: initialPatientId,
    doctor_id: "none", // 'none' means unassigned yet
    notes: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }

        const [patientsRes, doctorsRes] = await Promise.all([
          axios.get(`${API_URL}/patients`, { headers }),
          axios.get(`${API_URL}/users`, { headers })
        ])

        setPatients(patientsRes.data || [])

        // Filter users who are doctors
        const allUsers = doctorsRes.data || []
        setDoctors(allUsers.filter((u: any) => u.is_dokter))

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
      if (!formData.patient_id) {
        toast.error("Silakan pilih pasien terlebih dahulu dari daftar.")
        setLoading(false)
        return
      }

      const payload: any = {
        patient_id: Number(formData.patient_id),
        notes: formData.notes
      }
      if (formData.doctor_id !== "none") {
        payload.doctor_id = Number(formData.doctor_id)
      }

      await axios.post(`${API_URL}/visits`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate("/visits")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const patientOptions: Option[] = patients.map(p => ({
    value: String(p.ID),
    label: p.name,
    description: p.phone || ""
  }))

  const doctorOptions: Option[] = [
    { value: "none", label: "Belum Ditentukan (Assign Nanti)" },
    ...doctors.map(d => ({
      value: String(d.id),
      label: d.name,
      description: d.role
    }))
  ]

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/visits">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pendaftaran Kunjungan (Antrean)</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Daftarkan pasien ke antrean hari ini.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          <form id="visit-form" onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="patient_id">Pilih Pasien Terdaftar</Label>
                <Button variant="link" size="sm" asChild className="h-auto p-0">
                  <Link to="/patients/create"><PlusCircle className="h-3 w-3 mr-1" /> Pasien Baru</Link>
                </Button>
              </div>
              <SearchableSelect
                options={patientOptions}
                value={formData.patient_id}
                onValueChange={(val) => setFormData({ ...formData, patient_id: val })}
                placeholder="Pilih Pasien..."
                searchPlaceholder="Cari nama atau no. HP..."
                emptyText="Pasien tidak ditemukan."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctor_id">Dokter yang Dituju (Opsional)</Label>
              <SearchableSelect
                options={doctorOptions}
                value={formData.doctor_id}
                onValueChange={(val) => setFormData({ ...formData, doctor_id: val || "none" })}
                placeholder="Pilih Dokter..."
                searchPlaceholder="Cari nama dokter..."
                emptyText="Dokter tidak ditemukan."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Keluhan / Catatan Awal</Label>
              <textarea
                id="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Misal: Sakit gigi geraham bawah..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/visits">Batal</Link>
        </Button>
        <Button type="submit" form="visit-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
          ) : (
            <Save className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Masukkan Antrean</span>
        </Button>
      </div>
    </div>
  )
}
