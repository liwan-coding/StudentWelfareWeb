/** Campaign / Program (same shape from API) */
export interface CampaignOrProgram {
  id: number
  /** Public, random 5-letter identifier used in shareable URLs (/c/:slug, /p/:slug) */
  slug?: string
  title?: string
  title_ar?: string
  title_en?: string
  description?: string
  description_ar?: string
  description_en?: string
  image_url?: string
  image?: string
  photo?: string
  photo_url?: string
  banner?: string
  banner_url?: string
  goal_amount?: number
  raised_amount?: number
  created_at?: string
  end_date?: string
  status?: string
  is_active?: boolean
  is_urgent?: boolean
  is_featured?: boolean
  category?: { id?: number; name?: string; name_ar?: string; name_en?: string }
  donor_count?: number
  donors_count?: number
  impact_description?: string
  impact_description_ar?: string
  impact_description_en?: string
}

export interface Category {
  id: number
  name?: string
  name_ar?: string
  name_en?: string
  description?: string
  status?: string
}

export type ClientSource = 'web' | 'app'

export interface RecentDonation {
  id?: number
  donation_id?: number
  amount?: number
  donor_name?: string
  donor_email?: string
  donor_phone?: string
  campaign_id?: number
  program_id?: number
  campaign?: CampaignOrProgram | Record<string, unknown>
  program?: CampaignOrProgram | Record<string, unknown>
  item?: CampaignOrProgram | Record<string, unknown>
  campaign_title?: string
  campaign_name?: string
  program_title?: string
  program_name?: string
  created_at?: string
  paid_at?: string
  updated_at?: string
  source?: ClientSource
  status?: string
  payment_status?: string
  donation_status?: string
  is_anonymous?: boolean | number
  note?: string
  message?: string
  [key: string]: unknown
}

export interface FundPartner {
  id: number
  name_ar?: string
  name_en?: string
  description_ar?: string
  description_en?: string
  logo?: string
  logo_url?: string
  link?: string
  status?: string
  order?: number
  is_featured?: boolean
}

export interface FundNews {
  id: number
  title_ar?: string
  title_en?: string
  content_ar?: string
  content_en?: string
  image?: string
  image_url?: string
  status?: string
  order?: number
  is_featured?: boolean
  published_at?: string
}

export interface Banner {
  id: number
  title?: string
  title_ar?: string
  title_en?: string
  description_ar?: string
  description_en?: string
  image?: string
  image_url?: string
  mobile_image_url?: string
  link?: string
  action_url?: string
  action_label?: string
  status?: string
  order?: number
  is_featured?: boolean
  is_active?: boolean
  priority?: number
  start_date?: string
  end_date?: string
  is_currently_active?: boolean
  starts_at?: string
  ends_at?: string
  placements?: string[]
  created_at?: string
  updated_at?: string
}

/** بطاقة تسجيل الطالب للصندوق (الهيرو) — من GET /api/v1/student-registration-card */
export interface StudentRegistrationCard {
  id: number
  headline_ar?: string
  headline_en?: string
  subtitle_ar?: string
  subtitle_en?: string
  background?: string
  background_image?: string
  background_image_url?: string
  status?: string
  updated_at?: string
  created_at?: string
}

export interface UserProfile {
  id?: number
  name?: string
  phone?: string
  email?: string
  [key: string]: unknown
}

/** API often wraps in { data: T } or returns array */
export type ApiList<T> = T[] | { data: T[] }
export type ApiOne<T> = T | { data: T }
