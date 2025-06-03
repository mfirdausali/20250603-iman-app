import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import CalendarView from '../components/CalendarView';

export default function CalendarPage({ 
  plans, 
  currentPlan, 
  getCalendarData, 
  setCurrentPlan,
  onNavigate
}) {
  // Find the active plan for display
  const activePlan = plans.find(p => p.active !== false) || plans[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <CalendarIcon className="w-6 h-6" />
              </div>
              Calendar View
            </h1>
            <p className="text-slate-600 mt-1">Track your daily memorization schedule</p>
            {activePlan && (
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-slate-500">
                  Currently memorizing: <span className="font-medium text-slate-700">{activePlan.surahName}</span>
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
          
          {plans.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Select Plan:</label>
              <select 
                value={currentPlan?.id || ''}
                onChange={(e) => {
                  const plan = plans.find(p => p.id === e.target.value);
                  setCurrentPlan(plan);
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.surahName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Calendar Content */}
      {!currentPlan ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Plan Selected</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Please select a memorization plan to view the calendar and track your daily progress.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CalendarView 
            planId={currentPlan.id}
            getCalendarData={getCalendarData}
          />
        </motion.div>
      )}
    </div>
  );
}