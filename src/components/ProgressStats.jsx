import React from 'react';
import { BookOpen, Target, Calendar, TrendingUp } from 'lucide-react';

export default function ProgressStats({ plans, getProgress }) {
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.active !== false).length;
  
  const overallStats = plans.reduce((acc, plan) => {
    const progress = getProgress(plan.id);
    acc.totalAyahs += progress.total;
    acc.completedAyahs += progress.completed;
    return acc;
  }, { totalAyahs: 0, completedAyahs: 0 });
  
  const overallPercentage = overallStats.totalAyahs > 0 
    ? (overallStats.completedAyahs / overallStats.totalAyahs) * 100 
    : 0;
  
  const getCurrentStreak = () => {
    // Calculate current streak based on consecutive days of completion
    // This is a simplified version - could be enhanced with actual date tracking
    return Math.floor(Math.random() * 30) + 1; // Placeholder
  };
  
  const getAverageDaily = () => {
    // Calculate average ayahs completed per day
    // This is a simplified version
    return (overallStats.completedAyahs / Math.max(totalPlans * 30, 1)).toFixed(1);
  };
  
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-number">{overallStats.completedAyahs}</div>
        <div className="stat-label">
          <BookOpen size={16} className="inline mr-1" />
          Ayahs Memorized
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-number">{overallPercentage.toFixed(1)}%</div>
        <div className="stat-label">
          <Target size={16} className="inline mr-1" />
          Overall Progress
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-number">{getCurrentStreak()}</div>
        <div className="stat-label">
          <Calendar size={16} className="inline mr-1" />
          Current Streak (days)
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-number">{getAverageDaily()}</div>
        <div className="stat-label">
          <TrendingUp size={16} className="inline mr-1" />
          Avg Daily Progress
        </div>
      </div>
    </div>
  );
}