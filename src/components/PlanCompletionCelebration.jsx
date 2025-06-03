import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Plus,
  CheckCircle,
  Zap,
  Award
} from 'lucide-react';
import clsx from 'clsx';

const AchievementBadge = ({ level, daysEarly, surahName }) => {
  const badges = {
    exceptional: {
      color: 'from-purple-500 via-pink-500 to-red-500',
      icon: Award,
      title: 'Exceptional Hafiz! 🏆',
      description: `${daysEarly} days early - Outstanding dedication!`,
      bgColor: 'bg-purple-50'
    },
    excellent: {
      color: 'from-yellow-400 via-orange-500 to-red-500',
      icon: Trophy,
      title: 'Excellent Achievement! ⭐',
      description: `${daysEarly} days ahead of schedule`,
      bgColor: 'bg-yellow-50'
    },
    great: {
      color: 'from-emerald-400 via-blue-500 to-purple-600',
      icon: Zap,
      title: 'Great Progress! ⚡',
      description: `Finished ${daysEarly} days early`,
      bgColor: 'bg-emerald-50'
    },
    good: {
      color: 'from-green-400 to-blue-500',
      icon: TrendingUp,
      title: 'Well Done! 📈',
      description: `Completed ahead of schedule`,
      bgColor: 'bg-green-50'
    },
    completed: {
      color: 'from-blue-500 to-teal-500',
      icon: CheckCircle,
      title: 'Mission Accomplished! ✅',
      description: 'Completed exactly on schedule',
      bgColor: 'bg-blue-50'
    }
  };

  const badge = badges[level] || badges.completed;
  const Icon = badge.icon;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', duration: 0.8 }}
      className={`${badge.bgColor} rounded-2xl p-6 text-center relative overflow-hidden`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-current rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        className={`w-20 h-20 bg-gradient-to-r ${badge.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl relative z-10`}
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{badge.title}</h2>
        <p className="text-slate-600 mb-4">{badge.description}</p>
        <div className="text-lg font-semibold text-slate-800">
          Surah {surahName} Complete! 🕌
        </div>
      </motion.div>
    </motion.div>
  );
};

const SurahSuggestion = ({ surah, index, onSelect }) => (
  <motion.button
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.7 + index * 0.1 }}
    onClick={() => onSelect(surah)}
    className="w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group"
  >
    <div className="flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-slate-800 group-hover:text-emerald-800">
          Surah {surah.name}
        </h4>
        <p className="text-sm text-slate-600 group-hover:text-emerald-700">
          {surah.reason}
        </p>
      </div>
      <Plus className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
    </div>
  </motion.button>
);

export default function PlanCompletionCelebration({ 
  completionStatus, 
  nextSteps,
  onCreateNewPlan,
  onDismiss,
  onContinueOtherPlans 
}) {
  const {
    surahName,
    daysEarly,
    completedEarly,
    totalAyahs,
    completionDate
  } = completionStatus;

  const {
    achievementLevel,
    suggestedSurahs,
    hasOtherActivePlans,
    murajaahContinues
  } = nextSteps;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Achievement Badge */}
        <AchievementBadge 
          level={achievementLevel}
          daysEarly={daysEarly}
          surahName={surahName}
        />

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 my-6"
        >
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{totalAyahs}</div>
            <div className="text-xs text-slate-600">Ayahs Memorized</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">
              {completedEarly ? daysEarly : 0}
            </div>
            <div className="text-xs text-slate-600">Days Early</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-xs text-slate-600">Complete</div>
          </div>
        </motion.div>

        {/* Murajaah Continues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-600" />
            <div>
              <h4 className="font-semibold text-amber-800">Murajaah Continues</h4>
              <p className="text-sm text-amber-700">
                Your review sessions will continue automatically to maintain this Surah in your memory.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4">What's Next?</h3>
          
          {/* Continue Other Plans */}
          {hasOtherActivePlans && (
            <motion.button
              onClick={onContinueOtherPlans}
              className="w-full mb-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <BookOpen className="w-5 h-5" />
              Continue Other Active Plans
            </motion.button>
          )}

          {/* Suggested Surahs */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-700">Suggested Next Surahs:</h4>
            {suggestedSurahs.map((surah, index) => (
              <SurahSuggestion
                key={surah.number}
                surah={surah}
                index={index}
                onSelect={onCreateNewPlan}
              />
            ))}
          </div>

          {/* Custom Plan */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            onClick={() => onCreateNewPlan(null)}
            className="w-full mt-4 p-4 border-2 border-dashed border-slate-300 hover:border-emerald-400 text-slate-600 hover:text-emerald-600 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Choose Your Own Surah
          </motion.button>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="flex gap-4 mt-8"
        >
          <button
            onClick={onDismiss}
            className="flex-1 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-200"
          >
            Celebrate Later
          </button>
          <button
            onClick={() => onCreateNewPlan(null)}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Start New Journey
          </button>
        </motion.div>

        {/* Completion Date */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center mt-6 text-sm text-slate-500"
        >
          Completed on {new Date(completionDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 