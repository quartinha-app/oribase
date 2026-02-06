export type UserRole = 'admin' | 'lider_terreiro' | 'pesquisador' | 'medium' | 'consulente' | 'fornecedor';

export interface Profile {
  id: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  job_role?: string;
  bio?: string;
  show_on_landing?: boolean;
  created_at: string;
}

export type TerreiroStatus = 'pending' | 'verified' | 'rejected';

export interface TerreiroType {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at?: string;
}

export interface Terreiro {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  contact_whatsapp?: string;
  contact_email?: string;
  verification_status: TerreiroStatus;
  verification_docs_url?: string[];
  is_visible: boolean;
  created_at: string;
  image?: string;
  type_id?: string;
  slug?: string;
  gallery_urls?: string[];
  type?: TerreiroType;
}

export interface Message {
  id: string;
  terreiro_id: string;
  sender_name: string;
  sender_contact: string;
  content: string;
  read_at?: string;
  created_at: string;
}

export interface CampaignTheme {
  primary_color: string;
  secondary_color: string;
  background_image?: string;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  image_url?: string;
  theme?: CampaignTheme;
  consent_text?: string;
  form_schema?: SurveySchema;
  goal_amount?: number;
  current_amount: number;
  status: 'draft' | 'active' | 'ended';
  start_date?: string;
  end_date?: string;
  sponsors?: { name: string; logo_url?: string; url?: string }[];
  created_at: string;
}

// Survey Engine Types
export interface SurveySchema {
  sections: SurveySection[];
}

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  target_roles?: string[];
  questions: SurveyQuestion[];
}

export type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'scale' | 'info';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  label: string;
  help_text?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { label: string; value: string }[];
  depends_on?: { question_id: string; value: string };
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url?: string;
  active: boolean;
  published_at: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  url?: string;
  type: string;
  active: boolean;
  description?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  order_index: number;
  created_at?: string;
}

export interface SiteContent {
  id: string;
  section: string;
  key: string;
  content?: string;
  image_url?: string;
}

export interface CampaignReward {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'draw';
  image_url?: string;
  file_url?: string;
  partner_id?: string;
  active: boolean;
  items?: string[]; // List of items in the prize
  partner?: Partner;
  draw_position?: string;
  draw_at?: string;
  campaign_id?: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  campaign_id: string;
  profile_id?: string;
  fingerprint_id?: string;
  redeemed_at: string;
  redemption_code?: string;
  lucky_number?: number;
  is_winner?: boolean;
  winner_notified?: boolean;
  contact_whatsapp?: string;
  contact_email?: string;
  metadata?: any;
}

export interface Professional {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  banner_url: string | null;
  city: string;
  state: string;
  neighborhood: string | null;
  whatsapp: string;
  email: string;
  instagram: string | null;
  site_url: string | null;
  subscription_status: 'pending' | 'active' | 'expired' | 'suspended';
  subscription_expires_at: string | null;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  category?: ServiceCategory;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  active: boolean;
  created_at?: string;
}
export interface ProfessionalService {
  id: string;
  professional_id: string;
  title: string;
  description?: string;
  price?: number;
  duration?: string;
  created_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  active: boolean;
}

export interface ProfessionalPayment {
  id: string;
  professional_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  created_at: string;
  plan?: SubscriptionPlan;
}

export interface Review {
  id: string;
  professional_id: string;
  user_id?: string;
  fingerprint_id?: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface AdminDashboardStats {
  terreiros: {
    total: number;
    pending: number;
    verified: number;
  };
  users: {
    total: number;
    byRole: Record<UserRole, number>;
  };
  professionals: {
    total: number;
    active: number;
    pending: number;
  };
  diagnostic: {
    totalResponses: number;
    activeCampaigns: number;
  };
}
