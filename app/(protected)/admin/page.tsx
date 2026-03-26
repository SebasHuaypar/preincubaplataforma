'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase } from '@/lib/supabase'
import {
    Users,
    FileUp,
    Calendar,
    BookOpen,
    TrendingUp,
    UserPlus,
    Megaphone,
    ArrowRight,
    Shield,
    Mic
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSubmissions: 0,
        approvedSubmissions: 0,
        pendingSubmissions: 0,
        totalSessions: 0,
        totalMentors: 0,
        totalSpeakers: 0,
        totalAnnouncements: 0,
    })

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/dashboard')
            return
        }
        fetchStats()
    }, [isAdmin, loading])

    async function fetchStats() {
        const sb = getSupabase()
        const [users, submissions, sessions, mentors, speakers, announcements] = await Promise.all([
            sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'participant'),
            sb.from('submissions').select('id, status', { count: 'exact' }),
            sb.from('sessions').select('id', { count: 'exact', head: true }),
            sb.from('mentors').select('id', { count: 'exact', head: true }).eq('is_active', true),
            sb.from('speakers').select('id', { count: 'exact', head: true }).eq('is_active', true),
            sb.from('announcements').select('id', { count: 'exact', head: true }),
        ])

        const subsData = submissions.data || []
        setStats({
            totalUsers: users.count || 0,
            totalSubmissions: subsData.length,
            approvedSubmissions: subsData.filter((s: { status: string }) => s.status === 'approved').length,
            pendingSubmissions: subsData.filter((s: { status: string }) => s.status === 'submitted').length,
            totalSessions: sessions.count || 0,
            totalMentors: mentors.count || 0,
            totalSpeakers: speakers.count || 0,
            totalAnnouncements: announcements.count || 0,
        })
    }

    if (!isAdmin) return null

    const statCards = [
        { label: 'Participantes', value: stats.totalUsers, icon: Users, color: '#FFC700' },
        { label: 'Entregas Recibidas', value: stats.totalSubmissions, icon: FileUp, color: '#34d399' },
        { label: 'Pendientes de Revisar', value: stats.pendingSubmissions, icon: TrendingUp, color: '#f472b6' },
        { label: 'Aprobadas', value: stats.approvedSubmissions, icon: TrendingUp, color: '#818cf8' },
        { label: 'Sesiones', value: stats.totalSessions, icon: Calendar, color: '#FFC700' },
        { label: 'Mentores Activos', value: stats.totalMentors, icon: BookOpen, color: '#34d399' },
        { label: 'Speakers Activos', value: stats.totalSpeakers, icon: Mic, color: '#6366f1' },
        { label: 'Anuncios', value: stats.totalAnnouncements, icon: Megaphone, color: '#f59e0b' },
    ]

    const quickActions = [
        { label: 'Crear Usuario', href: '/admin/usuarios', icon: UserPlus, description: 'Añadir un nuevo participante' },
        { label: 'Gestionar Mentores', href: '/admin/mentores', icon: Users, description: 'Agregar o editar mentores' },
        { label: 'Gestionar Speakers', href: '/admin/speakers', icon: Mic, description: 'Agregar o editar speakers' },
        { label: 'Gestionar Programa', href: '/admin/programa', icon: BookOpen, description: 'Semanas y sesiones' },
        { label: 'Revisar Entregas', href: '/admin/entregas', icon: FileUp, description: 'Ver y evaluar entregas' },
        { label: 'Gestionar Anuncios', href: '/admin/contenido', icon: Megaphone, description: 'Publicar notificaciones' },
    ]

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-yellow-600" />
                <div>
                    <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
                    <p className="text-white/40 text-sm">Gestiona todo el programa desde aquí</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="glass-card rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ background: `${card.color}15` }}
                            >
                                <card.icon className="w-4 h-4" style={{ color: card.color }} />
                            </div>
                            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="glass-card rounded-xl p-5 hover-lift flex items-center gap-4 group"
                        >
                            <div className="w-11 h-11 rounded-xl bg-yellow-600/10 flex items-center justify-center flex-shrink-0">
                                <action.icon className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-bold text-sm">{action.label}</p>
                                <p className="text-white/30 text-xs">{action.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-yellow-600 transition-colors" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
