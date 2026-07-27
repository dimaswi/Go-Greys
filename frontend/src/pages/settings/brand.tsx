import { useState, useEffect } from "react"
import { useSiteConfig } from "@/context/SiteConfigContext"
import PageShell from "@/components/PageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import axios from "axios"
import { Save, Loader2, UploadCloud } from "lucide-react"
import { useRef } from "react"
import { resolveAssetUrl } from "@/lib/runtime"

export default function BrandSettings() {
  const { config, refreshConfig } = useSiteConfig()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    app_name: "",
    subtitle: "",
    logo_url: "",
    favicon_url: ""
  })
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData({
        app_name: config.app_name || "",
        subtitle: config.subtitle || "",
        logo_url: config.logo_url || "",
        favicon_url: config.favicon_url || ""
      })
    }
  }, [config])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      await axios.put(`${API_URL}/site-config`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Pengaturan berhasil disimpan!")
      await refreshConfig()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menyimpan pengaturan")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === 'logo') setUploadingLogo(true)
    else setUploadingFavicon(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      const token = localStorage.getItem("token")
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
      
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      })
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo_url: res.data.url }))
      } else {
        setFormData(prev => ({ ...prev, favicon_url: res.data.url }))
      }
      toast.success("File berhasil diunggah!")
    } catch (err: any) {
      toast.error("Gagal mengunggah file")
      console.error(err)
    } finally {
      if (type === 'logo') setUploadingLogo(false)
      else setUploadingFavicon(false)
    }
  }

  return (
    <PageShell
      title="Pengaturan Aplikasi"
      description="Ubah nama aplikasi, logo, dan ikon utama."
    >
      <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label htmlFor="app_name">Nama Aplikasi</Label>
              <Input
                id="app_name"
                value={formData.app_name}
                onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                required
                placeholder="Contoh: Greys Dental"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle / Slogan</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Contoh: Aplikasi Manajemen Klinik"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="logo_url">Logo Aplikasi</Label>
              <div className="flex gap-4 items-start">
                {formData.logo_url && (
                  <div className="w-20 h-20 border rounded-lg flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden shadow-sm">
                    <img src={resolveAssetUrl(formData.logo_url)} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png atau klik Upload"
                      className="flex-1 bg-slate-50"
                    />
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Logo akan tampil di bagian atas sidebar.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="favicon_url">Ikon Aplikasi (Favicon)</Label>
              <div className="flex gap-4 items-start">
                {formData.favicon_url && (
                  <div className="w-20 h-20 border rounded-lg flex items-center justify-center bg-slate-50 shrink-0 overflow-hidden shadow-sm">
                    <img src={resolveAssetUrl(formData.favicon_url)} alt="Favicon Preview" className="w-full h-full object-contain p-2" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="favicon_url"
                      value={formData.favicon_url}
                      onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                      placeholder="/favicon.svg atau klik Upload"
                      className="flex-1 bg-slate-50"
                    />
                    <input 
                      type="file" 
                      ref={faviconInputRef} 
                      className="hidden" 
                      accept="image/*,.ico"
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                    />
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploadingFavicon}
                    >
                      {uploadingFavicon ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Ikon yang akan tampil di tab browser.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  )
}
