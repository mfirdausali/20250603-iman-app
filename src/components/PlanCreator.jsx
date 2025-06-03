import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, X } from 'lucide-react';
import { quranAPI } from '../utils/api';
import clsx from 'clsx';

export default function PlanCreator({ onCreatePlan, onClose, existingPlans = [] }) {
  const [surahList, setSurahList] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [ayahsPerDay, setAyahsPerDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSurahList();
  }, []);

  const loadSurahList = async () => {
    try {
      setLoadingSurahs(true);
      const surahs = await quranAPI.getSurahList();
      setSurahList(surahs);
    } catch (error) {
      setError('Failed to load Surah list');
    } finally {
      setLoadingSurahs(false);
    }
  };

  // Filter out Surahs that already have existing plans
  const availableSurahs = surahList.filter(surah => {
    return !existingPlans.some(plan => plan.surahNumber === surah.number);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSurah || !startDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await onCreatePlan(
        parseInt(selectedSurah), 
        new Date(startDate), 
        ayahsPerDay
      );
      
      onClose();
    } catch (error) {
      setError('Failed to create plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedSurahData = surahList.find(s => s.number === parseInt(selectedSurah));
  const estimatedDays = selectedSurahData 
    ? Math.ceil(selectedSurahData.numberOfAyahs / ayahsPerDay)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                <Plus className="w-5 h-5" />
              </div>
              Create Memorization Plan
            </h2>
            <p className="text-slate-600 mt-1">Start your Quran memorization journey</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Surah Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Select Surah *
            </label>
            {loadingSurahs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-slate-600">Loading Surahs...</span>
              </div>
            ) : availableSurahs.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="text-amber-600 mb-2">📋 All Surahs Used</div>
                  <p className="text-amber-700 text-sm">
                    You already have plans for all available Surahs. Complete or remove existing plans to create new ones.
                  </p>
                </div>
              </div>
            ) : (
              <select 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                value={selectedSurah}
                onChange={(e) => setSelectedSurah(e.target.value)}
                required
              >
                <option value="">Choose a Surah...</option>
                {availableSurahs.map(surah => (
                  <option key={surah.number} value={surah.number}>
                    {surah.number}. {surah.englishName} ({surah.name}) - {surah.numberOfAyahs} ayahs
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Start Date *
            </label>
            <div className="relative">
              <input 
                type="date"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Ayahs per Day */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Ayahs per Day
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setAyahsPerDay(Math.max(1, ayahsPerDay - 1))}
                className="p-2 btn-secondary rounded-lg"
                disabled={ayahsPerDay <= 1}
              >
                -
              </button>
              <span className="w-16 text-center font-semibold text-slate-800 text-lg">
                {ayahsPerDay}
              </span>
              <button
                type="button"
                onClick={() => setAyahsPerDay(Math.min(10, ayahsPerDay + 1))}
                className="p-2 btn-secondary rounded-lg"
                disabled={ayahsPerDay >= 10}
              >
                +
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              💡 Recommended: 1 ayah per day for optimal memorization
            </p>
          </div>

          {/* Plan Summary */}
          {selectedSurahData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Plan Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Surah:</span>
                  <p className="font-semibold text-slate-800">
                    {selectedSurahData.englishName}
                  </p>
                  <p className="text-slate-600 arabic-text-lg">
                    {selectedSurahData.name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Details:</span>
                  <p className="font-semibold text-slate-800">
                    {selectedSurahData.numberOfAyahs} total ayahs
                  </p>
                  <p className="font-semibold text-slate-800">
                    {estimatedDays} days duration
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Completion Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(new Date(startDate).getTime() + (estimatedDays - 1) * 24 * 60 * 60 * 1000)
                      .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              className="flex-1 px-6 py-3 btn-secondary rounded-lg font-semibold"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={clsx(
                "flex-1 px-6 py-3 btn-primary rounded-lg font-semibold flex items-center justify-center gap-2",
                (loading || availableSurahs.length === 0) && "opacity-50 cursor-not-allowed"
              )}
              disabled={loading || !selectedSurah || loadingSurahs || availableSurahs.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : availableSurahs.length === 0 ? (
                <>
                  <Plus className="w-4 h-4" />
                  No Surahs Available
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Plan
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}