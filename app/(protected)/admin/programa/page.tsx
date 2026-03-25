'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Week, Session as SessionType, Mentor } from '@/lib/supabase'
import {
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    Loader2,
    BookOpen,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Calendar,
    Clock,
    Users
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ConfirmModal'

export default function AdminProgramaPage() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [weeks, setWeeks] = useState<Week[]>([])
    const [sessions, setSessions] = useState<SessionType[]>([])
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

    // Week editing
    const [editingWeek, setEditingWeek] = useState<string | null>(null)
    const [weekForm, setWeekForm] = useState<Partial<Week>>({})

    // Session editing
    const [editingSession, setEditingSession] = useState<string | null>(null)
    const [creatingSessionWeek, setCreatingSessionWeek] = useState<string | null>(null)
    const [sessionForm, setSessionForm] = useState<Partial<SessionType>>({})

    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'week' | 'session'; id: string; label: string } | null>(null)

    useEffect(() => {
        if (!loading && !isAdmin) { router.push('/dashboard'); return }
        fetchData()
    }, [isAdmin, loading])

    async function fetchData() {
        const sb = getSupabase()
        const [w, s, m] = await Promise.all([
            sb.from('weeks').select('*').order('week_number'),
            sb.from('sessions').select('*').order('session_date').order('start_time'),
            sb.from('mentors').select('*').eq('is_active', true).order('name'),
        ])
        if (w.data) setWeeks(w.data)
        if (s.data) setSessions(s.data)
        if (m.data) setMentors(m.data)
    }

    function getSessionsForWeek(weekId: string) {
        return sessions.filter(s => s.week_id === weekId)
    }

    // Week CRUD
    function startEditWeek(week: Week) {
        setEditingWeek(week.id)
        setWeekForm(week)
    }

    async function saveWeek() {
        setSaving(true)
        try {
            const sb = getSupabase()
            const { id, created_at, updated_at, ...payload } = weekForm as Week
            if (editingWeek) {
                await sb.from('weeks').update(payload).eq('id', editingWeek)
            }
            setEditingWeek(null)
            setWeekForm({})
            fetchData()
        } catch { alert('Error al guardar') }
        finally { setSaving(false) }
    }

    async function createWeek() {
        const sb = getSupabase()
        const nextNum = weeks.length + 1
        await sb.from('weeks').insert({
            week_number: nextNum,
            title: `Semana ${nextNum}`,
            color: ['#FFC700', '#34d399', '#818cf8', '#f472b6'][nextNum % 4],
        })
        fetchData()
    }

    async function deleteWeek(id: string) {
        const sb = getSupabase()
        await sb.from('weeks').delete().eq('id', id)
        setDeleteConfirm(null)
        fetchData()
    }

    // Session CRUD
    function startEditSession(session: SessionType) {
        setEditingSession(session.id)
        setCreatingSessionWeek(null)
        setSessionForm(session)
    }

    function startCreateSession(weekId: string) {
        setCreatingSessionWeek(weekId)
        setEditingSession(null)
        setSessionForm({
            week_id: weekId,
            title: '',
            session_date: '',
            start_time: '19:00',
            end_time: '20:00',
            session_type: 'ponencia',
            sort_order: getSessionsForWeek(weekId).length,
        })
    }

    async function saveSession() {
        setSaving(true)
        try {
            const sb = getSupabase()
            if (creatingSessionWeek) {
                const { id, created_at, updated_at, ...payload } = sessionForm as SessionType
                await sb.from('sessions').insert(payload)
            } else if (editingSession) {
                const { id, created_at, updated_at, ...payload } = sessionForm as SessionType
                await sb.from('sessions').update(payload).eq('id', editingSession)
            }
            setEditingSession(null)
            setCreatingSessionWeek(null)
            setSessionForm({})
            fetchData()
        } catch { alert('Error al guardar') }
        finally { setSaving(false) }
    }

    async function deleteSession(id: string) {
        const sb = getSupabase()
        await sb.from('sessions').delete().eq('id', id)
        setDeleteConfirm(null)
        fetchData()
    }

    if (!isAdmin) return null

    const isEditingSession = editingSession || creatingSessionWeek

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-white/40" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gestionar Programa</h1>
                        <p className="text-white/40 text-sm">Semanas, sesiones y calendario</p>
                    </div>
                </div>
                <button
                    onClick={createWeek}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Semana
                </button>
            </div>

            {/* Weeks Accordion */}
            <div className="space-y-4">
                {weeks.map(week => {
                    const weekSessions = getSessionsForWeek(week.id)
                    const isExpanded = expandedWeek === week.id
                    const isEditingThisWeek = editingWeek === week.id

                    return (
                        <div key={week.id} className="glass-card rounded-2xl overflow-hidden" style={{ borderLeftWidth: 4, borderLeftColor: week.color }}>
                            {/* Week Header */}
                            {isEditingThisWeek ? (
                                <div className="p-5 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Título</label>
                                            <input className="input-glass" value={weekForm.title || ''} onChange={e => setWeekForm({ ...weekForm, title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Subtítulo</label>
                                            <input className="input-glass" value={weekForm.subtitle || ''} onChange={e => setWeekForm({ ...weekForm, subtitle: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Fecha inicio</label>
                                            <input className="input-glass" type="date" value={weekForm.start_date || ''} onChange={e => setWeekForm({ ...weekForm, start_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Fecha fin</label>
                                            <input className="input-glass" type="date" value={weekForm.end_date || ''} onChange={e => setWeekForm({ ...weekForm, end_date: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-white/40 text-xs mb-1 block">Objetivo</label>
                                            <textarea className="input-glass resize-none" rows={2} value={weekForm.objective || ''} onChange={e => setWeekForm({ ...weekForm, objective: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Título del Entregable</label>
                                            <input className="input-glass" value={weekForm.deliverable_title || ''} onChange={e => setWeekForm({ ...weekForm, deliverable_title: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-white/40 text-xs mb-1 block">Color</label>
                                            <input className="input-glass" type="color" value={weekForm.color || '#FFC700'} onChange={e => setWeekForm({ ...weekForm, color: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-white/40 text-xs mb-1 block">Descripción del Entregable</label>
                                            <textarea className="input-glass resize-none" rows={2} value={weekForm.deliverable_description || ''} onChange={e => setWeekForm({ ...weekForm, deliverable_description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button onClick={() => { setEditingWeek(null); setWeekForm({}) }} className="px-3 py-1.5 text-white/40 text-sm cursor-pointer">Cancelar</button>
                                        <button onClick={saveWeek} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-yellow-600 text-navy-900 font-bold rounded-lg text-sm cursor-pointer disabled:opacity-50">
                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setExpandedWeek(isExpanded ? null : week.id)}
                                    className="w-full p-5 flex items-center justify-between text-left cursor-pointer"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">
                                                Semana {week.week_number}
                                            </span>
                                            <span className="text-white/20 text-[10px]">· {weekSessions.length} sesiones</span>
                                        </div>
                                        <h3 className="text-white font-bold">{week.title}</h3>
                                        {week.start_date && week.end_date && (
                                            <p className="text-white/30 text-xs mt-0.5">{week.start_date} → {week.end_date}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); startEditWeek(week) }} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                            <Pencil className="w-3.5 h-3.5 text-white/30" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'week', id: week.id, label: week.title }) }} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                            <Trash2 className="w-3.5 h-3.5 text-white/30" />
                                        </button>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                                    </div>
                                </button>
                            )}

                            {/* Sessions */}
                            {isExpanded && !isEditingThisWeek && (
                                <div className="border-t border-white/[0.06] p-5 space-y-3">
                                    {weekSessions.map(session => (
                                        <div key={session.id}>
                                            {editingSession === session.id ? (
                                                <SessionForm
                                                    form={sessionForm}
                                                    setForm={setSessionForm}
                                                    mentors={mentors}
                                                    onSave={saveSession}
                                                    onCancel={() => { setEditingSession(null); setSessionForm({}) }}
                                                    saving={saving}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-yellow-600/10 text-yellow-600 inline-flex items-center justify-center leading-none">
                                                                {session.session_type}
                                                            </span>
                                                        </div>
                                                        <p className="text-white text-sm font-medium truncate">{session.title}</p>
                                                        <p className="text-white/30 text-xs flex items-center gap-3 mt-0.5">
                                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {session.session_date}</span>
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.start_time?.slice(0,5)} - {session.end_time?.slice(0,5)}</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => startEditSession(session)} className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer">
                                                            <Pencil className="w-3.5 h-3.5 text-white/30" />
                                                        </button>
                                                        <button onClick={() => setDeleteConfirm({ type: 'session', id: session.id, label: session.title })} className="p-1.5 hover:bg-white/5 rounded-lg cursor-pointer">
                                                            <Trash2 className="w-3.5 h-3.5 text-white/30" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {creatingSessionWeek === week.id ? (
                                        <SessionForm
                                            form={sessionForm}
                                            setForm={setSessionForm}
                                            mentors={mentors}
                                            onSave={saveSession}
                                            onCancel={() => { setCreatingSessionWeek(null); setSessionForm({}) }}
                                            saving={saving}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => startCreateSession(week.id)}
                                            className="w-full p-3 rounded-xl border border-dashed border-white/10 text-white/30 text-sm hover:border-yellow-600/30 hover:text-yellow-600/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Agregar sesión
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}

                {weeks.length === 0 && (
                    <div className="glass-card rounded-xl p-12 text-center">
                        <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm mb-4">No hay semanas configuradas</p>
                        <button onClick={createWeek} className="px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl text-sm cursor-pointer">
                            Crear primera semana
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onConfirm={() => {
                    if (deleteConfirm?.type === 'week') deleteWeek(deleteConfirm.id)
                    else if (deleteConfirm?.type === 'session') deleteSession(deleteConfirm.id)
                }}
                onCancel={() => setDeleteConfirm(null)}
                title={deleteConfirm?.type === 'week' ? 'Eliminar semana' : 'Eliminar sesión'}
                message={deleteConfirm?.type === 'week'
                    ? `¿Eliminar "${deleteConfirm?.label}" y todas sus sesiones? Esta acción no se puede deshacer.`
                    : `¿Eliminar la sesión "${deleteConfirm?.label}"? Esta acción no se puede deshacer.`
                }
                confirmText="Eliminar"
            />
        </div>
    )
}

// Session form subcomponent
function SessionForm({ form, setForm, mentors, onSave, onCancel, saving }: {
    form: Partial<SessionType>
    setForm: (f: Partial<SessionType>) => void
    mentors: Mentor[]
    onSave: () => void
    onCancel: () => void
    saving: boolean
}) {
    return (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-yellow-600/10 space-y-3 animate-scale-in">
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <label className="text-white/40 text-xs mb-1 block">Título *</label>
                    <input className="input-glass" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nombre de la sesión" />
                </div>
                <div>
                    <label className="text-white/40 text-xs mb-1 block">Fecha *</label>
                    <input className="input-glass" type="date" value={form.session_date || ''} onChange={e => setForm({ ...form, session_date: e.target.value })} />
                </div>
                <div>
                    <label className="text-white/40 text-xs mb-1 block">Tipo</label>
                    <select className="input-glass" value={form.session_type || 'ponencia'} onChange={e => setForm({ ...form, session_type: e.target.value as SessionType['session_type'] })}>
                        <option value="ponencia">Ponencia</option>
                        <option value="taller">Taller</option>
                        <option value="mentoria">Mentoría</option>
                        <option value="demo_day">Demo Day</option>
                    </select>
                </div>
                <div>
                    <label className="text-white/40 text-xs mb-1 block">Hora inicio</label>
                    <input className="input-glass" type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                    <label className="text-white/40 text-xs mb-1 block">Hora fin</label>
                    <input className="input-glass" type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
                <div className="col-span-2">
                    <label className="text-white/40 text-xs mb-1 block">Mentor</label>
                    <select className="input-glass" value={form.mentor_id || ''} onChange={e => setForm({ ...form, mentor_id: e.target.value || null })}>
                        <option value="">Sin mentor asignado</option>
                        {mentors.map(m => <option key={m.id} value={m.id}>{m.name} {m.company ? `(${m.company})` : ''}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="text-white/40 text-xs mb-1 block">Descripción</label>
                    <textarea className="input-glass resize-none" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción de la sesión..." />
                </div>
                <div>
                    <label className="text-white/40 text-xs mb-1 block">Link de reunión</label>
                    <input className="input-glass" value={form.meeting_url || ''} onChange={e => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://meet.google.com/..." />
                </div>
                <div>
                    <label className="text-white/40 text-xs mb-1 block">Link de grabación</label>
                    <input className="input-glass" value={form.recording_url || ''} onChange={e => setForm({ ...form, recording_url: e.target.value })} placeholder="https://youtube.com/..." />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-white/40 text-sm cursor-pointer">Cancelar</button>
                <button onClick={onSave} disabled={saving || !form.title || !form.session_date} className="flex items-center gap-1 px-4 py-1.5 bg-yellow-600 text-navy-900 font-bold rounded-lg text-sm cursor-pointer disabled:opacity-50">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                </button>
            </div>
        </div>
    )
}
