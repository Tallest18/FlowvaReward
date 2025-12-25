# Flowva Rewards Hub

A modern, responsive rewards and gamification platform built with React, TypeScript, and Supabase. Users can earn points through daily check-ins, referrals, and engagement, then redeem them for rewards.

## 🚀 Live Demo

**Live URL:** https://flowva-reward.vercel.app/

## ✨ Features

- **Authentication System**: Secure sign-up/sign-in with Supabase Auth
- **Points & Rewards**: Earn points through various activities and redeem for rewards
- **Daily Check-ins**: Streak tracking with calendar visualization
- **Referral System**: Share referral codes and earn points
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Real-time Updates**: Live data synchronization with Supabase

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ and npm/yarn installed
- A Supabase account (free tier works)
- Git installed on your machine

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Tallest18/FlowvaReward.git
cd FlowvaReward
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

#### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (2-3 minutes)

#### 3.2 Run Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the following schema:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  points_balance INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create check_ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);

-- Create rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- check_ins policies
CREATE POLICY "Users can view own check-ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- rewards policies
CREATE POLICY "Anyone can view available rewards" ON rewards
  FOR SELECT USING (available = true);

-- referrals policies
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX idx_check_ins_date ON check_ins(check_in_date);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- Insert sample rewards
INSERT INTO rewards (name, description, points_required, available) VALUES
  ('$5 Amazon Gift Card', 'Redeem for a $5 Amazon gift card', 500, true),
  ('$10 Starbucks Card', 'Enjoy your favorite coffee on us', 1000, true),
  ('Premium Feature Access', 'Unlock premium features for 1 month', 750, true),
  ('$25 Gift Card', 'Choose from multiple retailers', 2500, true);
```

3. Click "Run" to execute the schema

#### 3.3 Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Add `.env` to your `.gitignore` file to keep credentials secure!

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## 🚀 Deployment Guide

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/flowva-rewards-hub.git
   git push -u origin main
   ```

3. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"
     
The application can be deployed to any static hosting service that supports Vite/React:
- GitHub Pages
- Cloudflare Pages
- Railway
- Render

## 📱 Usage

### For Users

1. **Sign Up**: Create an account with email/password
2. **Daily Check-in**: Click the check-in button to earn 5 points daily
3. **Build Streaks**: Check in consecutively to build your streak
4. **Refer Friends**: Share your referral code to earn bonus points
5. **Redeem Rewards**: Use your points to claim rewards

### For Developers

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🏗️ Project Structure

```
flowva-rewards-hub/
├── src/
│   ├── components/         # React components
│   │   ├── AuthForm.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PointsBalance.tsx
│   │   ├── StreakCalendar.tsx
│   │   ├── RewardCard.tsx
│   │   └── ReferralSection.tsx
│   ├── lib/
│   │   └── supabase.ts    # Supabase client configuration
│   ├── types.ts           # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── .env                   # Environment variables (not in git)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔐 Security Considerations

- Environment variables are never committed to Git
- Row Level Security (RLS) is enabled on all Supabase tables
- Users can only access their own data
- Authentication is handled securely through Supabase Auth

## 🎯 Assumptions Made

1. **Email Verification**: Email confirmation is disabled for faster testing. In production, you should enable email verification in Supabase Auth settings.

2. **Point Values**: Fixed point values are hardcoded:
   - Daily check-in: 5 points
   - Referral completion: 50 points (configurable)
   - These can be made dynamic by adding a configuration table

3. **Reward Distribution**: The app shows a success message but doesn't actually send rewards. In production, you'd integrate with:
   - Email service (SendGrid, Mailgun)
   - Gift card API providers
   - Payment processing

4. **Referral Tracking**: Simplified referral system using user ID prefixes. Production should use:
   - Unique referral codes
   - Analytics tracking
   - Fraud prevention

5. **Responsive Breakpoints**: Using Tailwind's default breakpoints:
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

## ⚖️ Trade-offs Made

### 1. **Client-Side State Management**
   - **Choice**: Using React useState instead of Redux/Zustand
   - **Why**: Simpler setup for this scope, fewer dependencies
   - **Trade-off**: May need refactoring if state complexity grows

### 2. **Database Structure**
   - **Choice**: Denormalized some data (e.g., points_balance in user_profiles)
   - **Why**: Faster queries, reduced joins
   - **Trade-off**: Need to keep balances in sync, potential inconsistency

### 3. **Real-time Updates**
   - **Choice**: Manual refetch instead of Supabase realtime subscriptions
   - **Why**: Simpler implementation, lower complexity
   - **Trade-off**: Not truly real-time, requires page refresh for some updates

### 4. **Error Handling**
   - **Choice**: Simple error messages shown in UI
   - **Why**: Quick implementation, good for MVP
   - **Trade-off**: No error logging service, harder to debug production issues

### 5. **Mobile Responsiveness**
   - **Choice**: CSS-only responsive design without separate mobile views
   - **Why**: Maintainability, single codebase
   - **Trade-off**: Some compromises on mobile UX vs native apps

### 6. **Caching Strategy**
   - **Choice**: No caching layer (direct API calls)
   - **Why**: Simpler architecture, always fresh data
   - **Trade-off**: More API calls, higher latency

## 🔮 Future Enhancements

- [ ] Push notifications for streak reminders
- [ ] Social sharing previews (Open Graph)
- [ ] Analytics dashboard
- [ ] Admin panel for reward management
- [ ] Gamification: badges, leaderboards
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Progressive Web App (PWA) support
- [ ] Email notifications
- [ ] Integration with payment providers

## 🐛 Troubleshooting

### "Database table does not exist"
- Make sure you ran the SQL schema in Supabase
- Check that all tables were created successfully

### "Permission denied"
- Verify RLS policies are created
- Check that you're authenticated
- Ensure user_id matches auth.uid()

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 18+)

### Supabase connection issues
- Verify environment variables are set correctly
- Check Supabase project status
- Ensure API keys are correct and not expired

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub

---

**Built with ❤️ using React, TypeScript, and Supabase**
