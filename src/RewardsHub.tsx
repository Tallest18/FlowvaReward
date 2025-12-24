import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Gift, Zap, Award, Star, CheckCircle2, Lock, Sparkles, Trophy, Crown, Target, Copy, Share2, Users, Home, Compass, BookOpen, Layers, CreditCard, Settings, Bell } from 'lucide-react';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseUrl.startsWith('http');
};

const supabase = isSupabaseConfigured() ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Types
interface User {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  points_balance: number;
  current_streak: number;
  longest_streak: number;
  last_check_in: string | null;
  created_at: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  category: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  icon: string;
  available: boolean;
}

interface CheckIn {
  id: string;
  user_id: string;
  check_in_date: string;
  points_earned: number;
}

export default function RewardsHub() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earn' | 'redeem'>('earn');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [signupMode, setSignupMode] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState({ count: 0, pointsEarned: 0 });
  const [copied, setCopied] = useState(false);
  const [activePage, setActivePage] = useState('rewards');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkUser = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || ''
        });
      }
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user || !supabase) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          await createUserProfile();
        } else {
          throw profileError;
        }
      } else {
        setProfile(profileData);
      }

      await loadReferralCode();
      await loadReferralStats();

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('points', { ascending: false });

      if (!activitiesError && activitiesData) {
        setActivities(activitiesData);
      }

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .order('points_required', { ascending: true });

      if (!rewardsError && rewardsData) {
        setRewards(rewardsData);
      }

      await loadRecentCheckIns();
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    }
  };

  const loadReferralCode = async () => {
    if (!user) return;
    try {
      const code = user.id.substring(0, 8);
      setReferralCode(code);
    } catch (err) {
      console.error('Error loading referral code:', err);
    }
  };

  const loadReferralStats = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      if (!error && data) {
        const completed = data.filter(r => r.status === 'completed');
        const totalPoints = completed.reduce((sum, r) => sum + r.points_earned, 0);
        setReferralStats({
          count: completed.length,
          pointsEarned: totalPoints
        });
      }
    } catch (err) {
      console.error('Error loading referral stats:', err);
    }
  };

  const createUserProfile = async () => {
    if (!user || !supabase) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        points_balance: 0,
        current_streak: 0,
        longest_streak: 0,
        last_check_in: null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
    } else {
      setProfile(data);
    }
  };

  const loadRecentCheckIns = async () => {
    if (!user || !supabase) return;

    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .limit(7);

    if (!error && data) {
      setRecentCheckIns(data);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    if (!supabase) return;
    
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    if (!supabase) return;
    
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActivities([]);
    setRewards([]);
  };

  const copyReferralLink = async () => {
    const link = `https://app.flowvahub.com/signup?ref=${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform: string, type: string = 'tool_stack') => {
    if (!user || !profile || !supabase) return;

    try {
      const link = `https://app.flowvahub.com/signup?ref=${referralCode}`;
      let shareUrl = '';

      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=Check%20out%20Flowva!`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent('Check out Flowva! ' + link)}`;
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');

        const pointsForShare = 25;
        
        const { error: shareError } = await supabase
          .from('shares')
          .insert({
            user_id: user.id,
            share_type: type,
            platform: platform,
            points_earned: pointsForShare
          });

        if (!shareError) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              points_balance: profile.points_balance + pointsForShare
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (!updateError && updatedProfile) {
            setProfile(updatedProfile);
          }
        }
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !profile || checkingIn || !supabase) return;

    setCheckingIn(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastCheckIn = profile.last_check_in;

      if (lastCheckIn === today) {
        setError('You have already checked in today!');
        setCheckingIn(false);
        return;
      }

      let newStreak = 1;
      if (lastCheckIn) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastCheckIn === yesterdayStr) {
          newStreak = profile.current_streak + 1;
        }
      }

      const pointsToAdd = 5;

      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          check_in_date: today,
          points_earned: pointsToAdd
        });

      if (checkInError) throw checkInError;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points_balance: profile.points_balance + pointsToAdd,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, profile.longest_streak),
          last_check_in: today
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(updatedProfile);
      await loadRecentCheckIns();
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCompleteActivity = async (activity: Activity) => {
    if (!user || !profile || !supabase) return;

    try {
      setError(null);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points_balance: profile.points_balance + activity.points
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabase.from('activity_completions').insert({
        user_id: user.id,
        activity_id: activity.id,
        points_earned: activity.points
      });

      setProfile(updatedProfile);
    } catch (err) {
      console.error('Activity completion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete activity');
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!user || !profile || !supabase) return;

    if (profile.points_balance < reward.points_required) {
      setError(`You need ${reward.points_required - profile.points_balance} more points to redeem this reward`);
      return;
    }

    try {
      setError(null);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points_balance: profile.points_balance - reward.points_required
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabase.from('redemptions').insert({
        user_id: user.id,
        reward_id: reward.id,
        points_spent: reward.points_required
      });

      setProfile(updatedProfile);
      alert(`Successfully redeemed: ${reward.name}!`);
    } catch (err) {
      console.error('Redemption error:', err);
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
    }
  };

  const getDaysOfWeek = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const mondayIndex = today === 0 ? 6 : today - 1;
    
    return days.map((day, index) => {
      const daysAgo = (mondayIndex - index + 7) % 7;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];
      const hasCheckIn = recentCheckIns.some(c => c.check_in_date === dateStr);
      const isToday = daysAgo === 0;
      
      return { day, hasCheckIn, isToday, date: dateStr };
    });
  };

  const AuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      if (signupMode) {
        await handleSignUp(email, password);
      } else {
        await handleSignIn(email, password);
      }
      setSubmitting(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Flowva Rewards</h1>
            <p className="text-gray-600">Earn points, unlock rewards, celebrate progress!</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Please wait...' : signupMode ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setSignupMode(!signupMode);
                setError(null);
              }}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              {signupMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Not Configured</h1>
            <p className="text-gray-600">Please set up your Supabase credentials to use this app.</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">Quick Setup:</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-medium">supabase.com</a></span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Run the <code className="bg-gray-200 px-2 py-1 rounded text-xs">supabase-schema.sql</code> file</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Create <code className="bg-gray-200 px-2 py-1 rounded text-xs">.env</code> file with your credentials</span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Add to .env:</h3>
            <pre className="bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key`}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const nextRewardPoints = 5000;
  const progressPercent = profile ? Math.min((profile.points_balance / nextRewardPoints) * 100, 100) : 0;
  const canCheckInToday = profile?.last_check_in !== new Date().toISOString().split('T')[0];
  const daysOfWeek = getDaysOfWeek();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-52 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Flowva
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3">
          <button onClick={() => setActivePage('home')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'home' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button onClick={() => setActivePage('discover')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'discover' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Compass className="w-5 h-5" />
            <span className="font-medium">Discover</span>
          </button>
          <button onClick={() => setActivePage('library')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'library' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Library</span>
          </button>
          <button onClick={() => setActivePage('tech-stack')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'tech-stack' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Layers className="w-5 h-5" />
            <span className="font-medium">Tech Stack</span>
          </button>
          <button onClick={() => setActivePage('subscriptions')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'subscriptions' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Subscriptions</span>
          </button>
          <button onClick={() => setActivePage('rewards')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'rewards' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Gift className="w-5 h-5" />
            <span className="font-medium">Rewards Hub</span>
          </button>
          <button onClick={() => setActivePage('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${activePage === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Blessing</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end">
          <button className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Rewards Hub</h1>
              <p className="text-gray-600">Earn points, unlock rewards, and celebrate your progress!</p>
            </div>

            <div className="flex space-x-1 mb-8 border-b border-gray-200">
              <button onClick={() => setActiveTab('earn')} className={`px-6 py-3 font-medium transition-all border-b-2 ${activeTab === 'earn' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Earn Points
              </button>
              <button onClick={() => setActiveTab('redeem')} className={`px-6 py-3 font-medium transition-all border-b-2 ${activeTab === 'redeem' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                Redeem Rewards
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center space-x-2">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
              </div>
            )}

            {activeTab === 'earn' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="border-l-4 border-purple-600 pl-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Rewards Journey</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-600">Points Balance</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-4xl font-bold text-gray-900">{profile?.points_balance || 0}</p>
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress to $5 Gift Card</span>
                          <span className="text-gray-900 font-medium">{profile?.points_balance || 0}/{nextRewardPoints}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">💡 Just getting started — keep earning points!</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">Daily Streak</span>
                      </div>
                      <p className="text-4xl font-bold text-purple-600 mb-4">
                        {profile?.current_streak || 0} day{profile?.current_streak !== 1 ? 's' : ''}
                      </p>

                      <div className="flex justify-between mb-4">
                        {daysOfWeek.map((dayInfo, idx) => (
                          <div key={idx} className="flex flex-col items-center space-y-1">
                            <span className="text-xs font-medium text-gray-500">{dayInfo.day}</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${dayInfo.hasCheckIn ? 'bg-purple-600 text-white' : dayInfo.isToday ? 'border-2 border-purple-300 bg-white' : 'bg-gray-100'}`}>
                              {dayInfo.hasCheckIn && <CheckCircle2 className="w-4 h-4" />}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-600 mb-3">Check in daily to earn +5 points</p>

                      <button onClick={handleCheckIn} disabled={!canCheckInToday || checkingIn} className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2 text-sm ${canCheckInToday && !checkingIn ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <Zap className="w-4 h-4" />
                        <span>{checkingIn ? 'Checking in...' : canCheckInToday ? "Claim Today's Points" : 'Already Checked In Today'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Earn More Points</h3>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-white fill-current" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1 text-sm">Refer and win 10,000 points!</h4>
                          <p className="text-xs text-gray-600">
                            Invite 3 friends by Nov 20 and earn a chance to be one of 5 winners of{' '}
                            <span className="font-bold text-purple-600">10,000 points</span>. Friends must complete onboarding to qualify.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">Share Your Stack</h4>
                            <p className="text-xs text-gray-500">Earn +25 pts</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Share your tool stack</p>
                        <button onClick={() => handleShare('twitter', 'tool_stack')} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-all">
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>

                    {activities.length === 0 ? (
                      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                        <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No activities available yet</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {activities.map((activity) => (
                          <div key={activity.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-200 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-xl">{activity.icon}</div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm">{activity.name}</h4>
                                  <p className="text-xs text-gray-500">{activity.description}</p>
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded">{activity.category}</span>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end space-y-2">
                                <div className="flex items-center space-x-1 text-yellow-600 font-bold text-sm">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span>+{activity.points}</span>
                                </div>
                                <button onClick={() => handleCompleteActivity(activity)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-all">
                                  Complete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Refer & Earn</h3>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Share Your Link</h4>
                          <p className="text-xs text-gray-600">Invite friends and earn 25 points when they join!</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{referralStats.count}</p>
                          <p className="text-xs text-gray-600 mt-1">Referrals</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{referralStats.pointsEarned}</p>
                          <p className="text-xs text-gray-600 mt-1">Points Earned</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Your personal referral link:</label>
                        <div className="flex items-center space-x-2">
                          <input type="text" value={`https://app.flowvahub.com/signup?ref=${referralCode}`} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs" />
                          <button onClick={copyReferralLink} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1">
                            <Copy className="w-4 h-4" />
                            {copied && <span className="text-xs">Copied!</span>}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => handleShare('facebook', 'referral_link')} className="w-9 h-9 bg-[#1877F2] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </button>
                        <button onClick={() => handleShare('twitter', 'referral_link')} className="w-9 h-9 bg-black rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </button>
                        <button onClick={() => handleShare('linkedin', 'referral_link')} className="w-9 h-9 bg-[#0A66C2] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </button>
                        <button onClick={() => handleShare('whatsapp', 'referral_link')} className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-xl p-6 text-white sticky top-6">
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2 bg-white/20 w-fit px-3 py-1 rounded-full">Featured</div>
                    <h3 className="text-xl font-bold mb-2">Top Tool Spotlight</h3>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                        <span className="text-xl">🤖</span>
                      </div>
                      <h4 className="font-semibold">Reclaim</h4>
                    </div>
                    <p className="text-white/90 text-sm mb-5">
                      Reclaim.ai is an AI-powered calendar assistant that automatically schedules your tasks, meetings, and breaks to boost productivity. Free to try — earn Flowva Points when you sign up!
                    </p>
                    <div className="space-y-2">
                      <button className="w-full bg-white text-purple-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm">Sign up</button>
                      <button className="w-full bg-white/10 backdrop-blur text-white py-2.5 rounded-lg font-semibold hover:bg-white/20 transition-all flex items-center justify-center space-x-2 text-sm">
                        <Gift className="w-4 h-4" />
                        <span>Claim 50 pts</span>
                      </button>
                    </div>
                  </div>
                  
                 </div>
              </div>
            )}

            {activeTab === 'redeem' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Available Rewards</h2>
                  <p className="text-gray-600">
                    You have <span className="font-bold text-purple-600">{profile?.points_balance || 0} points</span> available to redeem
                  </p>
                </div>

                {rewards.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No rewards available yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward) => {
                      const canAfford = (profile?.points_balance || 0) >= reward.points_required;
                      const pointsNeeded = reward.points_required - (profile?.points_balance || 0);

                      return (
                        <div key={reward.id} className={`bg-white rounded-xl p-6 border-2 transition-all ${canAfford ? 'border-purple-200 hover:border-purple-400 hover:shadow-lg' : 'border-gray-200 opacity-75'}`}>
                          <div className="text-center mb-4">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${canAfford ? 'bg-purple-50' : 'bg-gray-100'}`}>
                              <span className="text-3xl">{reward.icon}</span>
                            </div>
                            <h3 className="font-bold text-base text-gray-900 mb-2">{reward.name}</h3>
                            <p className="text-xs text-gray-600 mb-4">{reward.description}</p>
                          </div>

                          <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                              <Award className={`w-4 h-4 ${canAfford ? 'text-purple-600' : 'text-gray-400'}`} />
                              <span className={`font-bold text-lg ${canAfford ? 'text-purple-600' : 'text-gray-400'}`}>{reward.points_required} points</span>
                            </div>

                            {canAfford ? (
                              <button onClick={() => handleRedeemReward(reward)} className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-all text-sm">
                                Redeem Now
                              </button>
                            ) : (
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-2 text-gray-500 mb-2">
                                  <Lock className="w-4 h-4" />
                                  <span className="text-xs font-medium">Need {pointsNeeded} more points</span>
                                </div>
                                <button disabled className="w-full bg-gray-100 text-gray-400 py-2.5 rounded-lg font-semibold cursor-not-allowed text-sm">Locked</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}