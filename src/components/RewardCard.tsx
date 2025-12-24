import React from 'react';
import { Award, Lock } from 'lucide-react';
import type { Reward } from '../types';

interface RewardCardProps {
  reward: Reward;
  pointsBalance: number;
  onRedeem: (reward: Reward) => void;
  index: number;
}

export const RewardCard: React.FC<RewardCardProps> = ({ reward, pointsBalance, onRedeem, index }) => {
  const canAfford = pointsBalance >= reward.points_required;
  const pointsNeeded = reward.points_required - pointsBalance;

  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-6 border-2 transition-all duration-300 animate-scale-in ${
        canAfford
          ? 'border-violet-200 hover:border-violet-400 hover:shadow-lg hover:scale-105'
          : 'border-gray-200 opacity-75'
      }`}
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
    >
      <div className="text-center mb-4">
        <div
          className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl mb-4 ${
            canAfford ? 'bg-violet-50' : 'bg-gray-100'
          }`}
        >
          <span className="text-2xl sm:text-3xl">{reward.icon}</span>
        </div>
        <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2">{reward.name}</h3>
        <p className="text-xs text-gray-600 mb-4 line-clamp-2">{reward.description}</p>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Award className={`w-4 h-4 ${canAfford ? 'text-violet-600' : 'text-gray-400'}`} />
          <span className={`font-bold text-base sm:text-lg ${canAfford ? 'text-violet-600' : 'text-gray-400'}`}>
            {reward.points_required.toLocaleString()} points
          </span>
        </div>

        {canAfford ? (
          <button
            onClick={() => onRedeem(reward)}
            className="w-full bg-violet-600 text-white py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-violet-700 transition-all text-xs sm:text-sm hover:scale-105 transform"
          >
            Redeem Now
          </button>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500 mb-2">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-medium">Need {pointsNeeded.toLocaleString()} more points</span>
            </div>
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 py-2 sm:py-2.5 rounded-lg font-semibold cursor-not-allowed text-xs sm:text-sm"
            >
              Locked
            </button>
          </div>
        )}
      </div>
    </div>
  );
};