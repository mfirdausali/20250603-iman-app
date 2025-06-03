import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, BarChart3, Settings as SettingsIcon, Plus, Activity } from 'lucide-react';
import { storage } from './utils/storage';
import { quranAPI } from './utils/api';
import HomePage from './pages/HomePage';
import PlansPage from './pages/PlansPage';
import CalendarPage from './pages/CalendarPage';
import ActivityPage from './pages/ActivityPage';
import Settings from './components/Settings';
import PlanCreator from './components/PlanCreator';
import AyahSession from './components/AyahSession';
import clsx from 'clsx';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showPlanCreator, setShowPlanCreator] = useState(false);
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    try {
      setLoading(true);
      const savedPlans = storage.getPlans();
      setPlans(savedPlans);
      if (savedPlans.length > 0) {
        const activePlan = savedPlans.find(p => p.active !== false) || savedPlans[0];
        setCurrentPlan(activePlan);
      }
    } catch (err) {
      setError('Failed to load memorization plans');
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (surahNumber, startDate, ayahsPerDay = 1) => {
    try {
      setLoading(true);
      const surah = await quranAPI.getSurah(surahNumber);
      
      const schedule = [];
      let currentDate = new Date(startDate);
      
      for (let ayahNumber = 1; ayahNumber <= surah.numberOfAyahs; ayahNumber += ayahsPerDay) {
        for (let i = 0; i < ayahsPerDay && (ayahNumber + i) <= surah.numberOfAyahs; i++) {
          schedule.push({
            date: new Date(currentDate).toISOString(),
            surahNumber: surahNumber,
            ayahNumber: ayahNumber + i
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const plan = {
        surahNumber,
        surahName: surah.englishName,
        surahNameArabic: surah.name,
        startDate: startDate.toISOString(),
        ayahsPerDay,
        totalAyahs: surah.numberOfAyahs,
        schedule,
        murajaahSchedule: [],
        active: true
      };

      const savedPlan = storage.addPlan(plan);
      setPlans(prev => [...prev, savedPlan]);
      setCurrentPlan(savedPlan);
      
      return savedPlan;
    } catch (err) {
      setError('Failed to create memorization plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return { completed: 0, total: 0, percentage: 0 };

    const completed = storage.getCompletedAyahs(planId).length;
    const total = plan.totalAyahs;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  };

  const getCalendarData = (planId, month, year) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return {};

    const calendarData = {};
    
    // Add hafazan schedule
    plan.schedule.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const day = date.getDate();
        if (!calendarData[day]) {
          calendarData[day] = [];
        }
        calendarData[day].push({
          surahNumber: item.surahNumber,
          ayahNumber: item.ayahNumber,
          type: 'hafazan',
          completed: storage.isAyahMemorized(planId, item.surahNumber, item.ayahNumber)
        });
      }
    });

    // Add murajaah schedule
    if (plan.murajaahSchedule) {
      plan.murajaahSchedule.forEach(item => {
        const date = new Date(item.date);
        if (date.getMonth() === month && date.getFullYear() === year) {
          const day = date.getDate();
          if (!calendarData[day]) {
            calendarData[day] = [];
          }
          
          // Handle both range-based and single ayah murajaah
          if (item.startAyah && item.endAyah) {
            // Range-based murajaah
            calendarData[day].push({
              surahNumber: item.surahNumber,
              startAyah: item.startAyah,
              endAyah: item.endAyah,
              type: 'murajaah',
              completed: false // TODO: Track murajaah completion
            });
          } else {
            // Legacy single ayah murajaah
            calendarData[day].push({
              surahNumber: item.surahNumber,
              ayahNumber: item.ayahNumber,
              type: 'murajaah',
              completed: false // TODO: Track murajaah completion
            });
          }
        }
      });
    }

    return calendarData;
  };

  const handleCreatePlan = async (surahNumber, startDate, ayahsPerDay) => {
    await createPlan(surahNumber, startDate, ayahsPerDay);
    setShowPlanCreator(false);
  };

  const handleStartLearning = (task, sessionType, planId) => {
    setCurrentSession({
      surahNumber: task.surahNumber,
      ayahNumber: task.ayahNumber,
      startAyah: task.startAyah,
      endAyah: task.endAyah,
      sessionType: sessionType,
      planId: planId
    });
  };

  const handleContinueSession = (sessionData) => {
    setCurrentSession({
      surahNumber: sessionData.surahNumber,
      ayahNumber: sessionData.ayahNumber,
      startAyah: sessionData.startAyah,
      endAyah: sessionData.endAyah,
      sessionType: sessionData.sessionType,
      planId: sessionData.planId,
      resumeData: sessionData.resumeData || null
    });
  };

  const handleSessionComplete = () => {
    setCurrentSession(null);
    loadPlans(); // Refresh data
  };

  const refreshData = () => {
    loadPlans();
  };

  // If there's an active session, show the session view
  if (currentSession) {
    return (
      <div className="min-h-screen">
        <nav className="glass-card border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">Hafazan</h1>
              </motion.div>
              
              <button
                onClick={() => setCurrentSession(null)}
                className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </nav>
        
        <main className="max-w-4xl mx-auto px-4 py-6">
          <AyahSession
            surahNumber={currentSession.surahNumber}
            ayahNumber={currentSession.ayahNumber}
            startAyah={currentSession.startAyah}
            endAyah={currentSession.endAyah}
            sessionType={currentSession.sessionType}
            planId={currentSession.planId}
            resumeData={currentSession.resumeData}
            onComplete={handleSessionComplete}
          />
        </main>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage 
            plans={plans}
            getProgress={getProgress}
            onShowPlanCreator={() => setShowPlanCreator(true)}
            refreshData={refreshData}
            onNavigate={setActiveTab}
          />
        );
      case 'plans':
        return (
          <PlansPage 
            plans={plans}
            getProgress={getProgress}
            onShowPlanCreator={() => setShowPlanCreator(true)}
            setCurrentPlan={setCurrentPlan}
            onStartLearning={handleStartLearning}
            refreshData={refreshData}
          />
        );
      case 'calendar':
        return (
          <CalendarPage 
            plans={plans}
            currentPlan={currentPlan}
            getCalendarData={getCalendarData}
            setCurrentPlan={setCurrentPlan}
            onNavigate={setActiveTab}
          />
        );
      case 'activity':
        return <ActivityPage onStartSession={handleContinueSession} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Hafazan...</p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'plans', label: 'Plans', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-card border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Hafazan</h1>
            </motion.div>
            
            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveTab(item.id)}
                    className={clsx(
                      'nav-item',
                      activeTab === item.id && 'active'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Add Button */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowPlanCreator(true)}
              className="btn-primary rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Plan</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 pt-4"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
              {error}
            </div>
          </motion.div>
        )}
        
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>

      {/* Modals */}
      {showPlanCreator && (
        <PlanCreator 
          onCreatePlan={handleCreatePlan}
          onClose={() => setShowPlanCreator(false)}
          existingPlans={plans}
        />
      )}
    </div>
  );
}

export default App;