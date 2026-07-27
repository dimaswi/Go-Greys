import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function UserCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role_id: "",
    fee_percentage: "",
    apply_deductions: false,
    is_dokter: false
  })

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRoles(res.data || [])
      } catch (err) {
        console.error("Failed to fetch roles", err)
      }
    }
    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.post(`${API_URL}/users`, {
        ...formData,
        role_id: Number(formData.role_id),
        fee_percentage: Number(formData.fee_percentage)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate("/users")
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/users">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah User Baru</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Buat akun pengguna baru untuk masuk ke sistem.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" placeholder="Masukkan nama lengkap" required value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Masukkan username" required value={formData.username} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Masukkan password" required value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role_id">Role</Label>
              <Select value={formData.role_id} onValueChange={v => setFormData({ ...formData, role_id: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee_percentage">Persentase Gaji / Fee (%)</Label>
              <Input id="fee_percentage" type="number" step="0.1" placeholder="Misal: 40" required value={formData.fee_percentage} onChange={handleChange} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="apply_deductions" 
                checked={formData.apply_deductions} 
                onChange={(e) => setFormData({ ...formData, apply_deductions: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="apply_deductions" className="font-normal cursor-pointer">
                Terapkan Aturan Potongan (Pemotongan bahan & rumus Behel)
              </Label>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="is_dokter" 
                checked={formData.is_dokter} 
                onChange={(e) => setFormData({ ...formData, is_dokter: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_dokter" className="font-normal cursor-pointer">
                Akun ini adalah seorang Dokter (Bisa dipilih saat pasien mendaftar antrean)
              </Label>
            </div>
          </form>
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/users">Batal</Link>
        </Button>
        <Button type="submit" form="user-form" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Simpan User
        </Button>
      </div>
    </div>
  )
}
