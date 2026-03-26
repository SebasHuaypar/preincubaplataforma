'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
    group?: string
}

interface SelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
}

export default function Select({ value, onChange, options, placeholder = 'Seleccionar...', className = '' }: SelectProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Group options
    const groups = options.reduce<Record<string, SelectOption[]>>((acc, opt) => {
        const g = opt.group ?? '__default__'
        if (!acc[g]) acc[g] = []
        acc[g].push(opt)
        return acc
    }, {})

    const selectedLabel = options.find(o => o.value === value)?.label

    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [open])

    return (
        <div ref={ref} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="input-glass w-full flex items-center justify-between gap-2 text-left cursor-pointer"
            >
                <span className={selectedLabel ? 'text-white' : 'text-white/30'}>
                    {selectedLabel ?? placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-[200] rounded-xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden animate-scale-in origin-top"
                    style={{ background: '#0e1c3a' }}
                >
                    <div className="max-h-56 overflow-y-auto p-1">
                        {Object.entries(groups).map(([group, groupOptions]) => (
                            <div key={group}>
                                {group !== '__default__' && (
                                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
                                        {group}
                                    </p>
                                )}
                                {groupOptions.map(opt => {
                                    const isSelected = opt.value === value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => { onChange(opt.value); setOpen(false) }}
                                            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                                                isSelected
                                                    ? 'bg-yellow-600/15 text-yellow-500 font-medium'
                                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {opt.label}
                                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
