'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Week, Submission } from '@/lib/supabase'
import {
    FileUp,
    Upload,
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Download,
    FileText,
    Trash2,
    Loader2,
    MessageSquare
} from 'lucide-react'

export default function EntregablesPage() {
    const { profile } = useAuth()
    const [weeks, setWeeks] = useState<Week[]>([])
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [uploading, setUploading] = useState<string | null>(null)
    const [uploadNotes, setUploadNotes] = useState<Record<string, string>>({})
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

    async function handleUpload(weekId: string, file: File) {
        if (!profile) return
        setUploading(weekId)

        try {
            const sb = getSupabase()
            const ext = file.name.split('.').pop()
            const path = `${profile.id}/${weekId}/${Date.now()}.${ext}`

            // Upload file
            const { error: uploadError } = await sb.storage
                .from('uploads')
                .upload(path, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = sb.storage
                .from('uploads')
                .getPublicUrl(path)

            // Create submission record
            const { error: insertError } = await sb
                .from('submissions')
                .insert({
                    user_id: profile.id,
                    week_id: weekId,
                    file_url: publicUrl,
                    file_name: file.name,
                    file_size: file.size,
                    notes: uploadNotes[weekId] || null,
                    status: 'submitted',
                })

            if (insertError) throw insertError

            // Refresh
            fetchData()
            setUploadNotes(prev => ({ ...prev, [weekId]: '' }))
        } catch (err) {
            console.error('Upload error:', err)
            alert('Error al subir el archivo. Intenta de nuevo.')
        } finally {
            setUploading(null)
        }
    }

    function getSubmission(weekId: string) {
        return submissions.find(s => s.week_id === weekId)
    }

    function formatFileSize(bytes: number | null) {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
                <p className="text-white/40 text-sm mt-1">Sube tus entregas semanales aquí</p>
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
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {sub ? (
                                    /* ===== Existing submission ===== */
                                    <div className="space-y-4">
                                        {/* File info */}
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <FileText className="w-8 h-8 text-yellow-600/40" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white/80 text-sm font-medium truncate">{sub.file_name}</p>
                                                <p className="text-white/30 text-xs">
                                                    {formatFileSize(sub.file_size)} · {formatDate(sub.created_at)}
                                                </p>
                                            </div>
                                            {sub.file_url && (
                                                <a
                                                    href={sub.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-4 h-4 text-white/40" />
                                                </a>
                                            )}
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
                                    /* ===== Upload area ===== */
                                    <div>
                                        <input
                                            ref={(el) => { fileInputRefs.current[week.id] = el }}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.pptx,.ppt,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg,.mp4,.figma"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleUpload(week.id, file)
                                            }}
                                        />

                                        {/* Notes input */}
                                        <textarea
                                            value={uploadNotes[week.id] || ''}
                                            onChange={(e) => setUploadNotes(prev => ({ ...prev, [week.id]: e.target.value }))}
                                            className="input-glass mb-3 resize-none"
                                            rows={2}
                                            placeholder="Notas adicionales (opcional)..."
                                        />

                                        {/* Drop zone */}
                                        <div
                                            className={`drop-zone ${uploading === week.id ? 'border-yellow-600/40 bg-yellow-600/5' : ''}`}
                                            onClick={() => fileInputRefs.current[week.id]?.click()}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
                                            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                e.currentTarget.classList.remove('drag-over')
                                                const file = e.dataTransfer.files?.[0]
                                                if (file) handleUpload(week.id, file)
                                            }}
                                        >
                                            {uploading === week.id ? (
                                                <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mx-auto mb-2" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-white/15 mx-auto mb-2" />
                                            )}
                                            <p className="text-white/40 text-sm font-medium">
                                                {uploading === week.id ? 'Subiendo...' : 'Arrastra tu archivo aquí o haz click'}
                                            </p>
                                            <p className="text-white/20 text-xs mt-1">
                                                PDF, PPTX, DOC, XLSX, ZIP, imágenes (máx. 50MB)
                                            </p>
                                        </div>
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
