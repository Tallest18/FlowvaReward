import { useState, useEffect, useCallback } from 'react';
import { Bell, Share2, Star, Gift, Menu, X, Calendar, User as UserIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { Sidebar } from './components/Sidebar';
import { PointsBalance } from './components/PointsBalance';
import { StreakCalendar } from './components/StreakCalendar';
import { RewardCard } from './components/RewardCard';
import { ReferralSection } from './components/ReferralSection';
import { LoadingState } from './components/LoadingState';
import { ConfigurationError } from './components/ConfigurationError';
import type {
  User,
  UserProfile,
  Reward,
  CheckIn,
  ReferralStats,
  TabType,
  PageType,
} from './types';

interface SupabaseError {
  message: string;
  details: string | null;
  hint: string | null;
  code: string;
}

interface AuthError extends Error {
  status?: number;
  code?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('earn');
  const [activePage, setActivePage] = useState<PageType>('rewards');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<ReferralStats>({ count: 0, pointsEarned: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const createUserProfile = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      console.log('Creating profile for user:', user.id);

      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing profile:', checkError);
        if (checkError.code === 'PGRST301' || checkError.message.includes('permission')) {
          setError('Database permissions not configured. Please run the SQL schema from README.md');
          return;
        }
      }

      if (existingProfile) {
        console.log('Profile already exists:', existingProfile);
        setProfile(existingProfile);
        return;
      }

      console.log('Inserting new profile...');
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          points_balance: 0,
          current_streak: 0,
          longest_streak: 0,
          last_check_in: null,
        })
        .select()
        .single();

      if (error) {
        const supabaseError = error as SupabaseError;
        console.error('Profile creation error:', supabaseError);
        console.error('Error details:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });

        if (supabaseError.code === '42P01') {
          setError('Database table "user_profiles" does not exist. Please run the SQL schema from README.md');
        } else if (supabaseError.code === '42501') {
          setError('Permission denied. Please enable RLS policies as shown in README.md');
        } else if (supabaseError.code === '23505') {
          const { data: fetchedProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (fetchedProfile) {
            setProfile(fetchedProfile);
            return;
          }
        } else {
          setError(`Database error: ${supabaseError.message}. Check browser console for details.`);
        }
      } else if (data) {
        console.log('Profile created successfully:', data);
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Unexpected error creating profile:', error);
      setError(`Unexpected error: ${error.message}`);
    }
  }, [user]);

  const loadReferralCode = useCallback(async () => {
    if (!user) return;
    try {
      const code = user.id.substring(0, 8).toUpperCase();
      setReferralCode(code);
    } catch (err) {
      console.error('Error loading referral code:', err);
    }
  }, [user]);

  const loadReferralStats = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase.from('referrals').select('*').eq('referrer_id', user.id);

      if (!error && data) {
        const completed = data.filter((r) => r.status === 'completed');
        const totalPoints = completed.reduce((sum, r) => sum + r.points_earned, 0);
        setReferralStats({
          count: completed.length,
          pointsEarned: totalPoints,
        });
      }
    } catch (err) {
      console.error('Error loading referral stats:', err);
    }
  }, [user]);

  const loadRecentCheckIns = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('check_in_date', { ascending: false })
        .limit(7);

      if (!error && data) {
        setRecentCheckIns(data);
      } else if (error) {
        console.error('Error loading check-ins:', error);
      }
    } catch (err) {
      console.error('Error loading check-ins:', err);
    }
  }, [user]);

  const loadUserData = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        await createUserProfile();
      } else if (!profileData) {
        await createUserProfile();
      } else {
        setProfile(profileData);
      }

      await loadReferralCode();
      await loadReferralStats();

      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('available', true)
        .order('points_required', { ascending: true });

      if (!rewardsError && rewardsData) {
        setRewards(rewardsData);
      }

      await loadRecentCheckIns();
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }, [user, createUserProfile, loadReferralCode, loadReferralStats, loadRecentCheckIns]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  const checkUser = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      }
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
        setError(null);
      }
    } catch (err) {
      const error = err as AuthError;
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
      throw err;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            email_confirm: false,
          }
        },
      });

      if (error) throw error;

      if (data.user) {
        if (data.session) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
          });
          setError(null);
        } else {
          setError('Account created! You can now sign in with your credentials.');
        }
      }
    } catch (err) {
      const error = err as AuthError;
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up');
      throw err;
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setActivePage('rewards');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const canCheckInToday = () => {
    if (!profile?.last_check_in) return true;
    const lastCheckIn = new Date(profile.last_check_in);
    const today = new Date();
    return lastCheckIn.toDateString() !== today.toDateString();
  };

  const handleCheckIn = async () => {
    if (!user || !profile || !supabase) return;

    setCheckingIn(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error: checkInError } = await supabase.from('check_ins').insert({
        user_id: user.id,
        check_in_date: today,
        points_earned: 5,
      });

      if (checkInError) {
        console.error('Check-in insert error:', checkInError);
        throw checkInError;
      }

      const newStreak = profile.current_streak + 1;
      const newBalance = profile.points_balance + 5;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          points_balance: newBalance,
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, profile.longest_streak),
          last_check_in: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      setProfile({
        ...profile,
        points_balance: newBalance,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, profile.longest_streak),
        last_check_in: new Date().toISOString(),
      });

      await loadRecentCheckIns();
      
      setError(null);
    } catch (err) {
      console.error('Check-in error:', err);
      const error = err as SupabaseError;
      if (error.code === '23505') {
        setError('You have already checked in today!');
      } else if (error.message) {
        setError(`Check-in failed: ${error.message}`);
      } else {
        setError('Failed to check in. Please try again.');
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!user || !profile || !supabase) return;
    if (profile.points_balance < reward.points_required) {
      setError('Not enough points');
      return;
    }

    try {
      const newBalance = profile.points_balance - reward.points_required;

      const { error } = await supabase
        .from('user_profiles')
        .update({ points_balance: newBalance })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, points_balance: newBalance });
      
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 animate-slide-up text-sm sm:text-base';
      successDiv.textContent = `${reward.name} redeemed! Check your email.`;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 4000);
    } catch (err) {
      console.error('Reward redemption error:', err);
      setError('Failed to redeem reward');
    }
  };

  const handleShare = async (platform: string, type: string) => {
    const messages: { [key: string]: string } = {
      tool_stack: `Check out my productivity stack on Flowva! 🚀`,
      referral_link: `Join me on Flowva and earn rewards for using great tools! Use my code: ${referralCode}`,
    };

    const message = messages[type] || messages.referral_link;
    const url = `https://app.flowvahub.com/signup?ref=${referralCode}`;

    const shareUrls: { [key: string]: string } = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (!isSupabaseConfigured()) {
    return <ConfigurationError />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} error={error} setError={setError} />;
  }

  if (activePage !== 'rewards') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 sm:p-2.5 bg-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 animate-fade-in"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 xl:w-72 lg:z-10">
          <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
        </div>

        <div className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 sm:w-72 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
        )}

        <div className="flex-1 lg:ml-64 xl:ml-72">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                  {activePage === 'home' && 'Home'}
                  {activePage === 'discover' && 'Discover'}
                  {activePage === 'library' && 'Library'}
                  {activePage === 'tech-stack' && 'Tech Stack'}
                  {activePage === 'subscriptions' && 'Subscriptions'}
                  {activePage === 'settings' && 'Settings'}
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                  {activePage === 'home' && 'Welcome to your dashboard'}
                  {activePage === 'discover' && 'Explore new tools and resources'}
                  {activePage === 'library' && 'Your saved tools and resources'}
                  {activePage === 'tech-stack' && 'Manage your technology stack'}
                  {activePage === 'subscriptions' && 'Manage your subscriptions'}
                  {activePage === 'settings' && 'Configure your account settings'}
                </p>
                
                {activePage === 'settings' && (
                  <div className="mt-4 sm:mt-6 animate-fade-in-delay">
                    <button 
                      onClick={handleSignOut} 
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm sm:text-base"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 sm:p-2.5 bg-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 animate-fade-in"
      >
        {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>

      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 xl:w-72 lg:z-10">
        <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
      </div>

      <div className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 sm:w-72 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} user={user} />
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex-1 lg:ml-65 xl:ml-65 flex flex-col min-h-screen">
        <div className="bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-20 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex-1 pl-12 sm:pl-14 lg:pl-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                Rewards Hub
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 leading-tight">
                Earn points, unlock rewards, and celebrate your progress!
              </p>
            </div>
            <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 flex-shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          <div className="flex space-x-1 border-b border-gray-200 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
            <button
              onClick={() => setActiveTab('earn')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === 'earn' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Earn Points
            </button>
            <button
              onClick={() => setActiveTab('redeem')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                activeTab === 'redeem' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Redeem Rewards
            </button>
          </div>

          {error && (
            <div className="mb-3 sm:mb-4 md:mb-6 p-2.5 sm:p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between animate-slide-down">
              <span className="text-xs sm:text-sm">{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="ml-2 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'earn' && profile && (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <div className="border-l-4 border-violet-600 pl-2 sm:pl-3 md:pl-4 animate-fade-in">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Your Rewards Journey</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                <div className="animate-fade-in-stagger-1">
                  <PointsBalance pointsBalance={profile.points_balance} />
                </div>

                <div className="animate-fade-in-stagger-2">
                  <StreakCalendar
                    currentStreak={profile.current_streak}
                    recentCheckIns={recentCheckIns}
                    canCheckInToday={canCheckInToday()}
                    checkingIn={checkingIn}
                    onCheckIn={handleCheckIn}
                  />
                </div>
                
                <div className="pb-0 relative bg-gradient-to-br from-purple-600 via-purple-500 to-blue-400 rounded-xl text-white shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-fade-in-stagger-3">
                  <div className="inline-block m-2 mb-2 sm:mb-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-700/40 backdrop-blur-sm rounded-lg text-xs font-semibold">
                    Featured
                  </div>
                  
                  <div className="m-3 absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg">
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  </div>

                  <h3 className="m-3 text-lg sm:text-xl md:text-2xl font-bold mb-0.5 sm:mb-1 pr-12 sm:pr-14 md:pr-16">
                    Top Tool Spotlight
                  </h3>
                  
                  <h4 className=" m-3 text-base sm:text-lg md:text-xl font-bold">Reclaim</h4>
                  <div className='bg-white m-0 pb-2'>
                  <div className="mb-2 sm:mb-4 md:mb-2 bg-white text-black backdrop-blur-sm rounded-lg p-2.5 sm:p-3 md:p-2.5">
                    <div className="flex items-start space-x-2 sm:space-x-2.5 md:space-x-2.5">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1">
                          Automate and Optimize Your Schedule
                        </h5>
                        <p className="text-black text-xs sm:text-sm leading-relaxed">
                          Reclaim.ai is an AI-powered calendar assistant that automatically schedules your tasks, meetings, and breaks to boost productivity. Free to try — earn Flowva Points when you sign up!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="m-2 flex gap-2 sm:gap-2.5 md:gap-3">
                    <button className="flex-1 bg-purple-700 hover:bg-purple-800 text-white rounded-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-3.5 md:px-4 text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-1.5 md:space-x-2 shadow-md">
                      <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      <span>Sign up</span>
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white rounded-full py-1 sm:py-2.5 md:py-3 px-3 sm:px-3.5 md:px-1 text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-1.5 md:space-x-2 shadow-md">
                      <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      <span>Claim 50 pts</span>
                    </button>
                  </div>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-violet-600 pl-2 sm:pl-3 md:pl-4 mt-4 sm:mt-6 md:mt-8 animate-fade-in">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Earn More Points</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 lg:w-[800px] sm:w-full md:w-full">
                <div className="border border-gray-200 rounded-xl sm:rounded-2xl hover:shadow-lg hover:border-violet-300 transition-all duration-300 hover:-translate-y-1 animate-fade-in-stagger-1 overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                    <div className="flex-1 w-full">
                      <div className='bg-white p-3 sm:p-4 md:p-5 lg:p-6 flex items-center'>
                        <div className='mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0'>
                          <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-purple-600 fill-purple-600 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg lg:text-xl mb-0 sm:mb-1 md:mb-1.5 break-words">
                            Refer and win 10,000 points!
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base font-semibold p-3 sm:p-4 md:p-5 lg:p-6 text-gray-600 leading-relaxed">
                        Invite 3 friends by Nov 20 and earn a chance to be one of 5 winners of{' '}
                        <span className="font-semibold text-purple-600">10,000 points</span>. Friends must complete onboarding to qualify.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl sm:rounded-2xl hover:shadow-lg hover:border-violet-300 transition-all duration-300 hover:-translate-y-1 animate-fade-in-stagger-2 overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                    <div className="flex-1 w-full">
                      <div className='bg-white p-3 sm:p-4 md:p-5 lg:p-6 flex items-center'>
                        <div className='mr-1.5 sm:mr-2 md:mr-3 flex-shrink-0'>
                          <Share2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg break-words">Share Your Stack</h3>
                          <p className="text-xs sm:text-sm md:text-base text-gray-500 font-semibold">Earn +25 pts</p>
                        </div>
                      </div>
                      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 md:px-5 lg:px-6 pb-3 sm:pb-4 md:pb-5 lg:pb-6 gap-2 sm:gap-0'>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-semibold leading-relaxed break-words">Share Your Stack</p>
                        </div>
                        <div className="w-full sm:w-auto sm:ml-2 flex-shrink-0">
                          <button
                            onClick={() => handleShare('twitter', 'tool_stack')}
                            className="w-full mt-5 sm:w-auto flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-4 md:px-5 lg:px-6 py-1.5 sm:py-2 md:py-2.5 bg-blue-50 border border-gray-200 rounded-full text-xs sm:text-sm md:text-base font-medium text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:scale-105 transition-all duration-200 whitespace-nowrap"
                          >
                            <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in">
                <ReferralSection referralCode={referralCode} referralStats={referralStats} onShare={handleShare} />
              </div>
            </div>
          )}

          {activeTab === 'redeem' && profile && (
            <div className="animate-fade-in">
              <div className="mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1">Available Rewards</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  You have <span className="font-bold text-violet-600">{profile.points_balance} points</span> available to redeem
                </p>
              </div>

              {rewards.length === 0 ? (
                <div className="bg-white rounded-xl p-6 sm:p-8 md:p-12 text-center border border-gray-200 hover:shadow-md transition-shadow duration-300">
                  <Gift className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-2 sm:mb-3 md:mb-4 animate-bounce" />
                  <p className="text-gray-500 text-xs sm:text-sm md:text-base">No rewards available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {rewards.map((reward, index) => (
                    <div key={reward.id} className="animate-fade-in-stagger" style={{ animationDelay: `${index * 100}ms` }}>
                      <RewardCard 
                        reward={reward} 
                        pointsBalance={profile.points_balance} 
                        onRedeem={handleRedeemReward} 
                        index={index} 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.5s ease-out 0.1s both;
        }

        .animate-fade-in-stagger-1 {
          animation: fade-in 0.5s ease-out 0.1s both;
        }

        .animate-fade-in-stagger-2 {
          animation: fade-in 0.5s ease-out 0.2s both;
        }

        .animate-fade-in-stagger-3 {
          animation: fade-in 0.5s ease-out 0.3s both;
        }

        .animate-fade-in-stagger {
          animation: fade-in 0.5s ease-out both;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default App;