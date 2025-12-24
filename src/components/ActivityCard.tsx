import React from 'react';
import { Star } from 'lucide-react';
import type { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onComplete: (activity: Activity) => void;
  index: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onComplete, index }) => {
  return (
    <div
      className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-violet-200 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-slide-up"
      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{activity.name}</h4>
            <p className="text-xs text-gray-500 line-clamp-2">{activity.description}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-xs font-medium rounded">
              {activity.category}
            </span>
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-2">
          <div className="flex items-center space-x-1 text-yellow-600 font-bold text-sm">
            <Star className="w-4 h-4 fill-current" />
            <span>+{activity.points}</span>
          </div>
          <button
            onClick={() => onComplete(activity)}
            className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-all hover:scale-105 transform whitespace-nowrap"
          >
            Complete
          </button>
        </div>
      </div>
    </div>
  );
};