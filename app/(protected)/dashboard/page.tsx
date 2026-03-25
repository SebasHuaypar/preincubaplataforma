'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Week, SessionWithDetails, Announcement, Submission } from '@/lib/supabase'
import {
    Calendar,
    Clock,
    FileUp,
    CheckCircle2,
    AlertCircle,
    Users,
    BookOpen,
    ArrowRight,
    Megaphone,
    TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const { profile } = useAuth()
    const [weeks, setWeeks] = useState<Week[]>([])
    const [nextSession, setNextSession] = useState<SessionWithDetails | null>(null)
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [announcements, setAnnouncements] = useState<Announcement[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const sb = getSupabase()

        // Fetch weeks
        const { data: weeksData } = await sb
            .from('weeks')
            .select('*')
            .order('week_number')
        if (weeksData) setWeeks(weeksData)

        // Fetch next upcoming session
        const today = new Date().toISOString().split('T')[0]
        const { data: sessionsData } = await sb
            .from('sessions')
            .select('*, mentor:mentors(*), week:weeks(*)')
            .gte('session_date', today)
            .order('session_date')
            .order('start_time')
            .limit(1)
        if (sessionsData && sessionsData.length > 0) {
            setNextSession(sessionsData[0] as unknown as SessionWithDetails)
        }

        // Fetch user's submissions
        if (profile) {
            const { data: subsData } = await sb
                .from('submissions')
                .select('*')
                .eq('user_id', profile.id)
            if (subsData) setSubmissions(subsData)
        }

        // Fetch active announcements
        const { data: announcementsData } = await sb
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(3)
        if (announcementsData) setAnnouncements(announcementsData)
    }

    const totalDeliverables = weeks.length
    const submittedCount = submissions.length
    const approvedCount = submissions.filter(s => s.status === 'approved').length

    function formatDate(dateStr: string) {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
    }

    function formatTime(time: string | null) {
        if (!time) return ''
        return time.slice(0, 5)
    }

    const sessionTypeLabels: Record<string, string> = {
        ponencia: 'Ponencia',
        taller: 'Taller',
        mentoria: 'Mentoría',
        demo_day: 'Demo Day'
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-white">
                    ¡Hola, <span className="text-gradient">{profile?.full_name || 'Participante'}</span>! 👋
                </h1>
                <p className="text-white/40 text-sm mt-1">
                    Bienvenido a la plataforma de Pre-incubación START Lima
                </p>
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
                <div className="space-y-3">
                    {announcements.map((a) => (
                        <div
                            key={a.id}
                            className={`glass-card rounded-xl p-4 flex items-start gap-3 ${
                                a.priority === 'urgent' ? 'border-red-500/30 bg-red-500/5' :
                                a.priority === 'high' ? 'border-yellow-600/30 bg-yellow-600/5' : ''
                            }`}
                        >
                            <Megaphone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                a.priority === 'urgent' ? 'text-red-400' :
                                a.priority === 'high' ? 'text-yellow-600' : 'text-white/40'
                            }`} />
                            <div>
                                <p className="text-white/90 text-sm font-medium">{a.title}</p>
                                <p className="text-white/40 text-xs mt-0.5">{a.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-yellow-600/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-yellow-600" />
                        </div>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Progreso</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {submittedCount}<span className="text-white/30 text-lg">/{totalDeliverables}</span>
                    </p>
                    <p className="text-white/30 text-xs mt-1">Entregables enviados</p>
                </div>

                <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Aprobados</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {approvedCount}
                    </p>
                    <p className="text-white/30 text-xs mt-1">Entregables aprobados</p>
                </div>

                <div className="glass-card rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-navy-500/20 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-navy-300" />
                        </div>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Semana Actual</p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {getCurrentWeek(weeks)}
                    </p>
                    <p className="text-white/30 text-xs mt-1">de {totalDeliverables} semanas</p>
                </div>
            </div>

            {/* Next Session */}
            {nextSession && (
                <div className="glass-card rounded-xl p-6 hover-lift">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-yellow-600" />
                        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Próxima Sesión</h2>
                    </div>
                    <div className="flex items-start gap-5">
                        {/* Date badge */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-yellow-600/10 flex flex-col items-center justify-center">
                            <span className="text-yellow-600 text-xl font-bold leading-none">
                                {new Date(nextSession.session_date + 'T00:00:00').getDate()}
                            </span>
                            <span className="text-yellow-600/60 text-[10px] font-medium uppercase">
                                {new Date(nextSession.session_date + 'T00:00:00').toLocaleDateString('es-PE', { month: 'short' })}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-yellow-600/10 text-yellow-600 inline-flex items-center justify-center leading-none">
                                    {sessionTypeLabels[nextSession.session_type] || nextSession.session_type}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white">{nextSession.title}</h3>
                            {nextSession.description && (
                                <p className="text-white/40 text-sm mt-1 line-clamp-2">{nextSession.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-white/30 text-xs">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(nextSession.start_time)} - {formatTime(nextSession.end_time)}
                                </span>
                                {(nextSession as unknown as { mentor: { name: string } | null }).mentor && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {(nextSession as unknown as { mentor: { name: string } }).mentor.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        {nextSession.meeting_url && (
                            <a
                                href={nextSession.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 inline-flex items-center justify-center leading-none px-4 py-2.5 bg-yellow-600 text-navy-900 text-sm font-bold rounded-full hover:bg-yellow-500 transition-all"
                            >
                                Unirse
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Weeks Progress */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Programa por Semanas</h2>
                    <Link href="/calendario" className="text-yellow-600 text-xs font-medium hover:text-yellow-500 flex items-center gap-1 transition-colors">
                        Ver calendario <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {weeks.map((week) => {
                        const sub = submissions.find(s => s.week_id === week.id)
                        return (
                            <div key={week.id} className="glass-card rounded-xl p-5 hover-lift">
                                <div className="flex items-center gap-2 mb-3">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: week.color }}
                                    />
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                                        Semana {week.week_number}
                                    </p>
                                </div>
                                <h3 className="text-white font-bold text-sm mb-1">{week.title}</h3>
                                {week.subtitle && (
                                    <p className="text-white/30 text-xs mb-3">{week.subtitle}</p>
                                )}
                                {/* Deliverable status */}
                                <div className="mt-auto pt-3 border-t border-white/[0.06]">
                                    {sub ? (
                                        <div className="flex items-center gap-2">
                                            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none ${
                                                sub.status === 'approved' ? 'status-approved' :
                                                sub.status === 'rejected' ? 'status-rejected' :
                                                sub.status === 'reviewed' ? 'status-submitted' :
                                                'status-pending'
                                            }`}>
                                                {sub.status === 'approved' ? '✓ Aprobado' :
                                                 sub.status === 'rejected' ? '✗ Rechazado' :
                                                 sub.status === 'reviewed' ? '👁 Revisado' :
                                                 '📤 Enviado'}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            href="/entregables"
                                            className="flex items-center gap-1 text-yellow-600/60 hover:text-yellow-600 text-xs font-medium transition-colors"
                                        >
                                            <FileUp className="w-3 h-3" />
                                            Subir entregable
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function getCurrentWeek(weeks: Week[]): number {
    const today = new Date()
    for (const week of weeks) {
        if (week.start_date && week.end_date) {
            const start = new Date(week.start_date)
            const end = new Date(week.end_date)
            if (today >= start && today <= end) {
                return week.week_number
            }
        }
    }
    return weeks.length > 0 ? 1 : 0
}
