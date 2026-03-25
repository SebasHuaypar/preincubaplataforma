'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getSupabase, Announcement } from '@/lib/supabase'
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileUp,
    Settings,
    LogOut,
    Loader2,
    Shield,
    BookOpen,
    Bell,
    ChevronRight,
    UserCircle,
    Megaphone,
    X,
    AlertTriangle,
    Info,
    Menu
} from 'lucide-react'

const participantLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/calendario', label: 'Calendario', icon: Calendar },
    { href: '/mentores', label: 'Mentores', icon: Users },
    { href: '/entregables', label: 'Mis Entregables', icon: FileUp },
]

const adminLinks = [
    { href: '/admin', label: 'Panel Admin', icon: Shield },
    { href: '/admin/mentores', label: 'Gestionar Mentores', icon: Users },
    { href: '/admin/programa', label: 'Gestionar Programa', icon: BookOpen },
    { href: '/admin/usuarios', label: 'Gestionar Usuarios', icon: UserCircle },
    { href: '/admin/entregas', label: 'Revisar Entregas', icon: FileUp },
    { href: '/admin/contenido', label: 'Anuncios', icon: Megaphone },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, profile, loading, signOut, isAdmin } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    // Notifications state
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [showNotifPanel, setShowNotifPanel] = useState(false)
    const [urgentModal, setUrgentModal] = useState<Announcement | null>(null)
    const [dismissedUrgent, setDismissedUrgent] = useState<Set<string>>(new Set())
    const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set())
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    // Fetch announcements
    useEffect(() => {
        if (!user) return
        fetchAnnouncements()
        // Poll every 60s for new announcements
        const interval = setInterval(fetchAnnouncements, 60000)
        return () => clearInterval(interval)
    }, [user])

    // Load dismissed urgent IDs from sessionStorage
    useEffect(() => {
        const dismissed = sessionStorage.getItem('dismissed_urgent')
        if (dismissed) setDismissedUrgent(new Set(JSON.parse(dismissed)))
        const read = sessionStorage.getItem('read_notifs')
        if (read) setReadNotifs(new Set(JSON.parse(read)))
    }, [])

    // Show urgent modal automatically
    useEffect(() => {
        const urgentAnnouncement = announcements.find(
            a => a.priority === 'urgent' && !dismissedUrgent.has(a.id)
        )
        if (urgentAnnouncement) {
            setUrgentModal(urgentAnnouncement)
        }
    }, [announcements, dismissedUrgent])

    // Close panel when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifPanel(false)
            }
        }
        if (showNotifPanel) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showNotifPanel])

    async function fetchAnnouncements() {
        const sb = getSupabase()
        const { data } = await sb
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(20)
        if (data) setAnnouncements(data)
    }

    function dismissUrgentModal() {
        if (urgentModal) {
            const newDismissed = new Set(dismissedUrgent)
            newDismissed.add(urgentModal.id)
            setDismissedUrgent(newDismissed)
            sessionStorage.setItem('dismissed_urgent', JSON.stringify([...newDismissed]))
        }
        setUrgentModal(null)
    }

    function markAsRead(id: string) {
        const updated = new Set(readNotifs)
        updated.add(id)
        setReadNotifs(updated)
        sessionStorage.setItem('read_notifs', JSON.stringify([...updated]))
    }

    function markAllRead() {
        const allIds = new Set(announcements.map(a => a.id))
        setReadNotifs(allIds)
        sessionStorage.setItem('read_notifs', JSON.stringify([...allIds]))
    }

    const unreadCount = announcements.filter(a => !readNotifs.has(a.id)).length

    const priorityConfig: Record<string, { icon: typeof Info; color: string; bg: string; label: string }> = {
        low: { icon: Info, color: 'text-white/40', bg: 'bg-white/5', label: 'Info' },
        normal: { icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Actualización' },
        high: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-600/10', label: 'Importante' },
        urgent: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Urgente' },
    }

    function formatTimeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Ahora'
        if (mins < 60) return `Hace ${mins}m`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `Hace ${hours}h`
        const days = Math.floor(hours / 24)
        return `Hace ${days}d`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
            </div>
        )
    }

    if (!user) return null

    const isAdminRoute = pathname.startsWith('/admin')

    return (
        <div className="min-h-screen flex bg-navy-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-navy-900 z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col fixed h-full border-r border-white/5`}>
                {/* Logo */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between">
                    <div>
                        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
                            <Image
                                src="/images/chapters/START Lima White.svg"
                                alt="START Lima"
                                width={100}
                                height={35}
                                className="h-7 w-auto"
                            />
                        </Link>
                        <p className="text-white/25 text-[10px] font-medium mt-2 tracking-widest uppercase">
                            Pre-incubación
                        </p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1.5 -mr-2 hover:bg-white/10 rounded-lg text-white/50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* Participant Links */}
                    <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase px-3 mb-2">
                        Programa
                    </p>
                    {participantLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            <link.icon className="w-4 h-4" />
                            {link.label}
                        </Link>
                    ))}

                    {/* Admin Links */}
                    {isAdmin && (
                        <>
                            <div className="my-4 border-t border-white/[0.06]" />
                            <p className="text-white/25 text-[10px] font-bold tracking-widest uppercase px-3 mb-2">
                                Administración
                            </p>
                            {adminLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                                >
                                    <link.icon className="w-4 h-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </>
                    )}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-3 px-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center">
                            <span className="text-yellow-600 text-xs font-bold">
                                {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs font-medium truncate">
                                {profile?.full_name || profile?.email}
                            </p>
                            <p className="text-white/30 text-[10px]">
                                {isAdmin ? 'Administrador' : 'Participante'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="sidebar-link w-full text-red-400/60 hover:text-red-400 hover:bg-red-400/5 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 w-full min-w-0 flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-navy-900/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg text-white/70">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-white/40 text-sm">
                            <Link href="/dashboard" className="hover:text-white/60 transition-colors">
                                Inicio
                            </Link>
                            {pathname !== '/dashboard' && (
                                <>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-white/70 font-medium">
                                        {isAdminRoute ? 'Admin' : participantLinks.find(l => l.href === pathname)?.label || 'Página'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notification Bell */}
                    <div className="relative" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifPanel(!showNotifPanel)}
                            className="relative p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        >
                            <Bell className={`w-4 h-4 transition-colors ${showNotifPanel ? 'text-yellow-600' : 'text-white/30 hover:text-white/60'}`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-scale-in">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifPanel && (
                            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-navy-950/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/60 animate-scale-in overflow-hidden z-50 origin-top-right">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-yellow-600" />
                                        <h3 className="text-white font-bold text-sm">Notificaciones</h3>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-yellow-600/60 text-xs font-medium hover:text-yellow-600 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-yellow-600/10"
                                        >
                                            Marcar todas como leídas
                                        </button>
                                    )}
                                </div>

                                {/* List */}
                                <div className="max-h-80 overflow-y-auto">
                                    {announcements.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                            <p className="text-white/30 text-xs">Sin notificaciones</p>
                                        </div>
                                    ) : (
                                        announcements.map(a => {
                                            const config = priorityConfig[a.priority] || priorityConfig.normal
                                            const Icon = config.icon
                                            const isUnread = !readNotifs.has(a.id)

                                            return (
                                                <div
                                                    key={a.id}
                                                    onClick={() => isUnread && markAsRead(a.id)}
                                                    className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                                                        isUnread ? 'bg-white/[0.02]' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-sm font-medium leading-tight ${isUnread ? 'text-white' : 'text-white/60'}`}>
                                                                    {a.title}
                                                                </p>
                                                                {isUnread && (
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-600 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-white/40 text-[13px] mt-1 line-clamp-2 leading-snug">{a.content}</p>
                                                            <p className="text-white/20 text-[10px] mt-1">{formatTimeAgo(a.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
                    {children}
                </div>
            </main>

            {/* ===== URGENT MODAL ===== */}
            {urgentModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-up">
                    <div className="glass rounded-2xl p-0 max-w-md w-full animate-scale-in overflow-hidden border border-red-500/20 shadow-2xl shadow-red-500/10">
                        {/* Red accent bar */}
                        <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-500" />

                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">Aviso Urgente</p>
                                    <h2 className="text-white font-bold text-lg">{urgentModal.title}</h2>
                                </div>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed mb-6">
                                {urgentModal.content}
                            </p>

                            <button
                                onClick={dismissUrgentModal}
                                className="w-full px-4 py-3 bg-red-500/20 text-red-300 font-bold rounded-xl hover:bg-red-500/30 transition-all text-sm cursor-pointer border border-red-500/20"
                            >
                                Entendido
                            </button>

                            <p className="text-white/15 text-[10px] text-center mt-3">
                                {new Date(urgentModal.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
