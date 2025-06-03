import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, RotateCcw, Check, Star, BookOpen, Settings } from 'lucide-react';
import { quranAPI, RECITERS } from '../utils/api';
import { storage } from '../utils/storage';
import PeekableText from './PeekableText';
import AudioPlayer from './AudioPlayer';
import clsx from 'clsx';

const CircularProgress = ({ progress, size = 60, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary-500 transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default function AyahSession({ 
  surahNumber, 
  ayahNumber, 
  startAyah, 
  endAyah, 
  sessionType = 'hafazan', 
  onComplete, 
  planId,
  resumeData = null
}) {
  const [ayahData, setAyahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(storage.getSettings());
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRepetition, setCurrentRepetition] = useState(1);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState('Alafasy_128kbps');
  const [showReciterSelector, setShowReciterSelector] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [currentActivityId, setCurrentActivityId] = useState(null);

  // Determine if this is a range session
  const isRangeSession = startAyah && endAyah && startAyah !== endAyah;
  const currentAyahNumber = ayahNumber || startAyah;
  const sessionEndAyah = endAyah || ayahNumber;

  const sessionSettings = settings[sessionType];
  const totalVisibleReps = sessionSettings.visibleSets * sessionSettings.repetitionsPerVisibleSet;
  const totalHiddenReps = sessionSettings.hiddenSets * sessionSettings.repetitionsPerHiddenSet;
  const totalReps = totalVisibleReps + totalHiddenReps;

  // Calculate total reps per set (visible + hidden) and number of sets
  const repsPerSet = sessionSettings.repetitionsPerVisibleSet + sessionSettings.repetitionsPerHiddenSet;
  const totalSets = Math.max(sessionSettings.visibleSets, sessionSettings.hiddenSets);

  // Function to calculate set and repetition from completed reps
  const calculatePositionFromReps = (completedReps) => {
    if (completedReps === 0) return { set: 1, repetition: 1 };
    
    const completedSets = Math.floor(completedReps / repsPerSet);
    const repsInCurrentSet = completedReps % repsPerSet;
    
    return {
      set: completedSets + 1,
      repetition: repsInCurrentSet + 1
    };
  };

  // Initialize session state based on resume data
  useEffect(() => {
    if (resumeData && resumeData.completedReps > 0) {
      const position = calculatePositionFromReps(resumeData.completedReps);
      setCurrentSet(position.set);
      setCurrentRepetition(position.repetition);
      setSessionStartTime(Date.now()); // New start time for continued session
      setCurrentActivityId(resumeData.activityId); // Use existing activity
    }
  }, [resumeData]);

  const getCurrentRepNumber = () => {
    // Calculate completed repetitions (not current repetition)
    const completedSets = currentSet - 1;
    const completedInCurrentSet = currentRepetition - 1;
    return (completedSets * repsPerSet) + completedInCurrentSet;
  };

  // Determine current phase based on position within set
  const getCurrentPhase = () => {
    if (currentRepetition <= sessionSettings.repetitionsPerVisibleSet) {
      return 'visible';
    } else {
      return 'hidden';
    }
  };

  // Use calculated phase instead of state
  const actualCurrentPhase = getCurrentPhase();

  const progress = (getCurrentRepNumber() / totalReps) * 100;

  useEffect(() => {
    loadAyah();
  }, [surahNumber, currentAyahNumber]);

  // Separate effect for creating activity record only once when ayahData is loaded
  useEffect(() => {
    if (ayahData && !sessionStartTime && !currentActivityId && !resumeData) {
      const startTime = Date.now();
      setSessionStartTime(startTime);
      
      // Create initial activity record with proper surah name
      const activityData = {
        surahNumber,
        surahName: ayahData.arabic.surah.englishName,
        ayahNumber: currentAyahNumber,
        startAyah,
        endAyah,
        isRange: isRangeSession,
        sessionType,
        planId,
        startTime,
        totalReps,
        completedReps: 0,
        completed: false
      };
      
      const activity = storage.addActivity(activityData);
      setCurrentActivityId(activity.id);
    }
  }, [ayahData, resumeData]);

  // Cleanup effect to handle session abandonment
  useEffect(() => {
    return () => {
      // If session is abandoned (component unmounts) and activity exists but not completed
      if (currentActivityId && !sessionComplete) {
        storage.updateActivity(currentActivityId, {
          completed: false,
          completedReps: getCurrentRepNumber(),
          duration: sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0
        });
      }
    };
  }, [currentActivityId, sessionComplete, sessionStartTime]);

  const loadAyah = async () => {
    try {
      setLoading(true);
      
      if (isRangeSession) {
        // Load multiple ayahs for range session
        const ayahsData = [];
        for (let i = startAyah; i <= endAyah; i++) {
          const data = await quranAPI.getAyahWithTranslation(surahNumber, i, selectedReciter);
          ayahsData.push(data);
        }
        
        // Combine the Arabic text and translations
        const combinedData = {
          arabic: {
            text: ayahsData.map(ayah => ayah.arabic.text).join(' '),
            surah: ayahsData[0].arabic.surah
          },
          translation: {
            text: ayahsData.map((ayah, index) => 
              `(${startAyah + index}) ${ayah.translation.text}`
            ).join(' ')
          }
        };
        
        setAyahData(combinedData);
      } else {
        // Single ayah session
        const data = await quranAPI.getAyahWithTranslation(surahNumber, currentAyahNumber, selectedReciter);
        setAyahData(data);
      }
    } catch (error) {
      console.error('Failed to load ayah:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const maxRepsInCurrentSet = sessionSettings.repetitionsPerVisibleSet + sessionSettings.repetitionsPerHiddenSet;
    
    // Calculate the new completed reps BEFORE updating state
    const newCompletedReps = getCurrentRepNumber() + 1;
    
    if (currentRepetition < maxRepsInCurrentSet) {
      // Continue to next repetition in current set
      setCurrentRepetition(r => r + 1);
    } else {
      // Move to next set
      if (currentSet < totalSets) {
        setCurrentSet(s => s + 1);
        setCurrentRepetition(1);
      } else {
        setSessionComplete(true);
      }
    }

    // Update activity progress with the calculated value
    if (currentActivityId) {
      storage.updateActivity(currentActivityId, { 
        completedReps: newCompletedReps,
        duration: Math.floor((Date.now() - sessionStartTime) / 1000)
      });
    }
  };

  const handleComplete = () => {
    // Mark activity as completed
    if (currentActivityId) {
      storage.updateActivity(currentActivityId, { 
        completed: true,
        completedReps: totalReps,
        duration: Math.floor((Date.now() - sessionStartTime) / 1000)
      });
    }

    // Set session as complete BEFORE calling onComplete to prevent cleanup override
    setSessionComplete(true);

    if (sessionType === 'hafazan') {
      storage.markAyahMemorized(planId, surahNumber, currentAyahNumber);
    } else {
      // Handle range-based murajaah completion
      if (isRangeSession) {
        storage.markMurajaahRangeComplete(planId, surahNumber, startAyah, endAyah);
      } else {
        storage.markMurajaahComplete(planId, surahNumber, currentAyahNumber);
      }
    }
    onComplete();
  };

  const resetSession = () => {
    setCurrentSet(1);
    setCurrentRepetition(1);
    setSessionComplete(false);
    const newStartTime = Date.now();
    setSessionStartTime(newStartTime); // Reset timer when restarting
    
    // Reset the existing activity instead of creating a new one
    if (currentActivityId) {
      storage.updateActivity(currentActivityId, {
        startTime: newStartTime,
        completedReps: 0,
        completed: false,
        duration: 0
      });
    }
  };

  const handleAudioLoad = (url) => {
    console.log('Audio loaded successfully:', url);
    setAudioError(false);
  };

  const handleAudioError = (error) => {
    console.error('Audio failed to load:', error);
    setAudioError(true);
  };

  const handleReciterChange = (newReciter) => {
    setSelectedReciter(newReciter);
    setShowReciterSelector(false);
    // Audio will automatically reload due to the reciter prop change
  };

  const formatSessionDuration = (startTime) => {
    if (!startTime) return '0:00';
    const durationMs = Date.now() - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="nikkei-card rounded-lg p-compact text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: 'var(--nando)' }}></div>
        <p className="text-sm">Loading ayah...</p>
      </div>
    );
  }

  if (!ayahData) {
    return (
      <div className="nikkei-card rounded-lg p-compact">
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
          Failed to load ayah. Please try again.
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="nikkei-card rounded-lg p-compact text-center relative overflow-hidden"
      >
        {/* Celebration Background */}
        <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, var(--kame-nozoki) 0%, var(--shinbashi) 100%)' }}></div>
        
        {/* Confetti Animation */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ background: i % 2 === 0 ? 'var(--nando)' : 'var(--kara-kurenai)' }}
            initial={{ 
              x: Math.random() * 300 - 150, 
              y: -30,
              opacity: 1,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: 300,
              x: Math.random() * 300 - 150,
              opacity: 0,
              rotate: Math.random() * 360
            }}
            transition={{ 
              duration: Math.random() * 1.5 + 1,
              delay: Math.random() * 0.3,
              ease: "easeOut"
            }}
          />
        ))}

        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          transition={{ type: 'spring', delay: 0.2, duration: 0.6 }} 
          className="mb-4 relative z-10"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg relative"
               style={{ background: 'linear-gradient(135deg, var(--nando) 0%, var(--shinbashi) 100%)' }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full opacity-20"
              style={{ background: 'var(--shinbashi)' }}
            />
            <Check className="w-8 h-8 text-white relative z-10" />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10"
        >
          <h2 className="title-compact text-xl mb-2">
            {sessionType === 'hafazan' ? '🎉 Ayah Memorized!' : '✨ Murajaah Complete!'}
          </h2>
          <p className="text-sm mb-3">
            Surah {ayahData.arabic.surah.englishName} - {isRangeSession ? `Ayahs ${startAyah}-${endAyah}` : `Ayah ${currentAyahNumber}`}
          </p>
          
          {/* Achievement Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm font-medium shadow-sm"
            style={{ 
              background: 'rgba(89, 185, 198, 0.1)',
              border: '1px solid rgba(89, 185, 198, 0.3)',
              color: 'var(--nando)'
            }}
          >
            <Star className="w-3 h-3" />
            <span>
              {sessionType === 'hafazan' ? '+1 Ayah Mastered' : '+1 Review Complete'}
            </span>
            <Star className="w-3 h-3" />
          </motion.div>

          {/* Progress Stats */}
          <div className="stat-grid mb-4 text-center">
            <div className="nikkei-card p-3 rounded-md">
              <div className="text-lg font-bold" style={{ color: 'var(--nando)' }}>{totalReps}</div>
              <div className="text-xs">Repetitions</div>
            </div>
            <div className="nikkei-card p-3 rounded-md">
              <div className="text-lg font-bold" style={{ color: 'var(--shinbashi)' }}>{sessionSettings.visibleSets + sessionSettings.hiddenSets}</div>
              <div className="text-xs">Sets Complete</div>
            </div>
            <div className="nikkei-card p-3 rounded-md">
              <div className="text-lg font-bold" style={{ color: 'var(--kara-kurenai)' }}>{formatSessionDuration(sessionStartTime)}</div>
              <div className="text-xs">Time Taken</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center gap-3 relative z-10"
        >
          <motion.button 
            onClick={resetSession} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 btn-secondary rounded-md text-sm font-medium flex items-center gap-2"
          >
            <RotateCcw size={14} /> Again
          </motion.button>
          <motion.button 
            onClick={handleComplete} 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 btn-accent rounded-md text-sm font-medium flex items-center gap-2"
          >
            <Star size={14} /> 
            {sessionType === 'hafazan' ? 'Mark Memorized' : 'Complete Review'}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Progress */}
      <div className="nikkei-card rounded-lg p-compact">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="title-compact text-lg flex items-center gap-2">
              {sessionType === 'hafazan' ? <BookOpen className="w-5 h-5" style={{ color: 'var(--nando)' }} /> : <Star className="w-5 h-5" style={{ color: 'var(--kara-kurenai)' }} />}
              {sessionType === 'hafazan' ? 'Memorization' : 'Murajaah'}
            </h1>
            <p className="text-sm">Surah {ayahData.arabic.surah.englishName} - {isRangeSession ? `Ayahs ${startAyah}-${endAyah}` : `Ayah ${currentAyahNumber}`}</p>
          </div>
          <div className="flex items-center gap-3">
            <CircularProgress progress={progress} />
            {settings.general.showAudioPlayer && (
              <button
                onClick={() => setShowReciterSelector(!showReciterSelector)}
                className="p-2 hover:bg-white/50 rounded-md transition-colors"
                title="Change Reciter"
              >
                <Settings className="w-4 h-4" style={{ color: 'var(--kourai-nando)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Reciter Selector */}
        <AnimatePresence>
          {showReciterSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 p-3 rounded-md border border-white/40"
              style={{ background: 'rgba(89, 185, 198, 0.05)' }}
            >
              <h3 className="text-sm font-semibold mb-2">Select Reciter:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(RECITERS).map(([key, reciter]) => (
                  <button
                    key={key}
                    onClick={() => handleReciterChange(key)}
                    className={clsx(
                      'text-left p-2 rounded-md border transition-all duration-200 text-sm',
                      selectedReciter === key
                        ? 'border-opacity-100 text-white'
                        : 'border-white/30 bg-white/60 hover:border-white/50 hover:bg-white/80'
                    )}
                    style={selectedReciter === key ? { 
                      background: 'var(--nando)', 
                      borderColor: 'var(--nando)' 
                    } : {}}
                  >
                    <div className="font-medium">{reciter.name}</div>
                    <div className="text-xs opacity-75">{reciter.arabicName}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className={clsx('px-2 py-1 rounded-md text-xs font-medium', 
              actualCurrentPhase === 'visible' 
                ? 'text-white' 
                : 'text-white'
            )}
            style={{ 
              background: actualCurrentPhase === 'visible' ? 'var(--nando)' : 'var(--kara-kurenai)' 
            }}>
              {actualCurrentPhase === 'visible' ? 'Visible' : 'Hidden'}
            </span>
            <span className="text-xs">
              Set {currentSet} of {Math.max(sessionSettings.visibleSets, sessionSettings.hiddenSets)}
            </span>
          </div>
          <span className="text-xs">
            Rep {getCurrentRepNumber()} of {totalReps}
          </span>
        </div>
      </div>

      {/* Audio Player */}
      {settings.general.showAudioPlayer && (
        <AudioPlayer
          surahNumber={surahNumber}
          ayahNumber={currentAyahNumber}
          autoPlay={settings.general.autoPlayAudio}
          reciter={selectedReciter}
          onAudioLoad={handleAudioLoad}
          onAudioError={handleAudioError}
          className="w-full"
        />
      )}

      {/* Ayah Display */}
      <div className="nikkei-card rounded-lg p-compact">
        <AnimatePresence mode="wait">
          <motion.div
            key={actualCurrentPhase}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="text-center"
          >
            <PeekableText 
              text={ayahData.arabic.text}
              isHidden={actualCurrentPhase === 'hidden'}
              className="arabic-text-3xl mb-6 leading-relaxed min-h-[120px] p-4 text-center"
            />
            {settings.general.showTranslation && (
              <div className="rounded-md p-3 mb-4 border border-white/30" style={{ background: 'rgba(89, 185, 198, 0.05)' }}>
                <p className="text-sm leading-relaxed">
                  <span className="font-medium">Translation:</span> {ayahData.translation.text}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Session Controls */}
      <div className="nikkei-card rounded-lg p-compact">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={resetSession} className="p-2 btn-secondary rounded-md" title="Reset Session">
              <RotateCcw size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative w-24 h-24 rounded-full shadow-lg border-3 transition-all duration-300 overflow-hidden"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                borderColor: 'rgba(255,255,255,0.6)'
              }}
            >
              {/* Progress Ring */}
              <svg 
                className="absolute inset-0 w-full h-full transform -rotate-90" 
                viewBox="0 0 96 96"
              >
                {/* Background Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="rgba(89, 185, 198, 0.2)"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Progress Circle */}
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="var(--nando)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - (getCurrentRepNumber() / totalReps))}`}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              {/* Button Content */}
              <div className="relative flex flex-col items-center justify-center h-full">
                {/* Phase Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 3, -3, 0] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="mb-1"
                >
                  <Star className="w-6 h-6" style={{ color: 'var(--nando)' }} />
                </motion.div>
                
                {/* Phase Label */}
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--kourai-nando)' }}>
                  {actualCurrentPhase === 'visible' ? 'Read' : 'Test'}
                </div>
                
                {/* Progress Text */}
                <div className="text-xs font-medium opacity-75" style={{ color: 'var(--kourai-nando)' }}>
                  {getCurrentRepNumber()}/{totalReps}
                </div>

                {/* Set Number */}
                <div className="absolute top-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-slate-200 z-10">
                  <span className="text-xs font-bold text-slate-700">{currentSet}</span>
                </div>
              </div>

              {/* Completion Effect */}
              {getCurrentRepNumber() === totalReps && (
                <div className="absolute inset-0 rounded-full opacity-20 animate-pulse" style={{ background: 'var(--shinbashi)' }}></div>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}