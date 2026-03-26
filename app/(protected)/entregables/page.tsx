'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Week, Submission } from '@/lib/supabase'
import {
    FileUp,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    ExternalLink,
    Loader2,
    MessageSquare,
    Link,
    Palette,
    Send,
} from 'lucide-react'

export default function EntregablesPage() {
    const { profile } = useAuth()
    const [weeks, setWeeks] = useState<Week[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [submitting, setSubmitting] = useState<string | null>(null)
    const [linkInputs, setLinkInputs] = useState<Record<string, string>>({})
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [groupNames, setGroupNames] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchData()
    }, [profile])

    async function fetchData() {
        const sb = getSupabase()
        const { data: weeksData } = await sb.from('weeks').select('*').order('week_number')
        if (weeksData) setWeeks(weeksData)

        if (profile) {
            const { data: subsData } = await sb
                .from('submissions')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
            if (subsData) setSubmissions(subsData)
        }
    }

    async function handleSubmit(weekId: string) {
        if (!profile) return
        const link = linkInputs[weekId]?.trim()
        if (!link) { alert('Por favor ingresa el link de tu Canva.'); return }

        setSubmitting(weekId)
        try {
            const sb = getSupabase()
            const { error } = await sb
                .from('submissions')
                .insert({
                    user_id: profile.id,
                    week_id: weekId,
                    link_url: link,
                    notes: notes[weekId] || null,
                    group_name: groupNames[weekId]?.trim() || null,
                    status: 'submitted',
                })
            if (error) throw error
            fetchData()
            setLinkInputs(prev => ({ ...prev, [weekId]: '' }))
            setNotes(prev => ({ ...prev, [weekId]: '' }))
            setGroupNames(prev => ({ ...prev, [weekId]: '' }))
        } catch (err) {
            console.error('Submit error:', err)
            alert('Error al enviar. Intenta de nuevo.')
        } finally {
            setSubmitting(null)
        }
    }

    function getSubmission(weekId: string) {
        return submissions.find(s => s.week_id === weekId)
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('es-PE', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const statusConfig: Record<string, { label: string; icon: typeof Clock; class: string }> = {
        submitted: { label: 'Enviado', icon: Clock, class: 'status-pending' },
        reviewed: { label: 'Revisado', icon: Eye, class: 'status-submitted' },
        approved: { label: 'Aprobado', icon: CheckCircle2, class: 'status-approved' },
        rejected: { label: 'Rechazado', icon: XCircle, class: 'status-rejected' },
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Mis Entregables</h1>
                <p className="text-white/40 text-sm mt-1">Comparte el link de tu Canva editado para cada semana</p>
            </div>

            <div className="space-y-6">
                {weeks.map((week) => {
                    const sub = getSubmission(week.id)
                    const config = sub ? statusConfig[sub.status] : null
                    const StatusIcon = config?.icon || FileUp

                    return (
                        <div key={week.id} className="glass-card rounded-2xl overflow-hidden">
                            {/* Week header */}
                            <div className="p-5 border-b border-white/[0.06]" style={{ borderLeftWidth: 4, borderLeftColor: week.color }}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                                                Semana {week.week_number}
                                            </span>
                                            {config && (
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none ${config.class}`}>
                                                    {config.label}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-white font-bold">{week.title}</h3>
                                    </div>
                                    {sub && (
                                        <StatusIcon className={`w-5 h-5 ${
                                            sub.status === 'approved' ? 'text-emerald-500' :
                                            sub.status === 'rejected' ? 'text-red-400' :
                                            'text-yellow-600'
                                        }`} />
                                    )}
                                </div>
                                {week.deliverable_title && (
                                    <p className="text-white/50 text-sm mt-2">
                                        <span className="text-yellow-600 font-medium">Entregable:</span> {week.deliverable_title}
                                    </p>
                                )}
                                {week.deliverable_description && (
                                    <p className="text-white/30 text-xs mt-1">{week.deliverable_description}</p>
                                )}

                                {/* Template link */}
                                {week.template_url && (
                                    <a
                                        href={week.template_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#00C4CC]/10 text-[#00C4CC] rounded-lg text-xs font-medium hover:bg-[#00C4CC]/20 transition-colors"
                                    >
                                        <Palette className="w-3.5 h-3.5" />
                                        Ver plantilla en Canva
                                        <ExternalLink className="w-3 h-3 opacity-60" />
                                    </a>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {sub ? (
                                    /* ===== Existing submission ===== */
                                    <div className="space-y-4">
                                        {/* Link submitted */}
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <Link className="w-6 h-6 text-yellow-600/40 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">Entrega enviada</p>
                                                <a
                                                    href={(sub.link_url || sub.file_url) ?? '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-yellow-600/80 text-sm truncate block hover:text-yellow-600 transition-colors"
                                                >
                                                    {sub.link_url || sub.file_url || '—'}
                                                </a>
                                                {sub.group_name && (
                                                    <p className="text-white/30 text-[10px] mt-0.5">Grupo: <span className="text-white/50 font-medium">{sub.group_name}</span></p>
                                                )}
                                                <p className="text-white/20 text-[10px] mt-0.5">{formatDate(sub.created_at)}</p>
                                            </div>
                                            <a
                                                href={(sub.link_url || sub.file_url) ?? '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4 text-white/30" />
                                            </a>
                                        </div>

                                        {/* Notes */}
                                        {sub.notes && (
                                            <div className="pl-4 border-l-2 border-white/10">
                                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-1">Tu nota</p>
                                                <p className="text-white/50 text-sm">{sub.notes}</p>
                                            </div>
                                        )}

                                        {/* Admin feedback */}
                                        {sub.admin_feedback && (
                                            <div className="p-3 rounded-xl bg-yellow-600/5 border border-yellow-600/10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="w-3 h-3 text-yellow-600" />
                                                    <p className="text-yellow-600 text-[10px] font-bold uppercase tracking-wider">Feedback del equipo</p>
                                                </div>
                                                <p className="text-white/60 text-sm">{sub.admin_feedback}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ===== Link submission ===== */
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-white/40 text-xs font-medium mb-1.5 block">Nombre del grupo *</label>
                                            <input
                                                type="text"
                                                className="input-glass"
                                                placeholder="Ej: Equipo Alpha, Grupo 3..."
                                                value={groupNames[week.id] || ''}
                                                onChange={e => setGroupNames(prev => ({ ...prev, [week.id]: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                                                <Link className="w-3.5 h-3.5" />
                                                Link de tu Canva editado *
                                            </label>
                                            <input
                                                type="url"
                                                className="input-glass"
                                                placeholder="https://www.canva.com/design/tu-diseño/..."
                                                value={linkInputs[week.id] || ''}
                                                onChange={e => setLinkInputs(prev => ({ ...prev, [week.id]: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-white/40 text-xs font-medium mb-1.5 block">Notas adicionales (opcional)</label>
                                            <textarea
                                                value={notes[week.id] || ''}
                                                onChange={e => setNotes(prev => ({ ...prev, [week.id]: e.target.value }))}
                                                className="input-glass resize-none"
                                                rows={2}
                                                placeholder="Contexto sobre tu entrega..."
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleSubmit(week.id)}
                                            disabled={submitting === week.id || !linkInputs[week.id]?.trim() || !groupNames[week.id]?.trim()}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm disabled:opacity-40 cursor-pointer"
                                        >
                                            {submitting === week.id
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Send className="w-4 h-4" />
                                            }
                                            {submitting === week.id ? 'Enviando...' : 'Enviar entrega'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {weeks.length === 0 && (
                    <div className="glass-card rounded-xl p-16 text-center">
                        <FileUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm">Las semanas del programa serán publicadas pronto</p>
                    </div>
                )}
            </div>
        </div>
    )
}
