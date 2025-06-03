import React, { useState, useEffect } from 'react';
import { Play, Pause, Eye, EyeOff, RotateCcw, Check } from 'lucide-react';
import { quranAPI } from '../utils/api';
import { storage } from '../utils/storage';

export default function AyahDisplay({ 
  surahNumber, 
  ayahNumber, 
  onComplete, 
  planId 
}) {
  const [ayahData, setAyahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [visibleRepetitions, setVisibleRepetitions] = useState(0);
  const [hiddenRepetitions, setHiddenRepetitions] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);
  const [settings, setSettings] = useState(storage.getSettings());
  const [showPeek, setShowPeek] = useState(false);

  useEffect(() => {
    loadAyah();
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [surahNumber, ayahNumber]);

  const loadAyah = async () => {
    try {
      setLoading(true);
      const data = await quranAPI.getAyahWithTranslation(surahNumber, ayahNumber);
      setAyahData(data);
      
      if (settings.autoPlayAudio) {
        setupAudio(data.arabic);
      }
    } catch (error) {
      console.error('Failed to load ayah:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupAudio = (ayahData) => {
    const audioUrl = quranAPI.getAudioUrl(surahNumber, ayahNumber);
    const audioElement = new Audio(audioUrl);
    
    audioElement.addEventListener('ended', () => {
      setIsPlaying(false);
    });
    
    audioElement.addEventListener('error', () => {
      console.error('Audio failed to load');
      setIsPlaying(false);
    });
    
    setAudio(audioElement);
  };

  const toggleAudio = () => {
    if (!audio) {
      if (ayahData) {
        setupAudio(ayahData.arabic);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
  };

  const handleVisibleRepetition = () => {
    const newCount = visibleRepetitions + 1;
    setVisibleRepetitions(newCount);
    
    if (newCount >= settings.repetitionsVisible && !isHidden) {
      setIsHidden(true);
      setHiddenRepetitions(0);
    }
  };

  const handleHiddenRepetition = () => {
    const newCount = hiddenRepetitions + 1;
    setHiddenRepetitions(newCount);
  };

  const togglePeek = () => {
    setShowPeek(!showPeek);
    setTimeout(() => setShowPeek(false), 2000);
  };

  const resetProgress = () => {
    setVisibleRepetitions(0);
    setHiddenRepetitions(0);
    setIsHidden(false);
    setShowPeek(false);
  };

  const completeAyah = () => {
    if (hiddenRepetitions >= settings.repetitionsHidden) {
      onComplete();
    }
  };

  const canComplete = hiddenRepetitions >= settings.repetitionsHidden;
  const progressPercentage = isHidden 
    ? ((hiddenRepetitions / settings.repetitionsHidden) * 100)
    : ((visibleRepetitions / settings.repetitionsVisible) * 100);

  if (loading) {
    return (
      <div className="card">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading ayah...</p>
        </div>
      </div>
    );
  }

  if (!ayahData) {
    return (
      <div className="card">
        <div className="alert alert-error">
          Failed to load ayah. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Surah {ayahData.arabic.surah.englishName} - Ayah {ayahNumber}
        </h2>
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary"
            onClick={resetProgress}
            title="Reset Progress"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            className="btn"
            onClick={toggleAudio}
            disabled={!audio}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      <div className="progress-bar mb-6">
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="mb-6">
        <div className={`arabic-text-2xl ${isHidden && !showPeek ? 'hidden-text' : ''}`}>
          {ayahData.arabic.text}
        </div>
        
        {isHidden && (
          <div className="mt-4 text-center">
            <button 
              className="btn btn-secondary"
              onClick={togglePeek}
            >
              <Eye size={16} className="mr-2" />
              Peek
            </button>
          </div>
        )}
      </div>

      {settings.showTransliteration && (
        <div className="transliteration mb-4">
          {/* Note: AlQuran.cloud doesn't provide transliteration, this would need another API */}
          <em>Transliteration not available from current API</em>
        </div>
      )}

      {settings.showTranslation && (
        <div className="translation mb-6">
          <strong>Translation:</strong> {ayahData.translation.text}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {isHidden ? (
            <span>Hidden repetitions: {hiddenRepetitions}/{settings.repetitionsHidden}</span>
          ) : (
            <span>Visible repetitions: {visibleRepetitions}/{settings.repetitionsVisible}</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isHidden && (
            <button 
              className="btn"
              onClick={handleVisibleRepetition}
            >
              Read Again
            </button>
          )}
          
          {isHidden && (
            <button 
              className="btn"
              onClick={handleHiddenRepetition}
            >
              Recite from Memory
            </button>
          )}
          
          {canComplete && (
            <button 
              className="btn btn-success"
              onClick={completeAyah}
            >
              <Check size={16} className="mr-2" />
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}