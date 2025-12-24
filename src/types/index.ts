export interface User {
  id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  points_balance: number;
  current_streak: number;
  longest_streak: number;
  last_check_in: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  category: string;
  created_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  icon: string;
  available: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  points_earned: number;
  created_at: string;
}

export interface ReferralStats {
  count: number;
  pointsEarned: number;
}

export type TabType = 'earn' | 'redeem';
export type PageType = 'home' | 'discover' | 'library' | 'tech-stack' | 'subscriptions' | 'rewards' | 'settings';