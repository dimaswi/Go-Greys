import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function TreatmentCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    base_price: "",
    is_fixed_fee: false,
    material_deduction: "",
    fixed_medical_fee: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/treatments`, {
        ...formData,
        base_price: Number(formData.base_price.replace(/\./g, "")),
        material_deduction: Number(formData.material_deduction.replace(/\./g, "")),
        fixed_medical_fee: Number(formData.fixed_medical_fee.replace(/\./g, ""))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate("/treatments")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    if (id === 'base_price' || id === 'material_deduction' || id === 'fixed_medical_fee') {
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
            <Link to="/treatments">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Tindakan Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buat master data tindakan baru.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          <form id="treatment-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Tindakan</Label>
              <Input id="name" placeholder="Misal: Ekstraksi Gigi" required value={formData.name} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_price">Tarif Dasar / Harga Tindakan (Rp)</Label>
              <Input id="base_price" type="text" placeholder="Misal: 500.000" required value={formData.base_price} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Harga standar yang akan muncul di Ruang Periksa.</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="is_fixed_fee" 
                checked={formData.is_fixed_fee} 
                onChange={(e) => setFormData({ ...formData, is_fixed_fee: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_fixed_fee" className="font-normal cursor-pointer">
                Tindakan Khusus (Behel) - Set Fee Khusus Dokter
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_deduction">Potongan Bahan (Rp)</Label>
              <Input id="material_deduction" type="text" placeholder="Misal: 100.000" disabled={formData.is_fixed_fee} value={formData.material_deduction} onChange={handleChange} />
              <p className="text-xs text-muted-foreground">Kosongkan atau 0 jika tidak ada potongan bahan.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fixed_medical_fee">Fee Dokter Khusus Behel (Rp)</Label>
              <Input id="fixed_medical_fee" type="text" placeholder="Misal: 1.000.000" disabled={!formData.is_fixed_fee} value={formData.fixed_medical_fee} onChange={handleChange} />
              <p className="text-xs text-blue-600 font-medium">Fee ini akan ditambahkan LANGSUNG di akhir perhitungan gaji dokter (di luar persentase bagi hasil).</p>
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/treatments">Batal</Link>
        </Button>
        <Button type="submit" form="treatment-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan Tindakan
        </Button>
      </div>
    </div>
  )
}
