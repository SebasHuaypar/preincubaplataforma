'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, SubmissionWithDetails, Week, Profile } from '@/lib/supabase'
import {
    FileUp,
    Download,
    CheckCircle2,
    XCircle,
    Eye,
    MessageSquare,
    Loader2,
    ArrowLeft,
    Filter,
    FileText
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminEntregasPage() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
    const [weeks, setWeeks] = useState<Week[]>([])
    const [filterWeek, setFilterWeek] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [feedbackId, setFeedbackId] = useState<string | null>(null)
    const [feedbackText, setFeedbackText] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!loading && !isAdmin) { router.push('/dashboard'); return }
        fetchData()
    }, [isAdmin, loading])

    async function fetchData() {
        const sb = getSupabase()
        const [subs, wks] = await Promise.all([
            sb.from('submissions').select('*, week:weeks(*), profile:profiles(*)').order('created_at', { ascending: false }),
            sb.from('weeks').select('*').order('week_number'),
        ])
        if (subs.data) setSubmissions(subs.data as unknown as SubmissionWithDetails[])
        if (wks.data) setWeeks(wks.data)
    }

    async function updateStatus(id: string, status: string) {
        setSaving(true)
        const sb = getSupabase()
        await sb.from('submissions').update({
            status,
            reviewed_at: new Date().toISOString(),
        }).eq('id', id)
        fetchData()
        setSaving(false)
    }

    async function saveFeedback(id: string) {
        setSaving(true)
        const sb = getSupabase()
        await sb.from('submissions').update({
            admin_feedback: feedbackText,
            status: 'reviewed',
            reviewed_at: new Date().toISOString(),
        }).eq('id', id)
        setFeedbackId(null)
        setFeedbackText('')
        fetchData()
        setSaving(false)
    }

    const filtered = submissions.filter(s => {
        if (filterWeek && s.week_id !== filterWeek) return false
        if (filterStatus && s.status !== filterStatus) return false
        return true
    })

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    function formatFileSize(bytes: number | null) {
        if (!bytes) return ''
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (!isAdmin) return null

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            <div className="flex items-center gap-3 mb-8">
                <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4 text-white/40" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Revisar Entregas</h1>
                    <p className="text-white/40 text-sm">{filtered.length} entregas {filterWeek || filterStatus ? '(filtrado)' : 'en total'}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-white/30" />
                    <select className="input-glass !w-auto !py-1.5 text-xs" value={filterWeek} onChange={e => setFilterWeek(e.target.value)}>
                        <option value="">Todas las semanas</option>
                        {weeks.map(w => <option key={w.id} value={w.id}>Semana {w.week_number}: {w.title}</option>)}
                    </select>
                </div>
                <select className="input-glass !w-auto !py-1.5 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="submitted">Enviado</option>
                    <option value="reviewed">Revisado</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                </select>
            </div>

            {/* Submissions list */}
            <div className="space-y-3">
                {filtered.map(sub => {
                    const week = sub.week as unknown as Week | null
                    const profile = sub.profile as unknown as Profile | null

                    return (
                        <div key={sub.id} className="glass-card rounded-xl p-5">
                            <div className="flex items-start gap-4">
                                {/* User avatar */}
                                <div className="w-10 h-10 rounded-full bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-yellow-600 text-sm font-bold">
                                        {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || '?'}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white font-medium text-sm">{profile?.full_name || profile?.email || 'Usuario'}</p>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none ${
                                            sub.status === 'approved' ? 'status-approved' :
                                            sub.status === 'rejected' ? 'status-rejected' :
                                            sub.status === 'reviewed' ? 'status-submitted' :
                                            'status-pending'
                                        }`}>
                                            {sub.status === 'approved' ? 'Aprobado' :
                                             sub.status === 'rejected' ? 'Rechazado' :
                                             sub.status === 'reviewed' ? 'Revisado' : 'Enviado'}
                                        </span>
                                    </div>

                                    {week && (
                                        <p className="text-white/30 text-xs mb-2">
                                            Semana {week.week_number}: {week.title} · {week.deliverable_title}
                                        </p>
                                    )}

                                    {/* File */}
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] mb-2">
                                        <FileText className="w-5 h-5 text-yellow-600/40" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white/60 text-xs truncate">{sub.file_name}</p>
                                            <p className="text-white/20 text-[10px]">{formatFileSize(sub.file_size)} · {formatDate(sub.created_at)}</p>
                                        </div>
                                        {sub.file_url && (
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/5 rounded-lg">
                                                <Download className="w-3.5 h-3.5 text-white/30" />
                                            </a>
                                        )}
                                    </div>

                                    {sub.notes && (
                                        <p className="text-white/40 text-xs mb-2 pl-3 border-l-2 border-white/10">{sub.notes}</p>
                                    )}

                                    {/* Feedback */}
                                    {feedbackId === sub.id ? (
                                        <div className="space-y-2 mt-3">
                                            <textarea
                                                className="input-glass resize-none text-xs"
                                                rows={2}
                                                value={feedbackText}
                                                onChange={e => setFeedbackText(e.target.value)}
                                                placeholder="Escribe tu feedback..."
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => saveFeedback(sub.id)} disabled={saving} className="px-3 py-1 bg-yellow-600 text-navy-900 font-bold rounded-lg text-xs cursor-pointer disabled:opacity-50">
                                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Enviar'}
                                                </button>
                                                <button onClick={() => { setFeedbackId(null); setFeedbackText('') }} className="px-3 py-1 text-white/30 text-xs cursor-pointer">Cancelar</button>
                                            </div>
                                        </div>
                                    ) : sub.admin_feedback ? (
                                        <div className="mt-2 p-2 rounded-lg bg-yellow-600/5 border border-yellow-600/10">
                                            <p className="text-yellow-600 text-[10px] font-bold mb-0.5">Feedback:</p>
                                            <p className="text-white/50 text-xs">{sub.admin_feedback}</p>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => { setFeedbackId(sub.id); setFeedbackText(sub.admin_feedback || '') }}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                        title="Feedback"
                                    >
                                        <MessageSquare className="w-4 h-4 text-white/30 hover:text-yellow-600" />
                                    </button>
                                    <button
                                        onClick={() => updateStatus(sub.id, 'approved')}
                                        className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                                        title="Aprobar"
                                    >
                                        <CheckCircle2 className="w-4 h-4 text-white/30 hover:text-emerald-500" />
                                    </button>
                                    <button
                                        onClick={() => updateStatus(sub.id, 'rejected')}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                        title="Rechazar"
                                    >
                                        <XCircle className="w-4 h-4 text-white/30 hover:text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="glass-card rounded-xl p-12 text-center">
                        <FileUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm">
                            {submissions.length === 0 ? 'No hay entregas aún' : 'No hay entregas con los filtros seleccionados'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
