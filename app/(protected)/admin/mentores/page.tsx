'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Mentor } from '@/lib/supabase'
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Upload,
    Loader2,
    Users,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'

interface MentorForm {
    name: string
    role: string
    company: string
    bio: string
    photo_url: string
    linkedin_url: string
    email: string
    sort_order: number
    is_active: boolean
}

const emptyForm: MentorForm = {
    name: '', role: '', company: '', bio: '', photo_url: '',
    linkedin_url: '', email: '', sort_order: 0, is_active: true,
}

export default function AdminMentoresPage() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [form, setForm] = useState<MentorForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !isAdmin) { router.push('/dashboard'); return }
        fetchMentors()
    }, [isAdmin, loading])

    async function fetchMentors() {
        const sb = getSupabase()
        const { data } = await sb.from('mentors').select('*').order('sort_order')
        if (data) setMentors(data)
    }

    function startEdit(mentor: Mentor) {
        setEditingId(mentor.id)
        setIsCreating(false)
        setForm({
            name: mentor.name, role: mentor.role || '', company: mentor.company || '',
            bio: mentor.bio || '', photo_url: mentor.photo_url || '',
            linkedin_url: mentor.linkedin_url || '', email: mentor.email || '',
            sort_order: mentor.sort_order, is_active: mentor.is_active,
        })
    }

    function startCreate() {
        setIsCreating(true)
        setEditingId(null)
        setForm({ ...emptyForm, sort_order: mentors.length })
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
        const path = `mentors/${Date.now()}.${ext}`
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
                const { error } = await sb.from('mentors').insert(payload)
                if (error) throw error
            } else if (editingId) {
                const { error } = await sb.from('mentors').update(payload).eq('id', editingId)
                if (error) throw error
            }
            cancelEdit()
            fetchMentors()
        } catch (err) {
            console.error(err)
            alert('Error al guardar.')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        const sb = getSupabase()
        await sb.from('mentors').delete().eq('id', id)
        setDeleteConfirm(null)
        fetchMentors()
    }

    if (!isAdmin) return null
    const isEditing = editingId || isCreating

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-white/40" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gestionar Mentores</h1>
                        <p className="text-white/40 text-sm">Agregar, editar o eliminar mentores del programa</p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={startCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Mentor
                    </button>
                )}
            </div>

            {/* Edit / Create Form */}
            {isEditing && (
                <div className="glass-card rounded-2xl p-6 mb-8 animate-scale-in">
                    <h3 className="text-white font-bold mb-6">{isCreating ? 'Nuevo Mentor' : 'Editar Mentor'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Nombre *</label>
                            <input className="input-glass" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Cargo</label>
                            <input className="input-glass" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="CEO, CTO, Founder..." />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Empresa</label>
                            <input className="input-glass" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Nombre de la empresa" />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Email</label>
                            <input className="input-glass" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">LinkedIn URL</label>
                            <input className="input-glass" value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Orden</label>
                            <input className="input-glass" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-white/40 text-xs font-medium mb-1 block">Biografía</label>
                            <textarea className="input-glass resize-none" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Breve descripción del mentor..." />
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
                        <div className="sm:col-span-2 flex items-center gap-2">
                            <input type="checkbox" id="is-active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="accent-yellow-600" />
                            <label htmlFor="is-active" className="text-white/60 text-sm">Activo (visible para participantes)</label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
                        <button onClick={cancelEdit} className="px-4 py-2 text-white/40 hover:text-white/60 text-sm font-medium transition-colors cursor-pointer">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !form.name}
                            className="flex items-center gap-2 px-5 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* Mentors List */}
            <div className="space-y-3">
                {mentors.map(mentor => (
                    <div key={mentor.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                        {mentor.photo_url ? (
                            <img src={mentor.photo_url} alt={mentor.name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-yellow-600 font-bold">{mentor.name[0]}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-white font-bold text-sm truncate">{mentor.name}</p>
                                {!mentor.is_active && (
                                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-flex items-center justify-center leading-none">Inactivo</span>
                                )}
                            </div>
                            <p className="text-white/40 text-xs truncate">
                                {[mentor.role, mentor.company].filter(Boolean).join(' · ') || 'Sin detalle'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(mentor)} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <Pencil className="w-4 h-4 text-white/30 hover:text-yellow-600" />
                            </button>
                            <button onClick={() => setDeleteConfirm(mentor.id)} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
                            </button>
                        </div>
                    </div>
                ))}
                {mentors.length === 0 && !isEditing && (
                    <div className="glass-card rounded-xl p-12 text-center">
                        <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm mb-4">No hay mentores aún</p>
                        <button onClick={startCreate} className="px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm cursor-pointer">
                            Añadir primer mentor
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
                title="Eliminar mentor"
                message="¿Estás seguro de eliminar este mentor? Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />
        </div>
    )
}
