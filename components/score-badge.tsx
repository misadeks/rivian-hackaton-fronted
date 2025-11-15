'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { DriveData } from '@/types/driving';

interface ScoreBadgeProps {
  driveData: DriveData | null;
}

export function ScoreBadge({ driveData }: ScoreBadgeProps) {
  if (!driveData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    return 'Needs Improvement';
  };

  const violationCount = driveData.timeline.filter(event => event.detected_violation).length;

  return (
    <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
      {/* Circular Score Badge */}
      <div className="relative">
        <div className={`
          w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-lg
          ${getScoreColor(driveData.score)}
        `}>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {driveData.score}
            </div>
            <div className="text-xs opacity-75">
              SCORE
            </div>
          </div>
        </div>
      </div>

      {/* Score Label */}
      <Badge 
        variant="secondary" 
        className={`text-center ${getScoreColor(driveData.score)} border`}
      >
        {getScoreLabel(driveData.score)}
      </Badge>

      {/* Violation Badge */}
      {violationCount > 0 && (
        <Badge 
          variant="destructive" 
          className="text-center bg-red-500 hover:bg-red-600 text-white"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {violationCount} {violationCount === 1 ? 'Violation' : 'Violations'}
        </Badge>
      )}

      {/* Clean Drive Badge */}
      {violationCount === 0 && driveData.score >= 90 && (
        <Badge 
          variant="secondary" 
          className="text-center bg-green-500 hover:bg-green-600 text-white"
        >
          <Shield className="w-3 h-3 mr-1" />
          Clean Drive
        </Badge>
      )}
    </div>
  );
}