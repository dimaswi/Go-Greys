import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, CheckCircle, PlusCircle, Trash, User, Stethoscope, FileText, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import dayjs from "dayjs"
import { useAuth } from "@/context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(angka)
}

export default function RoomPanel() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<any>(null)
  const [treatmentsList, setTreatmentsList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("")
  const [treatmentSearch, setTreatmentSearch] = useState("")
  const [treatmentDropdownOpen, setTreatmentDropdownOpen] = useState(false)
  
  const [selectedUserId, setSelectedUserId] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const [appliedTariff, setAppliedTariff] = useState("")
  const [treatmentNotes, setTreatmentNotes] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  
  const { user: currentUser } = useAuth()
  
  // Dialog state
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false)
  const [deleteLogId, setDeleteLogId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)

  const fetchVisit = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get(`${API_URL}/visits/${id}`, { headers })
      setVisit(res.data)
      
      // If status is menunggu, change to di_ruangan
      if (res.data.status === 'menunggu') {
        await axios.put(`${API_URL}/visits/${id}/status`, { status: 'di_ruangan' }, { headers })
        setVisit({ ...res.data, status: 'di_ruangan' })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }
    
    fetchVisit()
    
    // Fetch master treatments
    axios.get(`${API_URL}/treatments`, { headers })
      .then(res => setTreatmentsList(res.data || []))
      .catch(console.error)

    // Fetch users for dropdown
    axios.get(`${API_URL}/users`, { headers })
      .then(res => setUsersList(res.data || []))
      .catch(console.error)
  }, [id])

  useEffect(() => {
    if (visit && !selectedUserId && currentUser) {
      if (visit.doctor_id && visit.doctor) {
        setSelectedUserId(String(visit.doctor_id))
        setUserSearch(visit.doctor.name || "")
      } else if (currentUser?.id) {
        setSelectedUserId(String(currentUser.id))
        setUserSearch(currentUser.name || currentUser.identifier || "")
      }
    }
  }, [visit, currentUser])

  const handleAssignTreatment = async () => {
    if (!selectedTreatmentId || !appliedTariff || !selectedUserId) return
    setIsAssigning(true)
    try {
      const token = localStorage.getItem("token")

      await axios.post(`${API_URL}/treatment-logs`, {
        user_id: Number(selectedUserId),
        treatment_id: Number(selectedTreatmentId),
        visit_id: Number(id),
        patient_id: visit.patient_id,
        applied_tariff: Number(appliedTariff.replace(/\./g, "")),
        notes: treatmentNotes,
        date: new Date().toISOString()
      }, { headers: { Authorization: `Bearer ${token}` }})
      
      setSelectedTreatmentId("")
      setAppliedTariff("")
      setTreatmentNotes("")
      
      // Refresh visit to show new treatment logs
      await fetchVisit()
    } catch (err) {
      console.error(err)
      toast.error("Gagal menambahkan tindakan")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDeleteLog = async (logId: number) => {
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_URL}/treatment-logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchVisit()
      setDeleteLogId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleFinish = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(`${API_URL}/visits/${id}/status`, { status: 'selesai' }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsFinishDialogOpen(false)
      navigate("/visits")
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Ruang Periksa...</div>
  if (!visit) return <div className="p-8 text-center">Data Kunjungan Tidak Ditemukan</div>

  const isSelesai = visit.status === 'selesai'

  return (
    <div className="animate-fade-in flex flex-col flex-1 h-full">
      {/* HEADER */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm border border-slate-200 h-9 w-9">
            <Link to="/visits">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ruang Periksa: {visit.patient?.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola dan masukkan tindakan medis yang diberikan kepada pasien saat ini.</p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-4 px-4 md:px-6 lg:px-8 flex-1 mb-8">
        <div className="bg-white rounded-xl border shadow-sm p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            
            {/* Kolom Kiri: 30% */}
            <div className="lg:col-span-3 space-y-8 lg:border-r border-slate-100 lg:pr-8">
              
              {/* Profil Pasien */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
                  <User className="h-4 w-4" /> Data Pasien
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-slate-500 mb-1">Nama</span>
                    <span className="font-medium">{visit.patient?.name} ({visit.patient?.gender === 'L' ? 'L' : 'P'})</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">No. HP</span>
                    <span className="font-medium">{visit.patient?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Tgl. Lahir</span>
                    <span className="font-medium">{visit.patient?.birth_date && !visit.patient.birth_date.startsWith('0001') ? dayjs(visit.patient.birth_date).format('DD MMM YYYY') : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Keluhan */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2 border-b pb-2">
                  <FileText className="h-4 w-4" /> Keluhan Awal
                </h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg italic">
                  {visit.notes || 'Tidak ada catatan keluhan.'}
                </p>
              </div>

              {/* Status */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2 border-b pb-2">
                  <CheckCircle className="h-4 w-4" /> Status Kunjungan
                </h3>
                {isSelesai ? (
                  <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center font-semibold text-sm border border-green-200">
                    Kunjungan Telah Selesai
                  </div>
                ) : (
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-center font-semibold text-sm border border-blue-200">
                    SEDANG DIPERIKSA
                  </div>
                )}
              </div>

            </div>

            {/* Kolom Kanan: 70% */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Panel Tambah Tindakan */}
              {!isSelesai && (
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    Tambah Tindakan Baru
                  </h3>
                  
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/2 space-y-1 relative">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ditangani Oleh</label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Cari dokter atau perawat..."
                            className="bg-white pr-8 cursor-pointer"
                            value={userSearch}
                            onChange={e => {
                              setUserSearch(e.target.value)
                              setSelectedUserId("")
                              if (!userDropdownOpen) setUserDropdownOpen(true)
                            }}
                            onFocus={() => setUserDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setUserDropdownOpen(false), 200)}
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                        {userDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto bottom-full mb-1">
                            {usersList.filter(u => (u.name || "").toLowerCase().includes(userSearch.toLowerCase())).length > 0 ? (
                              usersList.filter(u => (u.name || "").toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                                <div
                                  key={u.id}
                                  className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center"
                                  onClick={() => {
                                    setSelectedUserId(String(u.id))
                                    setUserSearch(u.name || u.identifier)
                                    setUserDropdownOpen(false)
                                  }}
                                >
                                  <span className="font-medium text-slate-800">{u.name || u.identifier}</span>
                                  <span className="text-xs text-slate-500">{u.role}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 text-center">Pegawai tidak ditemukan.</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="w-full md:w-1/2 space-y-1 relative">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih Tindakan</label>
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Cari tindakan..."
                            className="bg-white pr-8 cursor-pointer"
                            value={treatmentSearch}
                            onChange={e => {
                              setTreatmentSearch(e.target.value)
                              setSelectedTreatmentId("")
                              setAppliedTariff("")
                              if (!treatmentDropdownOpen) setTreatmentDropdownOpen(true)
                            }}
                            onFocus={() => setTreatmentDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setTreatmentDropdownOpen(false), 200)}
                          />
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                        {treatmentDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto bottom-full mb-1">
                            {treatmentsList.filter(t => (t.name || "").toLowerCase().includes(treatmentSearch.toLowerCase())).length > 0 ? (
                              treatmentsList.filter(t => (t.name || "").toLowerCase().includes(treatmentSearch.toLowerCase())).map(t => (
                                <div
                                  key={t.ID}
                                  className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center"
                                  onClick={() => {
                                    setSelectedTreatmentId(String(t.ID))
                                    setTreatmentSearch(t.name)
                                    if (t.base_price) {
                                      const formatted = String(t.base_price).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                                      setAppliedTariff(formatted)
                                    }
                                    setTreatmentDropdownOpen(false)
                                  }}
                                >
                                  <span className="font-medium text-slate-800">{t.name}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500 text-center">Tindakan tidak ditemukan.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="w-full md:flex-1 space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan (Opsional)</label>
                        <Input 
                          type="text" 
                          placeholder="Misal: Gigi 45" 
                          className="bg-white"
                          value={treatmentNotes} 
                          onChange={e => setTreatmentNotes(e.target.value)} 
                        />
                      </div>

                      <div className="w-full md:w-48 space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarif (Rp)</label>
                        <Input 
                          type="text" 
                          placeholder="150.000" 
                          className="bg-white text-right font-medium"
                          value={appliedTariff} 
                          onChange={e => {
                            const num = e.target.value.replace(/\D/g, "")
                            setAppliedTariff(num.replace(/\B(?=(\d{3})+(?!\d))/g, "."))
                          }} 
                        />
                      </div>
                      
                      <Button onClick={handleAssignTreatment} disabled={!selectedTreatmentId || !appliedTariff || !selectedUserId || isAssigning} className="w-full md:w-auto px-6 shadow-sm h-10">
                        <PlusCircle className="sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Tambah</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Daftar Tindakan (Tabel) */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-700">Riwayat Tindakan Kunjungan Ini</h3>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                    {visit.treatment_logs?.length || 0} Tindakan
                  </span>
                </div>
                
                {!visit.treatment_logs || visit.treatment_logs.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">
                    Belum ada tindakan yang di-assign.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                    <table className="w-full text-sm text-left min-w-[500px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Tindakan</th>
                          <th className="px-4 py-3 font-medium">Oleh</th>
                          <th className="px-4 py-3 font-medium text-right">Tarif</th>
                          {!isSelesai && <th className="px-4 py-3 w-12 text-center">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visit.treatment_logs.map((log: any) => (
                          <tr key={log.ID} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-800 font-medium">
                              {log.treatment?.name}
                              {log.notes && (
                                <div className="text-xs font-normal text-slate-500 mt-0.5">Catatan: {log.notes}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{log.user?.name}</td>
                            <td className="px-4 py-3 text-slate-800 font-medium text-right">{formatRupiah(log.applied_tariff)}</td>
                            {!isSelesai && (
                              <td className="px-4 py-3 text-center">
                                <Button variant="ghost" size="icon" onClick={() => setDeleteLogId(log.ID)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-full">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700 text-right">Total Tarif Kunjungan:</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 text-base">{formatRupiah(visit.treatment_logs.reduce((acc: number, log: any) => acc + log.applied_tariff, 0))}</td>
                          {!isSelesai && <td></td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="sticky bottom-0 z-50 flex justify-end gap-3 bg-background/95 backdrop-blur border-t p-4 mt-auto shadow-sm">
        <Button variant="outline" asChild>
          <Link to="/visits">Kembali ke Antrean</Link>
        </Button>
        {!isSelesai && (
          <Button onClick={() => setIsFinishDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
            <CheckCircle className="sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Tandai Selesai</span>
          </Button>
        )}
      </div>

      {/* MODALS */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tandai Kunjungan Selesai</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menandai kunjungan ini sebagai selesai? Pastikan semua tindakan telah dicatat dengan benar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsFinishDialogOpen(false)}>Batal</Button>
            <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white">Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteLogId !== null} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tindakan</DialogTitle>
            <DialogDescription>
              Tindakan medis yang sudah dihapus tidak dapat dikembalikan. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteLogId(null)}>Batal</Button>
            <Button onClick={() => deleteLogId && handleDeleteLog(deleteLogId)} variant="destructive">Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
