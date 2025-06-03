import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Star, TrendingUp, Calendar, Target, Play, CheckCircle, Clock } from 'lucide-react';
import { storage } from '../utils/storage';
import TaskCard from '../components/TaskCard';
import StatsCard from '../components/StatsCard';
import AyahSession from '../components/AyahSession';
import clsx from 'clsx';
import PlanCompletionCelebration from '../components/PlanCompletionCelebration';

export default function HomePage({ 
  plans, 
  getProgress, 
  onShowPlanCreator,
  refreshData,
  onNavigate
}) {
  const [currentSession, setCurrentSession] = useState(null);
  const [todayTasks, setTodayTasks] = useState({ 
    hafazan: [], 
    murajaah: [], 
    completedHafazan: [], 
    completedMurajaah: [], 
    canProgress: false, 
    nextAyah: null 
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [completionCelebration, setCompletionCelebration] = useState(null);

  useEffect(() => {
    if (plans.length > 0) {
      // When plans change, determine the selected plan
      let planToSelect = selectedPlan;
      
      // If no plan is selected, or the selected plan is no longer active, choose a new one
      if (!planToSelect || !plans.find(p => p.id === planToSelect.id)) {
        planToSelect = plans.find(p => p.active !== false) || plans[0];
      }
      
      // If we have a new plan that's different from current, or if we don't have a selected plan
      if (!selectedPlan || planToSelect.id !== selectedPlan.id) {
        setSelectedPlan(planToSelect);
      }
      
      if (planToSelect) {
        loadTodayTasks(planToSelect.id);
        checkPlanCompletion(planToSelect.id);
      }
    } else {
      // Reset state when no plans
      setSelectedPlan(null);
      setTodayTasks({ 
        hafazan: [], 
        murajaah: [], 
        completedHafazan: [], 
        completedMurajaah: [], 
        canProgress: false, 
        nextAyah: null 
      });
    }
  }, [plans]);

  const loadTodayTasks = (planId) => {
    const tasks = storage.getTodayTasks(planId);
    setTodayTasks(tasks);
  };

  const checkPlanCompletion = (planId) => {
    const completionStatus = storage.getPlanCompletionStatus(planId);
    if (completionStatus && completionStatus.completed) {
      const plan = plans.find(p => p.id === planId);
      // Only show celebration if plan hasn't been marked as completed yet
      if (plan && plan.status !== 'completed') {
        const nextSteps = storage.getNextStepSuggestions(planId);
        setCompletionCelebration({ completionStatus, nextSteps, planId });
      }
    }
  };

  const handleStartSession = (task, sessionType) => {
    setCurrentSession({
      surahNumber: task.surahNumber,
      ayahNumber: task.ayahNumber,
      startAyah: task.startAyah,
      endAyah: task.endAyah,
      sessionType: sessionType || task.type || 'hafazan',
      planId: selectedPlan.id
    });
  };

  const handleSessionComplete = () => {
    setCurrentSession(null);
    loadTodayTasks(selectedPlan.id);
    refreshData();
    // Check if this completion finished the entire plan
    setTimeout(() => checkPlanCompletion(selectedPlan.id), 100);
  };

  const handleCompletionDismiss = () => {
    // Mark plan as completed to avoid showing celebration again
    storage.markPlanCompleted(completionCelebration.planId);
    setCompletionCelebration(null);
    refreshData();
  };

  const handleCreateNewPlanFromSuggestion = (surah) => {
    setCompletionCelebration(null);
    if (surah) {
      // Pre-fill plan creator with suggested Surah
      onShowPlanCreator(surah.number);
    } else {
      // Show regular plan creator
      onShowPlanCreator();
    }
  };

  const handleContinueOtherPlans = () => {
    setCompletionCelebration(null);
    // Switch to another active plan
    const otherActivePlans = plans.filter(p => p.active !== false && p.id !== completionCelebration.planId);
    if (otherActivePlans.length > 0) {
      const nextPlan = otherActivePlans[0];
      setSelectedPlan(nextPlan);
      loadTodayTasks(nextPlan.id);
    }
  };

  const getOverallStats = () => {
    let totalMemorized = 0;
    let totalAyahs = 0;

    plans.forEach(plan => {
      const progress = getProgress(plan.id);
      totalMemorized += progress.completed;
      totalAyahs += progress.total;
    });

    const overallPercentage = totalAyahs > 0 ? (totalMemorized / totalAyahs) * 100 : 0;
    
    // Get streak data from the selected plan (or first plan if none selected)
    const streakPlanId = selectedPlan?.id || plans[0]?.id;
    const streakData = streakPlanId ? storage.getStreakData(streakPlanId) : { current: 0, longest: 0 };

    return {
      totalMemorized,
      totalAyahs,
      overallPercentage,
      currentStreak: streakData.current,
      longestStreak: streakData.longest
    };
  };

  if (currentSession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentSession(null)}
            className="text-slate-600 hover:text-slate-800 flex items-center gap-2 mb-4"
          >
            ← Back to Dashboard
          </button>
        </div>
        <AyahSession
          surahNumber={currentSession.surahNumber}
          ayahNumber={currentSession.ayahNumber}
          startAyah={currentSession.startAyah}
          endAyah={currentSession.endAyah}
          sessionType={currentSession.sessionType}
          planId={currentSession.planId}
          onComplete={handleSessionComplete}
        />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="glass-card rounded-2xl p-12">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Welcome to Hafazan</h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Begin your Quran memorization journey with a systematic approach. 
              Create your first plan and start memorizing ayahs with our advanced 
              visible and hidden repetition system.
            </p>
            <button
              onClick={onShowPlanCreator}
              className="px-8 py-4 btn-primary rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Create Your First Plan
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const stats = getOverallStats();
  const allTasks = [...todayTasks.hafazan, ...todayTasks.murajaah];
  const allCompletedTasks = [...todayTasks.completedHafazan, ...todayTasks.completedMurajaah];
  const totalTodayTasks = allTasks.length + allCompletedTasks.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Assalamualaikum! 🌙</h1>
            <p className="text-slate-600">
              {allTasks.length > 0 
                ? allCompletedTasks.length > 0 
                  ? `You have ${allTasks.length} pending and ${allCompletedTasks.length} completed task${totalTodayTasks > 1 ? 's' : ''} for today`
                  : `You have ${allTasks.length} task${allTasks.length > 1 ? 's' : ''} for today`
                : allCompletedTasks.length > 0
                  ? `Great! You've completed all ${allCompletedTasks.length} task${allCompletedTasks.length > 1 ? 's' : ''} for today 🎉`
                  : "Great! You've completed all tasks for today"}
            </p>
            {selectedPlan && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-slate-500">
                  Currently memorizing: <span className="font-medium text-slate-700">{selectedPlan.surahName}</span>
                  {plans.length > 1 && (
                    <button 
                      onClick={() => onNavigate && onNavigate('plans')}
                      className="ml-2 text-primary-600 hover:text-primary-700 underline"
                    >
                      Switch Plan
                    </button>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={BookOpen} title="Ayahs Memorized" value={stats.totalMemorized} subtitle="Total across all plans" color="blue" index={0} />
        <StatsCard icon={Target} title="Overall Progress" value={`${stats.overallPercentage.toFixed(1)}%`} subtitle="Completion percentage" color="green" index={1} />
        <StatsCard icon={TrendingUp} title="Current Streak" value={stats.currentStreak} subtitle="Days in a row" color="amber" index={2} />
        <StatsCard icon={Star} title="Longest Streak" value={stats.longestStreak} subtitle="Personal best" color="purple" index={3} />
      </div>

      {totalTodayTasks > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Today's Tasks</h2>
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="grid gap-4">
            {/* Pending Tasks */}
            {todayTasks.hafazan.map((task, index) => (
              <TaskCard
                key={`hafazan-${task.surahNumber}-${task.ayahNumber}`}
                task={task}
                surahName={selectedPlan?.surahName}
                onStart={handleStartSession}
                index={index}
              />
            ))}
            {todayTasks.murajaah.map((task, index) => (
              <TaskCard
                key={`murajaah-${task.surahNumber}-${task.ayahNumber}`}
                task={{ ...task, type: 'murajaah' }}
                surahName={selectedPlan?.surahName}
                onStart={handleStartSession}
                index={todayTasks.hafazan.length + index}
              />
            ))}
            
            {/* Completed Tasks - Show with satisfaction indicators */}
            {allCompletedTasks.length > 0 && (
              <>
                {allCompletedTasks.length > 0 && allTasks.length > 0 && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-slate-500 mb-3">✅ Completed Today</h3>
                  </div>
                )}
                {todayTasks.completedHafazan.map((task, index) => (
                  <motion.div
                    key={`completed-hafazan-${task.surahNumber}-${task.ayahNumber}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (allTasks.length + index) * 0.1 }}
                    className="glass-card rounded-xl p-4 bg-slate-50 border-slate-200 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-600 line-through">
                            ✅ {selectedPlan?.surahName} - Ayah {task.ayahNumber}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Memorization completed {new Date(task.completedAt).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-green-600 font-medium text-sm">
                        Hafazan ✓
                      </div>
                    </div>
                  </motion.div>
                ))}
                {todayTasks.completedMurajaah.map((task, index) => (
                  <motion.div
                    key={`completed-murajaah-${task.surahNumber}-${task.ayahNumber}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (allTasks.length + todayTasks.completedHafazan.length + index) * 0.1 }}
                    className="glass-card rounded-xl p-4 bg-slate-50 border-slate-200 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-600 line-through">
                            ✅ {selectedPlan?.surahName} - {task.startAyah && task.endAyah && task.startAyah !== task.endAyah 
                              ? `Ayahs ${task.startAyah}-${task.endAyah}` 
                              : `Ayah ${task.ayahNumber || task.startAyah}`}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Review completed {new Date(task.completedAt).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-blue-600 font-medium text-sm">
                        Murajaah ✓
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Progress to Next Ayah */}
          {todayTasks.canProgress && todayTasks.nextAyah && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-emerald-800 mb-1">🎉 Today's Goal Complete!</h3>
                  <p className="text-emerald-700">
                    Ready to progress to {selectedPlan?.surahName} - Ayah {todayTasks.nextAyah.ayahNumber}?
                  </p>
                </div>
                <button
                  onClick={() => handleStartSession(todayTasks.nextAyah, 'hafazan')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <Star className="w-5 h-5" />
                  Continue Journey
                </button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">All Done for Today! 🎉</h2>
          <p className="text-slate-600 mb-8">You've completed all your memorization and review tasks. Come back tomorrow to continue your journey.</p>
          <div className="flex justify-center gap-4">
            <button onClick={onShowPlanCreator} className="px-6 py-3 btn-secondary rounded-lg font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Plan
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">This Week</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Track your progress and upcoming ayahs in the calendar view.</p>
          <p className="text-2xl font-bold text-slate-800">{Math.floor(Math.random() * 7) + 1}/7</p>
          <p className="text-xs text-slate-500">Days completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Murajaah Due</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">Reviews scheduled for this week to maintain memorization.</p>
          <p className="text-2xl font-bold text-slate-800">{todayTasks.murajaah.length}</p>
          <p className="text-xs text-slate-500">Today's reviews</p>
        </motion.div>
      </div>

      {completionCelebration && (
        <PlanCompletionCelebration
          completionStatus={completionCelebration.completionStatus}
          nextSteps={completionCelebration.nextSteps}
          onDismiss={handleCompletionDismiss}
          onCreateNewPlan={handleCreateNewPlanFromSuggestion}
          onContinueOtherPlans={handleContinueOtherPlans}
        />
      )}
    </div>
  );
}
