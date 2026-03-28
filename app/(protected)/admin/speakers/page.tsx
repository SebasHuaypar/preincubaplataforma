'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Speaker } from '@/lib/supabase'
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Upload,
    Loader2,
    Mic,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'

interface SpeakerForm {
    name: string
    role: string
    company: string
    bio: string
    photo_url: string
    linkedin_url: string
    sort_order: number
    is_active: boolean
}

const emptyForm: SpeakerForm = {
    name: '', role: '', company: '', bio: '', photo_url: '',
    linkedin_url: '', sort_order: 0, is_active: true,
}

export default function AdminSpeakersPage() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [speakers, setSpeakers] = useState<Speaker[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [form, setForm] = useState<SpeakerForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !isAdmin) { router.push('/dashboard'); return }
        fetchSpeakers()
    }, [isAdmin, loading])

    async function fetchSpeakers() {
        const sb = getSupabase()
        const { data } = await sb.from('speakers').select('*').order('sort_order')
        if (data) setSpeakers(data)
    }

    function startEdit(speaker: Speaker) {
        setEditingId(speaker.id)
        setIsCreating(false)
        setForm({
            name: speaker.name, role: speaker.role || '', company: speaker.company || '',
            bio: speaker.bio || '', photo_url: speaker.photo_url || '',
            linkedin_url: speaker.linkedin_url || '',
            sort_order: speaker.sort_order, is_active: speaker.is_active,
        })
    }

    function startCreate() {
        setIsCreating(true)
        setEditingId(null)
        setForm({ ...emptyForm, sort_order: speakers.length })
    }

    function cancelEdit() {
        setEditingId(null)
        setIsCreating(false)
        setForm(emptyForm)
        setPhotoFile(null)
    }

    async function uploadPhoto(): Promise<string | null> {
        if (!photoFile) return form.photo_url || null
        const sb = getSupabase()
        const ext = photoFile.name.split('.').pop()
        const path = `speakers/${Date.now()}.${ext}`
        const { error } = await sb.storage.from('mentor-photos').upload(path, photoFile)
        if (error) throw error
        const { data: { publicUrl } } = sb.storage.from('mentor-photos').getPublicUrl(path)
        return publicUrl
    }

    async function handleSave() {
        setSaving(true)
        try {
            const sb = getSupabase()
            const photoUrl = await uploadPhoto()
            const payload = { ...form, photo_url: photoUrl }

            if (isCreating) {
                const { error } = await sb.from('speakers').insert(payload)
                if (error) throw error
            } else if (editingId) {
                const { error } = await sb.from('speakers').update(payload).eq('id', editingId)
                if (error) throw error
            }
            cancelEdit()
            fetchSpeakers()
        } catch (err) {
            console.error(err)
            alert('Error al guardar.')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        const sb = getSupabase()
        await sb.from('speakers').delete().eq('id', id)
        setDeleteConfirm(null)
        fetchSpeakers()
    }

    if (!isAdmin) return null
    const isEditing = editingId || isCreating

    return (
        <>
            <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-white/40" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gestionar Speakers</h1>
                        <p className="text-white/40 text-sm">Añadir, editar o eliminar speakers del programa</p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={startCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Speaker
                    </button>
                )}
            </div>



            {/* Speakers List */}
            <div className="space-y-3">
                {speakers.map(speaker => (
                    <div key={speaker.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                        {speaker.photo_url ? (
                            <img src={speaker.photo_url} alt={speaker.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-400 font-bold">{speaker.name[0]}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-white font-bold text-sm truncate">{speaker.name}</p>
                                {!speaker.is_active && (
                                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-flex items-center justify-center leading-none">Inactivo</span>
                                )}
                            </div>
                            <p className="text-white/40 text-xs truncate">
                                {[speaker.role, speaker.company].filter(Boolean).join(' · ') || 'Sin detalle'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(speaker)} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <Pencil className="w-4 h-4 text-white/30 hover:text-yellow-600" />
                            </button>
                            <button onClick={() => setDeleteConfirm(speaker.id)} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
                            </button>
                        </div>
                    </div>
                ))}
                {speakers.length === 0 && !isEditing && (
                    <div className="glass-card rounded-xl p-12 text-center">
                        <Mic className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm mb-4">No hay speakers aún</p>
                        <button onClick={startCreate} className="px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm cursor-pointer">
                            Añadir primer speaker
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
                title="Eliminar speaker"
                message="¿Estás seguro de eliminar este speaker? Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />
        </div>

        {/* Edit / Create Form Modal */}
        {isEditing && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in relative scrollbar-hide">
                    <div className="glass-card rounded-2xl p-6 relative">
                        <button type="button" onClick={cancelEdit} className="absolute top-4 right-4 p-2 text-white/30 hover:bg-white/5 hover:text-white rounded-xl transition-colors cursor-pointer z-10">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl text-white font-bold mb-6">{isCreating ? 'Nuevo Speaker' : 'Editar Speaker'}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-white/40 text-xs font-medium mb-1 block">Nombre *</label>
                                <input className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-medium mb-1 block">Cargo</label>
                                <input className="input-glass" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="CEO, Founder, Experto en..." />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-medium mb-1 block">Empresa / Organización</label>
                                <input className="input-glass" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Nombre de la empresa" />
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-medium mb-1 block">LinkedIn URL</label>
                                <input className="input-glass" value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-white/40 text-xs font-medium mb-1 block">Biografía</label>
                                <textarea className="input-glass resize-none" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Breve descripción del speaker..." />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-white/40 text-xs font-medium mb-1 block">Foto</label>
                                <div className="flex items-center gap-4">
                                    {(form.photo_url || photoFile) && (
                                        <img
                                            src={photoFile ? URL.createObjectURL(photoFile) : form.photo_url}
                                            alt="Preview"
                                            className="w-16 h-16 rounded-xl object-cover"
                                        />
                                    )}
                                    <label className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-colors text-sm cursor-pointer">
                                        <Upload className="w-4 h-4" />
                                        {photoFile ? photoFile.name : 'Subir foto'}
                                        <input type="file" className="hidden" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="text-white/40 text-xs font-medium mb-1 block">Orden</label>
                                <input className="input-glass" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="flex items-center gap-2 self-end pb-3">
                                <input type="checkbox" id="sp-active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-yellow-600" />
                                <label htmlFor="sp-active" className="text-white/60 text-sm">Activo (visible para participantes)</label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
                            <button onClick={cancelEdit} className="px-4 py-2 text-white/40 hover:text-white/60 text-sm font-medium transition-colors cursor-pointer hover:bg-white/5 rounded-xl">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name}
                                className="flex items-center gap-2 px-5 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}
