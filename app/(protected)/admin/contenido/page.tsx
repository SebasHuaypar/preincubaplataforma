'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Announcement } from '@/lib/supabase'
import {
    Save,
    Loader2,
    ArrowLeft,
    Megaphone,
    Plus,
    Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'

export default function AdminContenidoPage() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    // New announcement form
    const [newTitle, setNewTitle] = useState('')
    const [newContent, setNewContent] = useState('')
    const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')

    useEffect(() => {
        if (!loading && !isAdmin) { router.push('/dashboard'); return }
        fetchData()
    }, [isAdmin, loading])

    async function fetchData() {
        const sb = getSupabase()
        const { data } = await sb.from('announcements').select('*').order('created_at', { ascending: false })
        if (data) setAnnouncements(data)
    }

    async function createAnnouncement() {
        if (!newTitle || !newContent) return
        setSaving(true)
        const sb = getSupabase()
        await sb.from('announcements').insert({
            title: newTitle,
            content: newContent,
            priority: newPriority,
        })
        setNewTitle('')
        setNewContent('')
        setNewPriority('normal')
        fetchData()
        setSaving(false)
    }

    async function toggleAnnouncement(id: string, is_active: boolean) {
        const sb = getSupabase()
        await sb.from('announcements').update({ is_active: !is_active }).eq('id', id)
        fetchData()
    }

    async function deleteAnnouncement(id: string) {
        const sb = getSupabase()
        await sb.from('announcements').delete().eq('id', id)
        setDeleteConfirm(null)
        fetchData()
    }

    if (!isAdmin) return null

    const priorityColors: Record<string, string> = {
        low: 'text-white/30',
        normal: 'text-white/50',
        high: 'text-yellow-600',
        urgent: 'text-red-400',
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex items-center gap-3 mb-8">
                <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4 text-white/40" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Anuncios</h1>
                    <p className="text-white/40 text-sm">Gestionar notificaciones del programa</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* New announcement form */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4">Nuevo Anuncio</h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <input className="input-glass" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título del anuncio" />
                            </div>
                            <select className="input-glass" value={newPriority} onChange={e => setNewPriority(e.target.value as Announcement['priority'])}>
                                <option value="low">Baja</option>
                                <option value="normal">Normal</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                            </select>
                        </div>
                        <textarea className="input-glass resize-none" rows={3} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Contenido del anuncio..." />
                        <button
                            onClick={createAnnouncement}
                            disabled={saving || !newTitle || !newContent}
                            className="flex items-center gap-2 px-5 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 text-sm disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Publicar
                        </button>
                    </div>
                </div>

                {/* Announcements list */}
                <div className="space-y-3">
                    {announcements.map(a => (
                        <div key={a.id} className={`glass-card rounded-xl p-4 ${!a.is_active ? 'opacity-40' : ''}`}>
                            <div className="flex items-start gap-3">
                                <Megaphone className={`w-4 h-4 mt-0.5 ${priorityColors[a.priority]}`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white font-medium text-sm">{a.title}</p>
                                        <span className={`text-[10px] font-bold uppercase ${priorityColors[a.priority]}`}>{a.priority}</span>
                                    </div>
                                    <p className="text-white/40 text-xs">{a.content}</p>
                                    <p className="text-white/20 text-[10px] mt-1">
                                        {new Date(a.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => toggleAnnouncement(a.id, a.is_active)} className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${a.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                                        {a.is_active ? 'Activo' : 'Inactivo'}
                                    </button>
                                    <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer">
                                        <Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onConfirm={() => deleteConfirm && deleteAnnouncement(deleteConfirm)}
                onCancel={() => setDeleteConfirm(null)}
                title="Eliminar anuncio"
                message="¿Estás seguro de eliminar este anuncio? Esta acción no se puede deshacer."
                confirmText="Eliminar"
            />
        </div>
    )
}
