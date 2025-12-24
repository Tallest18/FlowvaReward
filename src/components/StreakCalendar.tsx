import React from 'react';
import { Calendar, Zap } from 'lucide-react';
import type { CheckIn } from '../types';

interface StreakCalendarProps {
  currentStreak: number;
  recentCheckIns: CheckIn[];
  canCheckInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  currentStreak,
  recentCheckIns,
  canCheckInToday,
  checkingIn,
  onCheckIn,
}) => {
  const getDaysOfWeek = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const mondayIndex = today === 0 ? 6 : today - 1;

    return days.map((day, index) => {
      const daysAgo = (mondayIndex - index + 7) % 7;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split('T')[0];
      const hasCheckIn = recentCheckIns.some((c) => c.check_in_date === dateStr);
      const isToday = daysAgo === 0;

      return { day, hasCheckIn, isToday, date: dateStr };
    });
  };

  const daysOfWeek = getDaysOfWeek();

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-5 h-5 text-blue-500" />
        <span className="text-sm font-medium text-gray-700">Daily Streak</span>
      </div>
      
      <div className="flex items-center space-x-3 mb-6">
        <p className="text-5xl font-bold text-purple-600">{currentStreak}</p>
        <span className="text-xl font-semibold text-gray-600">day{currentStreak !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex justify-between mb-4">
        {daysOfWeek.map((dayInfo, idx) => (
          <div key={idx} className="flex flex-col items-center space-y-2">
            <span className="text-xs font-medium text-gray-500">{dayInfo.day}</span>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                dayInfo.hasCheckIn
                  ? 'bg-purple-600 text-white'
                  : dayInfo.isToday
                  ? 'border-2 border-purple-500 bg-white'
                  : 'bg-gray-100'
              }`}
            >
              {dayInfo.hasCheckIn && <span className="text-white text-lg">✓</span>}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mb-4 text-center">Check in daily to to earn +5 points</p>

      <button
        onClick={onCheckIn}
        disabled={!canCheckInToday || checkingIn}
        className={`w-full py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
          canCheckInToday && !checkingIn
            ? 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105 transform shadow-lg hover:shadow-xl'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Zap className="w-4 h-4" fill="currentColor" />
        <span>{checkingIn ? 'Checking in...' : canCheckInToday ? "Claim Today's Points" : 'Already Checked In'}</span>
      </button>
    </div>
  );
};