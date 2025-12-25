import React from 'react';
import { Gem } from 'lucide-react';

interface PointsBalanceProps {
  pointsBalance: number;
}

export const PointsBalance: React.FC<PointsBalanceProps> = ({ pointsBalance }) => {
  const nextRewardPoints = 5000;
  const progressPercent = Math.min((pointsBalance / nextRewardPoints) * 100, 100);

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-2 mb-6">
        <Gem className="w-5 h-5 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">Points Balance</span>
      </div>
      
      <div className="flex justify-between space-x-3 mb-6">
        <p className="text-5xl font-bold text-purple-600">{pointsBalance}</p>
        <div className="mb-10 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-2xl">⭐</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress to $5 Gift Card</span>
          <span className="font-semibold text-gray-900">
            {pointsBalance}/{nextRewardPoints}
          </span>
        </div>
        <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mb-5 text-xs text-gray-500 flex items-center mb-25">
          <span className="mr-1">💡</span>
          Just getting started — keep earning points!
        </p>
      </div>
    </div>
  );
};