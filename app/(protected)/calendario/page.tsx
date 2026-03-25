'use client'

import { useEffect, useState, useMemo } from 'react'
import { getSupabase, Session as SessionType, SessionWithDetails, Week, Mentor } from '@/lib/supabase'
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Users,
    MapPin,
    ExternalLink,
    X,
    Video,
    Mic,
    Wrench,
    Award,
    CalendarDays
} from 'lucide-react'

export default function CalendarioPage() {
    const [sessions, setSessions] = useState<SessionWithDetails[]>([])
    const [weeks, setWeeks] = useState<Week[]>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedSession, setSelectedSession] = useState<SessionWithDetails | null>(null)
    const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month')

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        const sb = getSupabase()

        const { data: sessionsData } = await sb
            .from('sessions')
            .select('*, mentor:mentors(*), week:weeks(*)')
            .order('session_date')
            .order('start_time')
        if (sessionsData) setSessions(sessionsData as unknown as SessionWithDetails[])

        const { data: weeksData } = await sb
            .from('weeks')
            .select('*')
            .order('week_number')
        if (weeksData) setWeeks(weeksData)
    }

    const sessionTypeConfig: Record<string, { label: string; icon: typeof Mic; color: string }> = {
        ponencia: { label: 'Ponencia', icon: Mic, color: '#FFC700' },
        taller: { label: 'Taller', icon: Wrench, color: '#34d399' },
        mentoria: { label: 'Mentoría', icon: Users, color: '#818cf8' },
        demo_day: { label: 'Demo Day', icon: Award, color: '#f472b6' },
    }

    // Calendar logic
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const today = new Date()

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = []
        // Pad start
        for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
        for (let d = 1; d <= daysInMonth; d++) days.push(d)
        return days
    }, [firstDayOfWeek, daysInMonth])

    function getSessionsForDay(day: number) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return sessions.filter(s => s.session_date === dateStr)
    }

    function prevMonth() {
        setCurrentMonth(new Date(year, month - 1, 1))
    }
    function nextMonth() {
        setCurrentMonth(new Date(year, month + 1, 1))
    }

    function formatDate(dateStr: string) {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
    }

    function formatTime(time: string | null) {
        if (!time) return ''
        return time.slice(0, 5)
    }

    const monthName = currentMonth.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).replace(' de ', ' ')

    // Agenda: group sessions by date
    const sessionsByDate = useMemo(() => {
        const grouped: Record<string, SessionWithDetails[]> = {}
        sessions.forEach(s => {
            if (!grouped[s.session_date]) grouped[s.session_date] = []
            grouped[s.session_date].push(s)
        })
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    }, [sessions])

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Calendario</h1>
                    <p className="text-white/40 text-sm mt-1">Sesiones y eventos del programa</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            viewMode === 'month' ? 'bg-yellow-600/20 text-yellow-600' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setViewMode('agenda')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            viewMode === 'agenda' ? 'bg-yellow-600/20 text-yellow-600' : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        Agenda
                    </button>
                </div>
            </div>

            {/* Week Legend */}
            <div className="flex flex-wrap gap-3">
                {weeks.map(w => (
                    <div key={w.id} className="flex items-center gap-2 text-xs text-white/40">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: w.color }} />
                        <span>Semana {w.week_number}: {w.title}</span>
                    </div>
                ))}
            </div>

            {viewMode === 'month' ? (
                /* ===== MONTH VIEW ===== */
                <div className="glass-card rounded-2xl p-6">
                    {/* Month navigator */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                            <ChevronLeft className="w-5 h-5 text-white/60" />
                        </button>
                        <h2 className="text-lg font-bold text-white capitalize">{monthName}</h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                            <ChevronRight className="w-5 h-5 text-white/60" />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <div key={d} className="text-center text-white/30 text-[10px] font-bold uppercase tracking-wider py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`empty-${i}`} className="h-24" />

                            const daySessions = getSessionsForDay(day)
                            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

                            return (
                                <div
                                    key={day}
                                    className={`h-24 calendar-day p-1.5 ${isToday ? 'today' : ''} ${daySessions.length > 0 ? 'has-session' : ''}`}
                                >
                                    <span className={`text-xs font-medium ${isToday ? 'text-yellow-600' : 'text-white/50'}`}>
                                        {day}
                                    </span>
                                    <div className="mt-1 space-y-0.5">
                                        {daySessions.slice(0, 2).map(s => {
                                            const week = s.week as unknown as Week | null
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setSelectedSession(s)}
                                                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80 cursor-pointer"
                                                    style={{
                                                        background: `${week?.color || '#FFC700'}20`,
                                                        color: week?.color || '#FFC700',
                                                    }}
                                                >
                                                    {s.title}
                                                </button>
                                            )
                                        })}
                                        {daySessions.length > 2 && (
                                            <p className="text-white/30 text-[10px] px-1.5">
                                                +{daySessions.length - 2} más
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                /* ===== AGENDA VIEW ===== */
                <div className="space-y-6">
                    {sessionsByDate.map(([date, dateSessions]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mb-3">
                                <CalendarDays className="w-4 h-4 text-yellow-600" />
                                <h3 className="text-sm font-bold text-white/60 capitalize">
                                    {formatDate(date)}
                                </h3>
                            </div>
                            <div className="space-y-2 ml-7">
                                {dateSessions.map(s => {
                                    const config = sessionTypeConfig[s.session_type] || sessionTypeConfig.ponencia
                                    const Icon = config.icon
                                    const mentor = s.mentor as unknown as Mentor | null

                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedSession(s)}
                                            className="w-full text-left glass-card rounded-xl p-4 hover-lift cursor-pointer"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: `${config.color}15` }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full inline-flex items-center justify-center leading-none"
                                                            style={{ background: `${config.color}15`, color: config.color }}
                                                        >
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-sm">{s.title}</h4>
                                                    <div className="flex items-center gap-4 mt-2 text-white/30 text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(s.start_time)} - {formatTime(s.end_time)}
                                                        </span>
                                                        {mentor && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                {mentor.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                    {sessionsByDate.length === 0 && (
                        <div className="glass-card rounded-xl p-12 text-center">
                            <CalendarDays className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 text-sm">No hay sesiones programadas aún</p>
                        </div>
                    )}
                </div>
            )}

            {/* Session Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)}>
                    <div
                        className="glass rounded-2xl p-8 max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <span
                                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full inline-flex items-center justify-center leading-none"
                                style={{
                                    background: `${sessionTypeConfig[selectedSession.session_type]?.color || '#FFC700'}15`,
                                    color: sessionTypeConfig[selectedSession.session_type]?.color || '#FFC700',
                                }}
                            >
                                {sessionTypeConfig[selectedSession.session_type]?.label || selectedSession.session_type}
                            </span>
                            <button onClick={() => setSelectedSession(null)} className="p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">{selectedSession.title}</h2>
                        {selectedSession.description && (
                            <p className="text-white/50 text-sm mb-4">{selectedSession.description}</p>
                        )}

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-white/40 text-sm">
                                <CalendarDays className="w-4 h-4" />
                                <span className="capitalize">{formatDate(selectedSession.session_date)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/40 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)}</span>
                            </div>
                        </div>

                        {/* Mentor info */}
                        {(() => {
                            const mentor = selectedSession.mentor as unknown as Mentor | null
                            if (!mentor) return null
                            return (
                                <div className="glass-card rounded-xl p-4 mb-4">
                                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mb-3">Mentor</p>
                                    <div className="flex items-center gap-3">
                                        {mentor.photo_url ? (
                                            <img src={mentor.photo_url} alt={mentor.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                                                <span className="text-yellow-600 font-bold">{mentor.name[0]}</span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-bold text-sm">{mentor.name}</p>
                                            {mentor.role && <p className="text-white/40 text-xs">{mentor.role}</p>}
                                            {mentor.company && <p className="text-white/30 text-xs">{mentor.company}</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            {selectedSession.meeting_url && (
                                <a
                                    href={selectedSession.meeting_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm"
                                >
                                    <Video className="w-4 h-4" />
                                    Unirse a la sesión
                                </a>
                            )}
                            {selectedSession.recording_url && (
                                <a
                                    href={selectedSession.recording_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-all text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver grabación
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
