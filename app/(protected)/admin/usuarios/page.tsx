'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getSupabase, Profile } from '@/lib/supabase'
import {
    UserPlus,
    Loader2,
    Users,
    ArrowLeft,
    Mail,
    Key,
    Copy,
    Check,
    Pencil,
    Shield
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Select from '@/components/Select'

export default function AdminUsuariosPage() {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<Profile[]>([])
    
    // Create/Edit Mode
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    
    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'admin' | 'participant'>('participant')
    const [saving, setSaving] = useState(false)
    
    // Success States
    const [createdCreds, setCreatedCreds] = useState<{ email: string; password?: string } | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!loading && !isAdmin) { router.push('/dashboard'); return }
        fetchUsers()
    }, [isAdmin, loading])

    async function fetchUsers() {
        const sb = getSupabase()
        const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false })
        if (data) setUsers(data)
    }

    function generatePassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
        let pwd = ''
        for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
        setPassword(pwd)
    }

    function startCreate() {
        setShowCreate(true)
        setIsEditing(null)
        setEmail('')
        setPassword('')
        setFullName('')
        setRole('participant')
        setCreatedCreds(null)
        generatePassword()
    }

    function startEdit(user: Profile) {
        setIsEditing(user.id)
        setShowCreate(false)
        setEmail(user.email)
        setPassword('') // Leaving empty means don't update
        setFullName(user.full_name || '')
        setRole(user.role || 'participant')
        setCreatedCreds(null)
    }

    function cancelForm() {
        setShowCreate(false)
        setIsEditing(null)
        setEmail('')
        setPassword('')
        setFullName('')
        setRole('participant')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        
        try {
            if (showCreate) {
                // Create New User
                const res = await fetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name: fullName }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Error al crear usuario')
                
                // If role is admin, we update it via the update-user route because create just sets participant
                if (role === 'admin') {
                   await fetch('/api/admin/update-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: data.user_id, role: 'admin' }),
                    })
                }
                
                setCreatedCreds({ email, password })
                cancelForm()
                fetchUsers()
            } else if (isEditing) {
                // Update Existing User
                const payload: any = { id: isEditing, email, full_name: fullName, role }
                if (password) payload.password = password
                
                const res = await fetch('/api/admin/update-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario')
                
                if (password) setCreatedCreds({ email, password })
                cancelForm()
                fetchUsers()
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido'
            alert(message)
        } finally {
            setSaving(false)
        }
    }

    async function copyCredentials() {
        if (!createdCreds) return
        const text = `Email: ${createdCreds.email}\nContraseña: ${createdCreds.password || '(no actualizada)'}`
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isAdmin) return null

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4 text-white/40" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gestionar Usuarios</h1>
                        <p className="text-white/40 text-sm">Crear y administrar cuentas</p>
                    </div>
                </div>
                <button
                    onClick={startCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm cursor-pointer"
                >
                    <UserPlus className="w-4 h-4" />
                    Crear Usuario
                </button>
            </div>

            {/* Success message */}
            {createdCreds && (
                <div className="glass-card rounded-xl p-5 mb-6 border-emerald-500/20 bg-emerald-500/5 animate-scale-in">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-emerald-400 text-sm font-bold">✓ Operación exitosa</p>
                        <button onClick={() => setCreatedCreds(null)} className="text-white/30 hover:text-white/60 text-xs cursor-pointer">Cerrar</button>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="text-white/60"><span className="text-white/30">Email:</span> {createdCreds.email}</p>
                        {createdCreds.password && (
                            <p className="text-white/60"><span className="text-white/30">Nueva Contraseña:</span> {createdCreds.password}</p>
                        )}
                    </div>
                    {createdCreds.password && (
                        <button
                            onClick={copyCredentials}
                            className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-white/40 text-xs hover:text-white/60 transition-colors cursor-pointer"
                        >
                            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copiado!' : 'Copiar credenciales'}
                        </button>
                    )}
                </div>
            )}

            {/* Form */}
            {(showCreate || isEditing) && (
                <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 mb-8 animate-scale-in">
                    <h3 className="text-white font-bold mb-6">{showCreate ? 'Nuevo Usuario' : 'Editar Usuario'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-white/40 text-xs font-medium mb-1 block">Nombre completo</label>
                            <input className="input-glass" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre del usuario" />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Email *</label>
                            <input className="input-glass" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" required />
                        </div>
                        <div>
                            <label className="text-white/40 text-xs font-medium mb-1 block">Rol *</label>
                            <Select
                                value={role}
                                onChange={v => setRole(v as 'admin' | 'participant')}
                                options={[
                                    { value: 'participant', label: 'Participante' },
                                    { value: 'admin', label: 'Administrador' },
                                ]}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-white/40 text-xs font-medium mb-1 block">
                                {isEditing ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                            </label>
                            <div className="flex gap-2">
                                <input className="input-glass flex-1" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required={showCreate} />
                                <button type="button" onClick={generatePassword} className="px-3 py-2 bg-white/5 rounded-xl text-white/40 hover:text-white/60 text-xs transition-colors cursor-pointer">
                                    <Key className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
                        <button type="button" onClick={cancelForm} className="px-4 py-2 text-white/40 text-sm cursor-pointer">Cancelar</button>
                        <button type="submit" disabled={saving || !email || (showCreate && !password)} className="flex items-center gap-2 px-5 py-2 bg-yellow-600 text-navy-900 font-bold rounded-xl hover:bg-yellow-500 text-sm disabled:opacity-50 cursor-pointer">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : showCreate ? <UserPlus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                            {showCreate ? 'Crear' : 'Actualizar'}
                        </button>
                    </div>
                </form>
            )}

            {/* Users list */}
            <div className="space-y-2">
                {users.map(user => (
                    <div key={user.id} className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-colors ${isEditing === user.id ? 'border-yellow-600/30 bg-yellow-600/5' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            user.role === 'admin' ? 'bg-indigo-500/10' : 'bg-yellow-600/10'
                        }`}>
                            <span className={user.role === 'admin' ? 'text-indigo-400 font-bold' : 'text-yellow-600 font-bold'}>
                                {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate flex items-center gap-2">
                                {user.full_name || 'Sin nombre'}
                            </p>
                            <p className="text-white/30 text-xs flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {user.email}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center justify-center gap-1 leading-none ${
                                user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-white/30 border border-white/10'
                            }`}>
                                {user.role === 'admin' && <Shield className="w-3 h-3 inline" />}
                                {user.role === 'admin' ? 'Admin' : 'Participante'}
                            </span>
                            <button
                                onClick={() => startEdit(user)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar usuario"
                            >
                                <Pencil className="w-4 h-4 text-white/30 hover:text-yellow-500" />
                            </button>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="glass-card rounded-xl p-12 text-center">
                        <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 text-sm">No hay usuarios registrados</p>
                    </div>
                )}
            </div>
        </div>
    )
}
