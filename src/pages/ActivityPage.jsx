import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Clock, RotateCcw, CheckCircle, AlertCircle, Calendar, Filter, Play } from 'lucide-react';
import { storage } from '../utils/storage';
import clsx from 'clsx';

const SURAH_NAMES = {
  1: 'Al-Fatihah',
  2: 'Al-Baqarah',
  3: 'Āl \'Imran',
  4: 'An-Nisa',
  5: 'Al-Ma\'idah',
  6: 'Al-An\'am',
  7: 'Al-A\'raf',
  8: 'Al-Anfal',
  9: 'At-Tawbah',
  10: 'Yunus',
  11: 'Hud',
  12: 'Yusuf',
  13: 'Ar-Ra\'d',
  14: 'Ibrahim',
  15: 'Al-Hijr',
  16: 'An-Nahl',
  17: 'Al-Israa',
  18: 'Al-Kahf',
  19: 'Maryam',
  20: 'Ta-Ha',
  21: 'Al-Anbiya',
  22: 'Al-Hajj',
  23: 'Al-Mu\'minun',
  24: 'An-Nur',
  25: 'Al-Furqan',
  26: 'Ash-Shu\'ara',
  27: 'An-Naml',
  28: 'Al-Qasas',
  29: 'Al-Ankabut',
  30: 'Ar-Rum',
  31: 'Luqmaan',
  32: 'As-Sajdah',
  33: 'Al-Ahzaab',
  34: 'Saba',
  35: 'Faatir',
  36: 'Ya-Sin',
  37: 'As-Saaffaat',
  38: 'Saad',
  39: 'Az-Zumar',
  40: 'Ghafir',
  41: 'Fussilat',
  42: 'Ash-Shura',
  43: 'Az-Zukhruf',
  44: 'Ad-Dukhaan',
  45: 'Al-Jaathiyah',
  46: 'Al-Ahqaaf',
  47: 'Muhammad',
  48: 'Al-Fath',
  49: 'Al-Hujuraat',
  50: 'Qaaf',
  51: 'Adh-Dhaariyaat',
  52: 'At-Toor',
  53: 'An-Najm',
  54: 'Al-Qamar',
  55: 'Ar-Rahman',
  56: 'Al-Waqi\'ah',
  57: 'Al-Hadeed',
  58: 'Al-Mujadila',
  59: 'Al-Hashr',
  60: 'Al-Mumtahanah',
  61: 'As-Saff',
  62: 'Al-Jumu\'ah',
  63: 'Al-Munafiqoon',
  64: 'At-Taghabun',
  65: 'At-Talaq',
  66: 'At-Tahreem',
  67: 'Al-Mulk',
  68: 'Al-Qalam',
  69: 'Al-Haaqqa',
  70: 'Al-Ma\'aarij',
  71: 'Nuh',
  72: 'Al-Jinn',
  73: 'Al-Muzzammil',
  74: 'Al-Muddaththir',
  75: 'Al-Qiyamah',
  76: 'Al-Insaan',
  77: 'Al-Mursalaat',
  78: 'An-Naba\'',
  79: 'An-Naazi\'aat',
  80: 'Abasa',
  81: 'At-Takweer',
  82: 'Al-Infitar',
  83: 'Al-Mutaffifeen',
  84: 'Al-Inshiqaaq',
  85: 'Al-Burooj',
  86: 'At-Taariq',
  87: 'Al-A\'la',
  88: 'Al-Ghaashiyah',
  89: 'Al-Fajr',
  90: 'Al-Balad',
  91: 'Ash-Shams',
  92: 'Al-Layl',
  93: 'Ad-Dhuha',
  94: 'Ash-Sharh',
  95: 'At-Tin',
  96: 'Al-Alaq',
  97: 'Al-Qadr',
  98: 'Al-Bayyinah',
  99: 'Az-Zalzalah',
  100: 'Al-\'Aadiyat',
  101: 'Al-Qaari\'ah',
  102: 'At-Takaathur',
  103: 'Al-\'Asr',
  104: 'Al-Humazah',
  105: 'Al-Feel',
  106: 'Quraish',
  107: 'Al-Maa\'oon',
  108: 'Al-Kawthar',
  109: 'Al-Kaafiroon',
  110: 'An-Nasr',
  111: 'Al-Masad',
  112: 'Al-Ikhlas',
  113: 'Al-Falaq',
  114: 'An-Naas'
};

export default function ActivityPage({ onStartSession }) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, filter]);

  const loadActivities = () => {
    try {
      const activityData = storage.getActivities();
      setActivities(activityData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;
    
    if (filter === 'hafazan') {
      filtered = activities.filter(activity => activity.sessionType === 'hafazan');
    } else if (filter === 'murajaah') {
      filtered = activities.filter(activity => activity.sessionType === 'murajaah');
    } else if (filter === 'completed') {
      filtered = activities.filter(activity => activity.completed);
    } else if (filter === 'incomplete') {
      filtered = activities.filter(activity => !activity.completed);
    }
    
    setFilteredActivities(filtered);
  };

  const handleContinueSession = (activity) => {
    if (!onStartSession) {
      console.warn('onStartSession prop not provided to ActivityPage');
      return;
    }

    // Create session data from activity with resume information
    const sessionData = {
      surahNumber: activity.surahNumber,
      ayahNumber: activity.ayahNumber,
      startAyah: activity.startAyah,
      endAyah: activity.endAyah,
      sessionType: activity.sessionType,
      planId: activity.planId,
      resumeData: {
        activityId: activity.id,
        completedReps: activity.completedReps || 0,
        totalReps: activity.totalReps,
        previousDuration: activity.duration || 0
      }
    };

    onStartSession(sessionData);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusBadge = (activity) => {
    if (activity.completed) {
      return (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-3 h-3" />
          Complete
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <AlertCircle className="w-3 h-3" />
          Incomplete
        </div>
      );
    }
  };

  const getTypeIcon = (sessionType) => {
    if (sessionType === 'hafazan') {
      return <BookOpen className="w-4 h-4 text-primary-500" />;
    } else {
      return <Star className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStats = () => {
    const totalSessions = activities.length;
    const completedSessions = activities.filter(a => a.completed).length;
    const totalTime = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const avgTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
    
    return { totalSessions, completedSessions, totalTime, avgTime };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary-500" />
          Activity Tracker
        </h1>
        <p className="text-slate-600">Track your memorization journey and progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.totalSessions}</div>
          <div className="text-sm text-slate-600">Total Sessions</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.completedSessions}</div>
          <div className="text-sm text-slate-600">Completed</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-amber-600">{formatDuration(stats.totalTime)}</div>
          <div className="text-sm text-slate-600">Total Time</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.avgTime)}</div>
          <div className="text-sm text-slate-600">Avg Time</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-primary-500" />
          <span className="text-lg font-semibold text-slate-800">Filter Activities</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'all', label: 'All', count: activities.length },
            { id: 'hafazan', label: 'Hafazan', count: activities.filter(a => a.sessionType === 'hafazan').length },
            { id: 'murajaah', label: 'Murajaah', count: activities.filter(a => a.sessionType === 'murajaah').length },
            { id: 'completed', label: 'Completed', count: activities.filter(a => a.completed).length },
            { id: 'incomplete', label: 'Incomplete', count: activities.filter(a => !a.completed).length }
          ].map(filterOption => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                filter === filterOption.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Activities Table */}
      <div className="glass-card rounded-xl p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg text-slate-600 mb-2">No activities found</p>
            <p className="text-sm text-slate-500">Start memorizing to see your progress here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Time</th>
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Ayah</th>
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Type</th>
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Duration</th>
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Reps</th>
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="text-left py-4 px-3 text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity, index) => (
                  <motion.tr
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-3 text-sm text-slate-600">{formatDate(activity.timestamp)}</td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-800">
                      {SURAH_NAMES[activity.surahNumber]} {activity.isRange ? `${activity.startAyah}-${activity.endAyah}` : activity.ayahNumber}
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(activity.sessionType)}
                        <span className="text-sm capitalize text-slate-700">{activity.sessionType}</span>
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm font-medium text-slate-800">{formatDuration(activity.duration)}</td>
                    <td className="py-4 px-3 text-sm text-slate-600">
                      {activity.completedReps}/{activity.totalReps}
                    </td>
                    <td className="py-4 px-3">{getStatusBadge(activity)}</td>
                    <td className="py-4 px-3">
                      {!activity.completed && activity.sessionType === 'hafazan' && (
                        <button
                          onClick={() => handleContinueSession(activity)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                          title="Continue this memorization session"
                        >
                          <Play className="w-3 h-3" />
                          Continue
                        </button>
                      )}
                      {!activity.completed && activity.sessionType === 'murajaah' && (
                        <button
                          onClick={() => handleContinueSession(activity)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                          title="Continue this review session"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Continue
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 