'use client'

import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning'
    loading?: boolean
}

export default function ConfirmModal({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    loading = false,
}: ConfirmModalProps) {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    const isDanger = variant === 'danger'

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.3s ease-out forwards' }} onClick={onCancel}>
            <div className="glass rounded-2xl p-0 max-w-sm w-full animate-scale-in overflow-hidden border border-white/[0.08] shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Accent bar */}
                <div className={`h-0.5 ${isDanger ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-yellow-600 to-yellow-500'}`} />

                <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isDanger ? 'bg-red-500/15' : 'bg-yellow-600/15'
                        }`}>
                            <AlertTriangle className={`w-5 h-5 ${isDanger ? 'text-red-400' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{title}</h3>
                            <p className="text-white/45 text-sm mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-white/5 text-white/60 font-medium rounded-xl hover:bg-white/10 transition-all text-sm cursor-pointer disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50 ${
                                isDanger
                                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/20'
                                    : 'bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30 border border-yellow-600/20'
                            }`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
