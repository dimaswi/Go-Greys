import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, KeyRound } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import axios from "axios"
import { useAppDialog } from "@/context/AppDialogContext"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export default function UserEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dialog = useAppDialog()
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [roles, setRoles] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    role_id: "",
    fee_percentage: "",
    apply_deductions: false,
    is_dokter: false,
    hide_treatments: false
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }
        
        const [rolesRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/roles`, { headers }),
          axios.get(`${API_URL}/users`, { headers }) // Mock fetching single user via array for now
        ])
        
        setRoles(rolesRes.data || [])
        
        const user = usersRes.data.find((u: any) => u.id === id)
        if (user) {
          // Cari role_id berdasarkan nama role karena API getUsers mungkin cuma kirim nama role
          const userRole = rolesRes.data.find((r: any) => r.name === user.role)
          setFormData({
            name: user.name,
            username: user.username,
            role_id: userRole ? userRole.id : "",
            fee_percentage: user.fee_percentage ? String(user.fee_percentage) : "0",
            apply_deductions: !!user.apply_deductions,
            is_dokter: !!user.is_dokter,
            hide_treatments: !!user.hide_treatments
          })
        }
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/users/${id}`, {
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

  const handlePasswordChange = async () => {
    const newPassword = await dialog.prompt({
      title: "Ubah Password",
      message: "Masukkan password baru (minimal 6 karakter).",
      placeholder: "Password baru",
      password: true,
    })
    if (!newPassword) return
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter")
      return
    }

    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/users/${id}/password`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Password berhasil diperbarui")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah password")
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit User</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Ubah data pengguna ID: {id}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-full">
          {initialLoading ? (
            <div className="flex justify-center p-8 text-muted-foreground">Loading...</div>
          ) : (
            <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" required value={formData.username} onChange={handleChange} />
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
                <Input id="fee_percentage" type="number" step="0.1" required value={formData.fee_percentage} onChange={handleChange} />
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
              {formData.is_dokter && (
                <div className="flex items-center space-x-2 pt-2 p-3 bg-amber-50 rounded-md border border-amber-200">
                  <input 
                    type="checkbox" 
                    id="hide_treatments" 
                    checked={formData.hide_treatments} 
                    onChange={(e) => setFormData({ ...formData, hide_treatments: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600"
                  />
                  <Label htmlFor="hide_treatments" className="font-medium cursor-pointer text-amber-800">
                    Sembunyikan Rincian Tindakan di Slip Gaji PDF
                  </Label>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4">Keamanan</h3>
                <Button type="button" variant="outline" onClick={handlePasswordChange}>
                  <KeyRound className="h-4 w-4 sm:mr-2" />
                  Ubah Password Pengguna
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button type="button" variant="outline" asChild>
          <Link to="/users">Batal</Link>
        </Button>
        <Button type="submit" form="user-form" disabled={loading || initialLoading} className="min-w-[140px]">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
          ) : (
            <Save className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Simpan Perubahan</span>
        </Button>
      </div>
    </div>
  )
}
