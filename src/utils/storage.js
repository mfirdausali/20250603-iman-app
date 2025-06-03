const STORAGE_KEYS = {
  MEMORIZATION_PLANS: 'hafazan_plans',
  PROGRESS: 'hafazan_progress',
  SETTINGS: 'hafazan_settings',
  MURAJAAH: 'hafazan_murajaah',
  ACTIVITIES: 'hafazan_activities'
};

export const storage = {
  getPlans() {
    const plans = localStorage.getItem(STORAGE_KEYS.MEMORIZATION_PLANS);
    return plans ? JSON.parse(plans) : [];
  },

  savePlans(plans) {
    localStorage.setItem(STORAGE_KEYS.MEMORIZATION_PLANS, JSON.stringify(plans));
  },

  getProgress() {
    const progress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return progress ? JSON.parse(progress) : {};
  },

  saveProgress(progress) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  },

  getMurajaahData() {
    const murajaah = localStorage.getItem(STORAGE_KEYS.MURAJAAH);
    return murajaah ? JSON.parse(murajaah) : {};
  },

  saveMurajaahData(murajaah) {
    localStorage.setItem(STORAGE_KEYS.MURAJAAH, JSON.stringify(murajaah));
  },

  getSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default settings
    return {
      hafazan: {
        visibleSets: 3,
        repetitionsPerVisibleSet: 2,
        hiddenSets: 2,
        repetitionsPerHiddenSet: 1
      },
      murajaah: {
        visibleSets: 1,
        repetitionsPerVisibleSet: 1,
        hiddenSets: 1,
        repetitionsPerHiddenSet: 1
      },
      general: {
        autoPlayAudio: true,
        showAudioPlayer: true,
        showTransliteration: true,
        showTranslation: true,
        enableMurajaah: true,
        murajaahFrequency: 7,
        murajaahRangeSize: 5
      }
    };
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  addPlan(plan) {
    const plans = this.getPlans();
    const newPlan = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      active: true, // New plans are active by default
      ...plan
    };
    
    // If this is not the first plan, mark it as active and others as inactive
    // This ensures focused learning on one plan at a time
    if (plans.length > 0) {
      plans.forEach(p => p.active = false);
    }
    
    plans.push(newPlan);
    this.savePlans(plans);
    return newPlan;
  },

  // Set a plan as the active/primary plan for focused memorization
  setActivePlan(planId) {
    const plans = this.getPlans();
    
    // Mark all plans as inactive first
    plans.forEach(plan => plan.active = false);
    
    // Mark the selected plan as active
    const targetPlan = plans.find(p => p.id === planId);
    if (targetPlan) {
      targetPlan.active = true;
      this.savePlans(plans);
      return targetPlan;
    }
    return null;
  },

  updatePlan(planId, updates) {
    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === planId);
    if (index !== -1) {
      plans[index] = { ...plans[index], ...updates };
      this.savePlans(plans);
      return plans[index];
    }
    return null;
  },

  deletePlan(planId) {
    const plans = this.getPlans();
    const filtered = plans.filter(p => p.id !== planId);
    this.savePlans(filtered);
  },

  // Mark ayah as memorized (hafazan complete)
  markAyahMemorized(planId, surahNumber, ayahNumber, date = new Date()) {
    const progress = this.getProgress();
    const key = `${planId}_${surahNumber}_${ayahNumber}`;
    progress[key] = {
      memorized: true,
      memorizedAt: date.toISOString(),
      date: date.toDateString(),
      type: 'hafazan'
    };
    this.saveProgress(progress);
    
    // Schedule range-based murajaah instead of individual ayah
    this.scheduleRangeMurajaah(planId, surahNumber, ayahNumber, date);
  },

  // Schedule range-based murajaah when an ayah is memorized
  scheduleRangeMurajaah(planId, surahNumber, ayahNumber, date = new Date()) {
    // Get all memorized ranges for this plan
    const ranges = this.createMurajaahRanges(planId);
    
    // Find the range that contains this ayah
    const containingRange = ranges.find(range => 
      range.surahNumber === surahNumber && 
      ayahNumber >= range.startAyah && 
      ayahNumber <= range.endAyah
    );

    if (!containingRange) return;

    // Schedule murajaah for the entire range
    const settings = this.getSettings();
    const murajaahDate = new Date(date.getTime() + (settings.general.murajaahFrequency * 24 * 60 * 60 * 1000));
    
    this.scheduleMurajaahRange(planId, surahNumber, containingRange.startAyah, containingRange.endAyah, murajaahDate);
  },

  // Mark murajaah session complete
  markMurajaahComplete(planId, surahNumber, ayahNumber, date = new Date()) {
    const murajaahData = this.getMurajaahData();
    const key = `${planId}_${surahNumber}_${ayahNumber}`;
    
    if (!murajaahData[key]) {
      murajaahData[key] = { sessions: [] };
    }
    
    murajaahData[key].sessions.push({
      completedAt: date.toISOString(),
      date: date.toDateString()
    });
    
    this.saveMurajaahData(murajaahData);
    
    // Schedule next murajaah
    const settings = this.getSettings();
    const nextDate = new Date(date.getTime() + (settings.general.murajaahFrequency * 24 * 60 * 60 * 1000));
    this.scheduleMurajaah(planId, surahNumber, ayahNumber, nextDate);
  },

  // Helper function to find consecutive memorized ayah ranges
  getMemorizedAyahRanges(planId) {
    const completedAyahs = this.getCompletedAyahs(planId)
      .filter(ayah => ayah.memorized)
      .sort((a, b) => a.ayahNumber - b.ayahNumber);

    if (completedAyahs.length === 0) return [];

    const ranges = [];
    let currentRange = {
      surahNumber: completedAyahs[0].surahNumber,
      startAyah: completedAyahs[0].ayahNumber,
      endAyah: completedAyahs[0].ayahNumber,
      ayahs: [completedAyahs[0]]
    };

    for (let i = 1; i < completedAyahs.length; i++) {
      const current = completedAyahs[i];
      const previous = completedAyahs[i - 1];

      // If consecutive ayah in same surah, extend the range
      if (current.surahNumber === previous.surahNumber && 
          current.ayahNumber === previous.ayahNumber + 1) {
        currentRange.endAyah = current.ayahNumber;
        currentRange.ayahs.push(current);
      } else {
        // Start a new range
        ranges.push(currentRange);
        currentRange = {
          surahNumber: current.surahNumber,
          startAyah: current.ayahNumber,
          endAyah: current.ayahNumber,
          ayahs: [current]
        };
      }
    }
    
    // Add the last range
    ranges.push(currentRange);
    
    return ranges;
  },

  // Create optimal murajaah ranges (group ranges with similar memorization dates)
  createMurajaahRanges(planId, maxRangeSize = null) {
    const settings = this.getSettings();
    const rangeSize = maxRangeSize || settings.general.murajaahRangeSize || 5;
    
    const ranges = this.getMemorizedAyahRanges(planId);
    const murajaahRanges = [];

    ranges.forEach(range => {
      const currentRangeSize = range.endAyah - range.startAyah + 1;
      
      // If range is small enough, use as-is
      if (currentRangeSize <= rangeSize) {
        murajaahRanges.push(range);
      } else {
        // Split large ranges into smaller chunks
        for (let start = range.startAyah; start <= range.endAyah; start += rangeSize) {
          const end = Math.min(start + rangeSize - 1, range.endAyah);
          const chunkAyahs = range.ayahs.filter(
            ayah => ayah.ayahNumber >= start && ayah.ayahNumber <= end
          );
          
          murajaahRanges.push({
            surahNumber: range.surahNumber,
            startAyah: start,
            endAyah: end,
            ayahs: chunkAyahs
          });
        }
      }
    });

    return murajaahRanges;
  },

  scheduleMurajaah(planId, surahNumber, ayahNumber, date) {
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!plan.murajaahSchedule) {
      plan.murajaahSchedule = [];
    }

    // Instead of scheduling individual ayahs, we'll create range-based reviews
    // This will be called from the batch scheduling function
    const ranges = this.createMurajaahRanges(planId);
    
    // Find which range this ayah belongs to
    const targetRange = ranges.find(range => 
      range.surahNumber === surahNumber && 
      ayahNumber >= range.startAyah && 
      ayahNumber <= range.endAyah
    );

    if (!targetRange) return;

    // Remove existing future murajaah for this range
    plan.murajaahSchedule = plan.murajaahSchedule.filter(
      item => !(item.surahNumber === surahNumber && 
               item.startAyah === targetRange.startAyah && 
               item.endAyah === targetRange.endAyah &&
               new Date(item.date) > new Date())
    );

    // Add new murajaah session for the entire range
    plan.murajaahSchedule.push({
      date: date.toISOString(),
      surahNumber: targetRange.surahNumber,
      startAyah: targetRange.startAyah,
      endAyah: targetRange.endAyah,
      type: 'murajaah',
      rangeId: `${planId}_${targetRange.surahNumber}_${targetRange.startAyah}_${targetRange.endAyah}`
    });

    this.updatePlan(planId, plan);
  },

  // New function to handle range-based murajaah completion
  markMurajaahRangeComplete(planId, surahNumber, startAyah, endAyah, date = new Date()) {
    const murajaahData = this.getMurajaahData();
    const rangeKey = `${planId}_${surahNumber}_${startAyah}_${endAyah}`;
    
    if (!murajaahData[rangeKey]) {
      murajaahData[rangeKey] = { sessions: [] };
    }
    
    murajaahData[rangeKey].sessions.push({
      completedAt: date.toISOString(),
      date: date.toDateString(),
      startAyah,
      endAyah
    });
    
    this.saveMurajaahData(murajaahData);
    
    // Schedule next murajaah for the range
    const settings = this.getSettings();
    const nextDate = new Date(date.getTime() + (settings.general.murajaahFrequency * 24 * 60 * 60 * 1000));
    this.scheduleMurajaahRange(planId, surahNumber, startAyah, endAyah, nextDate);
  },

  // Schedule murajaah for a specific range
  scheduleMurajaahRange(planId, surahNumber, startAyah, endAyah, date) {
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!plan.murajaahSchedule) {
      plan.murajaahSchedule = [];
    }

    // Remove existing future murajaah for this range
    plan.murajaahSchedule = plan.murajaahSchedule.filter(
      item => !(item.surahNumber === surahNumber && 
               item.startAyah === startAyah && 
               item.endAyah === endAyah &&
               new Date(item.date) > new Date())
    );

    // Add new murajaah session for the range
    plan.murajaahSchedule.push({
      date: date.toISOString(),
      surahNumber,
      startAyah,
      endAyah,
      type: 'murajaah',
      rangeId: `${planId}_${surahNumber}_${startAyah}_${endAyah}`
    });

    this.updatePlan(planId, plan);
  },

  // Get murajaah history for a range
  getMurajaahRangeHistory(planId, surahNumber, startAyah, endAyah) {
    const murajaahData = this.getMurajaahData();
    const rangeKey = `${planId}_${surahNumber}_${startAyah}_${endAyah}`;
    return murajaahData[rangeKey] || { sessions: [] };
  },

  // Legacy function for backward compatibility with single-ayah murajaah
  getMurajaahHistory(planId, surahNumber, ayahNumber) {
    const murajaahData = this.getMurajaahData();
    const key = `${planId}_${surahNumber}_${ayahNumber}`;
    return murajaahData[key] || { sessions: [] };
  },

  isAyahMemorized(planId, surahNumber, ayahNumber) {
    const progress = this.getProgress();
    const key = `${planId}_${surahNumber}_${ayahNumber}`;
    const ayahProgress = progress[key];
    return ayahProgress && ayahProgress.memorized;
  },

  getTodayTasks(planId, date = new Date()) {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan) return { hafazan: [], murajaah: [], completedHafazan: [], completedMurajaah: [], canProgress: false };

    const today = date.toDateString();
    const tasks = { hafazan: [], murajaah: [], completedHafazan: [], completedMurajaah: [], canProgress: false };

    // Check hafazan schedule - include overdue tasks from previous days
    if (plan.schedule) {
      const pendingHafazan = plan.schedule.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= date && !this.isAyahMemorized(planId, item.surahNumber, item.ayahNumber);
      });
      
      // Get the earliest pending hafazan (could be from today or previous days)
      if (pendingHafazan.length > 0) {
        const nextHafazan = pendingHafazan.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        tasks.hafazan.push(nextHafazan);
      }

      // Get completed hafazan for today
      const todayCompletedHafazan = plan.schedule.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === today && 
               this.isAyahMemorized(planId, item.surahNumber, item.ayahNumber);
      });
      tasks.completedHafazan.push(...todayCompletedHafazan.map(item => ({
        ...item,
        completed: true,
        completedAt: this.getAyahCompletionDate(planId, item.surahNumber, item.ayahNumber)
      })));

      // Check if today's hafazan is complete and user can progress to tomorrow's
      if (pendingHafazan.length === 0) {
        // Find next unmemorized ayah (future ayahs only)
        const nextUnmemorized = plan.schedule.find(item => 
          new Date(item.date) > date && !this.isAyahMemorized(planId, item.surahNumber, item.ayahNumber)
        );
        
        if (nextUnmemorized) {
          tasks.canProgress = true;
          tasks.nextAyah = nextUnmemorized;
        }
      }
    }

    // Check murajaah schedule - only for today (flexible individual scheduling)
    if (plan.murajaahSchedule) {
      const todayMurajaah = plan.murajaahSchedule.filter(item => 
        new Date(item.date).toDateString() === today
      );
      
      // For murajaah, we need to check if they were actually completed today
      // vs just being available for review
      const pendingMurajaah = [];
      const completedMurajaah = [];
      
      todayMurajaah.forEach(item => {
        // Handle both old single-ayah and new range-based murajaah
        if (item.startAyah && item.endAyah) {
          // Range-based murajaah
          const history = this.getMurajaahRangeHistory(planId, item.surahNumber, item.startAyah, item.endAyah);
          const todaySession = history.sessions.find(session => 
            new Date(session.completedAt).toDateString() === today
          );
          
          if (todaySession) {
            completedMurajaah.push({
              ...item,
              completed: true,
              completedAt: todaySession.completedAt
            });
          } else {
            pendingMurajaah.push(item);
          }
        } else {
          // Legacy single-ayah murajaah (for backward compatibility)
          const history = this.getMurajaahHistory(planId, item.surahNumber, item.ayahNumber);
          const todaySession = history.sessions.find(session => 
            new Date(session.completedAt).toDateString() === today
          );
          
          if (todaySession) {
            completedMurajaah.push({
              ...item,
              completed: true,
              completedAt: todaySession.completedAt
            });
          } else {
            pendingMurajaah.push(item);
          }
        }
      });
      
      tasks.murajaah.push(...pendingMurajaah);
      tasks.completedMurajaah.push(...completedMurajaah);
    }

    return tasks;
  },

  // Helper method to get when an ayah was completed
  getAyahCompletionDate(planId, surahNumber, ayahNumber) {
    const progress = this.getProgress();
    const key = `${planId}_${surahNumber}_${ayahNumber}`;
    const ayahProgress = progress[key];
    return ayahProgress ? ayahProgress.memorizedAt : null;
  },

  getCompletedAyahs(planId) {
    const progress = this.getProgress();
    return Object.entries(progress)
      .filter(([key]) => key.startsWith(`${planId}_`))
      .map(([key, value]) => ({
        key,
        ...value,
        surahNumber: parseInt(key.split('_')[1]),
        ayahNumber: parseInt(key.split('_')[2])
      }));
  },

  getStreakData(planId) {
    const progress = this.getProgress();
    const completedDates = Object.values(progress)
      .filter(p => p.memorized)
      .map(p => new Date(p.date))
      .sort((a, b) => b - a);

    if (completedDates.length === 0) return { current: 0, longest: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Check current streak
    if (completedDates[0].toDateString() === today.toDateString() ||
        completedDates[0].toDateString() === yesterday.toDateString()) {
      currentStreak = 1;
      
      for (let i = 1; i < completedDates.length; i++) {
        const current = completedDates[i - 1];
        const previous = completedDates[i];
        const diffDays = Math.floor((current - previous) / (24 * 60 * 60 * 1000));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < completedDates.length; i++) {
      const current = completedDates[i - 1];
      const previous = completedDates[i];
      const diffDays = Math.floor((current - previous) / (24 * 60 * 60 * 1000));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  },

  // Check if a plan is completed
  isPlanCompleted(planId) {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan) return false;

    const completedAyahs = this.getCompletedAyahs(planId);
    return completedAyahs.length >= plan.totalAyahs;
  },

  // Get plan completion details
  getPlanCompletionStatus(planId) {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan) return null;

    const completedAyahs = this.getCompletedAyahs(planId);
    const isCompleted = completedAyahs.length >= plan.totalAyahs;
    
    if (!isCompleted) {
      return { 
        completed: false, 
        progress: completedAyahs.length,
        total: plan.totalAyahs 
      };
    }

    // Find completion date (last ayah memorized)
    const lastAyah = completedAyahs
      .sort((a, b) => new Date(b.memorizedAt) - new Date(a.memorizedAt))[0];
    const completionDate = new Date(lastAyah.memorizedAt);

    // Calculate original end date
    const lastScheduledItem = plan.schedule[plan.schedule.length - 1];
    const originalEndDate = new Date(lastScheduledItem.date);

    // Determine if completed early
    const daysEarly = Math.ceil((originalEndDate - completionDate) / (24 * 60 * 60 * 1000));
    const completedEarly = daysEarly > 0;

    return {
      completed: true,
      completionDate: completionDate.toISOString(),
      originalEndDate: originalEndDate.toISOString(),
      daysEarly: completedEarly ? daysEarly : 0,
      completedEarly,
      totalAyahs: plan.totalAyahs,
      surahName: plan.surahName
    };
  },

  // Mark plan as completed (with celebration tracking)
  markPlanCompleted(planId, completionDate = new Date()) {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan) return false;

    const completionStatus = this.getPlanCompletionStatus(planId);
    if (!completionStatus.completed) return false;

    // Update plan with completion data
    this.updatePlan(planId, {
      status: 'completed',
      completedAt: completionDate.toISOString(),
      daysEarly: completionStatus.daysEarly,
      completedEarly: completionStatus.completedEarly,
      active: false // Mark as inactive but keep for history
    });

    return completionStatus;
  },

  // Get suggested next steps after plan completion
  getNextStepSuggestions(planId) {
    const completionStatus = this.getPlanCompletionStatus(planId);
    if (!completionStatus.completed) return null;

    const plans = this.getPlans();
    const activePlans = plans.filter(p => p.active !== false && p.id !== planId);

    return {
      canCreateNewPlan: true,
      hasOtherActivePlans: activePlans.length > 0,
      suggestedSurahs: this.getSuggestedNextSurahs(planId),
      murajaahContinues: true,
      achievementLevel: this.calculateAchievementLevel(completionStatus)
    };
  },

  // Calculate achievement level based on completion
  calculateAchievementLevel(completionStatus) {
    if (completionStatus.daysEarly >= 14) return 'exceptional'; // 2+ weeks early
    if (completionStatus.daysEarly >= 7) return 'excellent';    // 1+ week early
    if (completionStatus.daysEarly >= 3) return 'great';        // 3+ days early
    if (completionStatus.daysEarly >= 1) return 'good';         // Any days early
    return 'completed'; // On time
  },

  // Suggest next Surahs based on completion
  getSuggestedNextSurahs(planId) {
    const plan = this.getPlans().find(p => p.id === planId);
    if (!plan) return [];

    // Logic for suggesting next Surahs
    // Could be based on length, theme, or user preference
    const suggestions = [];
    
    // If they completed a short Surah, suggest medium
    if (plan.totalAyahs <= 10) {
      suggestions.push(
        { number: 2, name: 'Al-Baqarah', reason: 'Next challenge: The longest Surah' },
        { number: 18, name: 'Al-Kahf', reason: 'Popular Friday recitation' },
        { number: 36, name: 'Ya-Sin', reason: 'Heart of the Quran' }
      );
    } else if (plan.totalAyahs <= 50) {
      suggestions.push(
        { number: 67, name: 'Al-Mulk', reason: 'Protection from grave punishment' },
        { number: 55, name: 'Ar-Rahman', reason: 'The Most Merciful' }
      );
    } else {
      // They completed a long Surah, suggest shorter ones for variety
      suggestions.push(
        { number: 112, name: 'Al-Ikhlas', reason: 'Equal to 1/3 of Quran' },
        { number: 113, name: 'Al-Falaq', reason: 'Protection from evil' },
        { number: 114, name: 'An-Nas', reason: 'Protection from whispers' }
      );
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  },

  // Activity tracking
  addActivity(activityData) {
    const activities = this.getActivities();
    const newActivity = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...activityData
    };
    
    activities.push(newActivity);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    return newActivity;
  },

  getActivities() {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return saved ? JSON.parse(saved) : [];
  },

  updateActivity(activityId, updates) {
    const activities = this.getActivities();
    const index = activities.findIndex(a => a.id === activityId);
    
    if (index !== -1) {
      activities[index] = { ...activities[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      return activities[index];
    }
    
    return null;
  }
};