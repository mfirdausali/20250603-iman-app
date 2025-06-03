import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Calendar, Target, BarChart3, Play } from 'lucide-react';
import { storage } from '../utils/storage';
import PlanCompletionCelebration from '../components/PlanCompletionCelebration';
import clsx from 'clsx';

export default function PlansPage({ 
  plans, 
  getProgress, 
  onShowPlanCreator, 
  setCurrentPlan,
  onStartLearning,
  refreshData
}) {
  const [completionCelebration, setCompletionCelebration] = useState(null);

  useEffect(() => {
    // Check for any completed plans when component mounts or plans change
    plans.forEach(plan => {
      if (plan.active !== false) { // Only check active plans
        checkPlanCompletion(plan.id);
      }
    });
  }, [plans]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEstimatedCompletion = (plan) => {
    const startDate = new Date(plan.startDate);
    const daysToComplete = Math.ceil(plan.totalAyahs / plan.ayahsPerDay);
    const completionDate = new Date(startDate.getTime() + (daysToComplete - 1) * 24 * 60 * 60 * 1000);
    return completionDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const checkPlanCompletion = (planId) => {
    const completionStatus = storage.getPlanCompletionStatus(planId);
    console.log('🔍 Plan completion check:', { planId, completionStatus });
    
    if (completionStatus && completionStatus.completed) {
      const plan = plans.find(p => p.id === planId);
      console.log('📋 Plan details:', { plan, status: plan?.status, completedAt: plan?.completedAt });
      
      // Only show celebration if plan hasn't been marked as completed yet
      // Check both the status field AND if completedAt exists (already celebrated)
      if (plan && plan.status !== 'completed' && !plan.completedAt) {
        console.log('🎉 Triggering celebration for plan:', planId);
        const nextSteps = storage.getNextStepSuggestions(planId);
        setCompletionCelebration({ completionStatus, nextSteps, planId });
      } else {
        console.log('⏭️ Plan already celebrated or marked complete');
      }
    } else {
      console.log('❌ Plan not completed yet');
    }
  };

  const getNextTask = (planId) => {
    // First check if plan is completed for memorization
    const completionStatus = storage.getPlanCompletionStatus(planId);
    if (completionStatus && completionStatus.completed) {
      return null; // Plan is fully memorized, no more hafazan tasks
    }

    const tasks = storage.getTodayTasks(planId);
    
    // PRIORITY 1: Progress to next ayah if today's work is done
    // This ensures we always move forward rather than getting stuck reviewing
    if (tasks.canProgress && tasks.nextAyah) {
      return {
        task: tasks.nextAyah,
        type: 'hafazan'
      };
    }
    
    // PRIORITY 2: Continue with overdue hafazan tasks (catch up)
    if (tasks.hafazan.length > 0) {
      return {
        task: tasks.hafazan[0],
        type: 'hafazan'
      };
    }
    
    // PRIORITY 3: Only do murajaah if no new memorization is available
    // But not if the plan is completed (to avoid showing reviews for completed plans)
    if (tasks.murajaah.length > 0) {
      return {
        task: tasks.murajaah[0],
        type: 'murajaah'
      };
    }
    
    return null;
  };

  const handleContinueLearning = (plan) => {
    const nextTask = getNextTask(plan.id);
    if (nextTask && onStartLearning) {
      onStartLearning(nextTask.task, nextTask.type, plan.id);
    } else {
      // If no task but plan is completed, trigger celebration
      checkPlanCompletion(plan.id);
    }
  };

  const getTaskButtonText = (plan) => {
    const nextTask = getNextTask(plan.id);
    const completionStatus = storage.getPlanCompletionStatus(plan.id);
    
    // Check if plan is completed for memorization
    if (completionStatus && completionStatus.completed) {
      return '🎉 Plan Complete!';
    }
    
    if (!nextTask) return 'Plan Complete';
    
    const { task, type } = nextTask;
    const today = new Date().toDateString();
    const taskDate = new Date(task.date).toDateString();
    
    if (type === 'hafazan') {
      // Check if this is progression vs catch-up
      const tasks = storage.getTodayTasks(plan.id);
      if (tasks.canProgress && tasks.nextAyah && 
          task.ayahNumber === tasks.nextAyah.ayahNumber) {
        return `🚀 Next: Ayah ${task.ayahNumber}`;
      } else if (taskDate < today) {
        return `📅 Catch up: Ayah ${task.ayahNumber}`;
      } else {
        return `📖 Continue: Ayah ${task.ayahNumber}`;
      }
    } else {
      // Handle range-based murajaah
      if (task.startAyah && task.endAyah && task.startAyah !== task.endAyah) {
        return `⭐ Review: Ayahs ${task.startAyah}-${task.endAyah}`;
      } else {
        return `⭐ Review: Ayah ${task.ayahNumber || task.startAyah}`;
      }
    }
  };

  const handleCompletionDismiss = () => {
    // Mark plan as completed to avoid showing celebration again
    storage.markPlanCompleted(completionCelebration.planId);
    setCompletionCelebration(null);
    if (refreshData) refreshData();
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
      setCurrentPlan(nextPlan);
    }
  };

  const handleSetActivePlan = (plan) => {
    storage.setActivePlan(plan.id);
    refreshData(); // Refresh to show updated active states
  };

  // Sort plans to show active plan first
  const sortedPlans = [...plans].sort((a, b) => {
    const aIsActive = a.active !== false;
    const bIsActive = b.active !== false;
    
    // Active plans come first
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;
    
    // If both have same active status, maintain original order
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            Memorization Plans
          </h1>
          <p className="text-slate-600 mt-1">Manage your Quran memorization journey</p>
        </div>
        
        <button 
          onClick={onShowPlanCreator}
          className="btn-primary rounded-xl px-6 py-3 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Plan
        </button>
      </motion.div>

      {plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Plans Yet</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Create your first memorization plan to start your Quran memorization journey. 
            Choose a Surah and let us guide you through the process.
          </p>
          <button 
            onClick={onShowPlanCreator}
            className="btn-primary rounded-xl px-8 py-4 font-semibold text-lg flex items-center gap-3 mx-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Your First Plan
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {sortedPlans.map((plan, index) => {
            const progress = getProgress(plan.id);
            const isActive = plan.active !== false;
            
            return (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={clsx(
                  "glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 group",
                  isActive && "ring-2 ring-emerald-400 shadow-emerald-100/50"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isActive && (
                        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          Active Plan
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-slate-800">
                        {plan.surahName}
                      </h3>
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        isActive 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-slate-600 arabic-text-xl leading-relaxed">
                      {plan.surahNameArabic}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary-600">
                      {progress.percentage.toFixed(0)}%
                    </div>
                    <div className="text-sm text-slate-500">Complete</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>{progress.completed} of {progress.total} ayahs memorized</span>
                    <span>{progress.total - progress.completed} remaining</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {progress.completed}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Memorized</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">
                      {plan.ayahsPerDay}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">Per Day</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {Math.ceil(plan.totalAyahs / plan.ayahsPerDay)}
                    </div>
                    <div className="text-xs text-amber-600 font-medium">Total Days</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {plan.totalAyahs}
                    </div>
                    <div className="text-xs text-purple-600 font-medium">Total Ayahs</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Started</div>
                        <div className="text-slate-600">{formatDate(plan.startDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">Target Completion</div>
                        <div className="text-slate-600">{getEstimatedCompletion(plan)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => setCurrentPlan(plan)}
                    className="flex-1 btn-secondary rounded-lg py-2 px-4 font-medium text-sm"
                  >
                    View Details
                  </button>
                  {isActive ? (
                    <button 
                      onClick={() => handleContinueLearning(plan)}
                      className="flex-1 btn-primary rounded-lg py-2 px-4 font-medium text-sm"
                    >
                      {getTaskButtonText(plan)}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSetActivePlan(plan)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 px-4 font-medium text-sm transition-colors"
                    >
                      📍 Set as Active Plan
                    </button>
                  )}
                  <button className="btn-secondary rounded-lg py-2 px-4 font-medium text-sm">
                    Settings
                  </button>
                  {/* Temporary debug button */}
                  {progress.percentage === 100 && (
                    <button 
                      onClick={() => checkPlanCompletion(plan.id)}
                      className="btn-secondary rounded-lg py-2 px-4 font-medium text-sm bg-yellow-100 text-yellow-800"
                    >
                      Test Completion
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Plan Completion Celebration Modal */}
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