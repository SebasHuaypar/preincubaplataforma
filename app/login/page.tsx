'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const { signIn, user } = useAuth()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    if (user) {
        router.push('/dashboard')
        return null
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await signIn(email, password)

        if (error) {
            setError('Credenciales incorrectas. Verifica tu email y contraseña.')
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-navy-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-yellow-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-sm relative animate-fade-in-up">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Image
                        src="/images/chapters/START Lima White.svg"
                        alt="START Lima"
                        width={140}
                        height={48}
                        className="h-10 w-auto mx-auto drop-shadow-lg"
                    />
                    <p className="text-white/30 text-xs font-medium mt-4 tracking-widest uppercase">
                        Plataforma Pre-incubación
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-glass"
                            placeholder="Email"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-glass"
                            placeholder="Contraseña"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-yellow-500/80 text-xs font-medium animate-fade-in-up">
                            {error}
                        </p>
                    )}

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-navy-900 font-bold rounded-full transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg hover:shadow-yellow-600/20 disabled:opacity-50 disabled:hover:shadow-none cursor-pointer"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                Ingresar
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-white/20 text-xs mt-8">
                    © 2026 START Lima · Pre-incubación
                </p>
            </div>
        </div>
    )
}
