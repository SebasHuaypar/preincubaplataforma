'use client'

import { useEffect, useState } from 'react'
import { getSupabase, Speaker } from '@/lib/supabase'
import { ExternalLink, Mic } from 'lucide-react'

export default function SpeakersPage() {
    const [speakers, setSpeakers] = useState<Speaker[]>([])

    useEffect(() => {
        async function fetchSpeakers() {
            const sb = getSupabase()
            const { data } = await sb
                .from('speakers')
                .select('*')
                .eq('is_active', true)
                .order('sort_order')
            if (data) setSpeakers(data)
        }
        fetchSpeakers()
    }, [])

    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Speakers</h1>
                <p className="text-white/40 text-sm mt-1">Expertos invitados que compartirán su experiencia en el programa</p>
            </div>

            {speakers.length === 0 ? (
                <div className="glass-card rounded-xl p-16 text-center">
                    <Mic className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">Los speakers serán publicados pronto</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {speakers.map((speaker) => (
                        <div key={speaker.id} className="glass-card rounded-2xl overflow-hidden hover-lift group">
                            {/* Photo */}
                            <div className="relative h-48 bg-gradient-to-br from-navy-800 to-navy-900">
                                {speaker.photo_url ? (
                                    <img
                                        src={speaker.photo_url}
                                        alt={speaker.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-5xl font-black text-indigo-400/30">
                                            {speaker.name[0]}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
                                {/* Speaker badge */}
                                <div className="absolute top-3 right-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                                        Speaker
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 -mt-8 relative">
                                <h3 className="text-lg font-bold text-white mb-1">{speaker.name}</h3>
                                {speaker.role && (
                                    <p className="text-indigo-400 text-xs font-medium mb-1">{speaker.role}</p>
                                )}
                                {speaker.company && (
                                    <p className="text-white/30 text-xs flex items-center gap-1 mb-3">
                                        {speaker.company}
                                    </p>
                                )}
                                {speaker.bio && (
                                    <p className="text-white/40 text-xs leading-relaxed line-clamp-3 mb-4">
                                        {speaker.bio}
                                    </p>
                                )}

                                {/* Links */}
                                {speaker.linkedin_url && (
                                    <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                                        <a
                                            href={speaker.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-[#0077B5] text-xs"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            LinkedIn
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
