import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : (null as unknown as SupabaseClient)

// ===== TYPES =====

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'participant' | 'admin'
  created_at: string
}

export interface Mentor {
  id: string
  name: string
  role: string | null
  company: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  calendly_url: string | null
  email: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Speaker {
  id: string
  name: string
  role: string | null
  company: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Week {
  id: string
  week_number: number
  title: string
  subtitle: string | null
  objective: string | null
  start_date: string | null
  end_date: string | null
  deliverable_title: string | null
  deliverable_description: string | null
  template_url: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  week_id: string
  mentor_id: string | null
  speaker_id: string | null
  title: string
  description: string | null
  session_date: string
  start_time: string | null
  end_time: string | null
  session_type: 'ponencia' | 'taller' | 'mentoria' | 'demo_day'
  meeting_url: string | null
  recording_url: string | null
  slides_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SessionWithDetails extends Session {
  mentor?: Mentor | null
  speaker?: Speaker | null
  week?: Week | null
}

export interface Submission {
  id: string
  user_id: string
  week_id: string
  link_url: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  notes: string | null
  group_name: string | null
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected'
  admin_feedback: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface SubmissionWithDetails extends Submission {
  week?: Week | null
  profile?: Profile | null
}

export interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  key: string
  value: string | null
  label: string | null
  category: string
  updated_at: string
}
