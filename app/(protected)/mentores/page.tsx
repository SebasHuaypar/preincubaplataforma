'use client'

import { useEffect, useState } from 'react'
import { getSupabase, Mentor } from '@/lib/supabase'
import { ExternalLink, Mail, Briefcase } from 'lucide-react'

export default function MentoresPage() {
    const [mentors, setMentors] = useState<Mentor[]>([])

    useEffect(() => {
        async function fetchMentors() {
            const sb = getSupabase()
            const { data } = await sb
                .from('mentors')
                .select('*')
                .eq('is_active', true)
                .order('sort_order')
            if (data) setMentors(data)
        }
        fetchMentors()
    }, [])

    return (
        <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Mentores</h1>
                <p className="text-white/40 text-sm mt-1">Los expertos que te acompañarán en tu camino emprendedor</p>
            </div>

            {mentors.length === 0 ? (
                <div className="glass-card rounded-xl p-16 text-center">
                    <Briefcase className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">Los mentores serán publicados pronto</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor) => (
                        <div key={mentor.id} className="glass-card rounded-2xl overflow-hidden hover-lift group">
                            {/* Photo */}
                            <div className="relative h-48 bg-gradient-to-br from-navy-800 to-navy-900">
                                {mentor.photo_url ? (
                                    <img
                                        src={mentor.photo_url}
                                        alt={mentor.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-5xl font-black text-yellow-600/30">
                                            {mentor.name[0]}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
                            </div>

                            {/* Info */}
                            <div className="p-5 -mt-8 relative">
                                <h3 className="text-lg font-bold text-white mb-1">{mentor.name}</h3>
                                {mentor.role && (
                                    <p className="text-yellow-600 text-xs font-medium mb-1">{mentor.role}</p>
                                )}
                                {mentor.company && (
                                    <p className="text-white/30 text-xs flex items-center gap-1 mb-3">
                                        <Briefcase className="w-3 h-3" />
                                        {mentor.company}
                                    </p>
                                )}
                                {mentor.bio && (
                                    <p className="text-white/40 text-xs leading-relaxed line-clamp-3 mb-4">
                                        {mentor.bio}
                                    </p>
                                )}

                                {/* Links */}
                                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                                    {mentor.linkedin_url && (
                                        <a
                                            href={mentor.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg hover:bg-white/5 transition-colors group/link"
                                        >
                                            <ExternalLink className="w-4 h-4 text-white/30 group-hover/link:text-[#0077B5] transition-colors" />
                                        </a>
                                    )}
                                    {mentor.email && (
                                        <a
                                            href={`mailto:${mentor.email}`}
                                            className="p-2 rounded-lg hover:bg-white/5 transition-colors group/link"
                                        >
                                            <Mail className="w-4 h-4 text-white/30 group-hover/link:text-yellow-600 transition-colors" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
