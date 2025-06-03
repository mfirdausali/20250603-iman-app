import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { quranAPI } from '../utils/api';

export function useMemorization() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [todayAyah, setTodayAyah] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      findTodayAyah();
    }
  }, [plans]);

  const loadPlans = () => {
    try {
      const savedPlans = storage.getPlans();
      setPlans(savedPlans);
      if (savedPlans.length > 0) {
        setCurrentPlan(savedPlans[0]);
      }
    } catch (err) {
      setError('Failed to load memorization plans');
    }
  };

  const findTodayAyah = () => {
    const today = new Date();
    const activePlan = plans.find(plan => plan.active !== false);
    
    if (!activePlan) return;

    const schedule = activePlan.schedule || [];
    const todaySchedule = schedule.find(item => 
      new Date(item.date).toDateString() === today.toDateString()
    );

    if (todaySchedule && !storage.isAyahCompleted(activePlan.id, todaySchedule.surahNumber, todaySchedule.ayahNumber, today)) {
      setTodayAyah({
        planId: activePlan.id,
        surahNumber: todaySchedule.surahNumber,
        ayahNumber: todaySchedule.ayahNumber,
        surahName: activePlan.surahName
      });
    } else {
      setTodayAyah(null);
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
        active: true
      };

      const savedPlan = storage.addPlan(plan);
      setPlans(prev => [...prev, savedPlan]);
      setCurrentPlan(savedPlan);
      findTodayAyah();
      
      return savedPlan;
    } catch (err) {
      setError('Failed to create memorization plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAyahCompleted = (planId, surahNumber, ayahNumber) => {
    storage.markAyahCompleted(planId, surahNumber, ayahNumber);
    findTodayAyah();
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
          completed: storage.isAyahCompleted(planId, item.surahNumber, item.ayahNumber, date)
        });
      }
    });

    return calendarData;
  };

  return {
    plans,
    currentPlan,
    todayAyah,
    loading,
    error,
    createPlan,
    markAyahCompleted,
    getProgress,
    getCalendarData,
    setCurrentPlan
  };
}